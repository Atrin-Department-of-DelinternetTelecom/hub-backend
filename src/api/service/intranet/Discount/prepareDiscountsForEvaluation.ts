import { AnyModel, intranet } from '@models';
import { groupBy } from 'lodash';
import assert from 'assert';
import { evaluateToApplyDiscount } from './evaluateToApplyDiscount';

const {
  GfDiscountsPending,
  GfDiscountsExecuted,
  GfContract,
  MatrixReplacementCombinationSet,
  MatrixReplacementCombinationRule,
} = intranet;

export const prepareDiscountsForEvaluation = async (
  clientId: number,
  ambiguousExecuteFirst = true,
  discountMatrixId?: number,
  todayIs?: string,
  userId?: number,
): Promise<{
  success: boolean;
  executedIds: Array<number>;
  scheduled: Array<Array<AnyModel>>;
  bonosAdded: Array<AnyModel | undefined>;
}> => {
  let possibles = await loadAndPreparePossibles(
    clientId,
    ambiguousExecuteFirst,
  );
  const { idToActorsMap, actorToIdsMap } = buildActorIndexMaps(possibles);
  possibles = sortPossiblesByUsedSize(possibles);

  const { activeCombinations, activeCombinationNodes } =
    await loadActiveCombinations(clientId, possibles);

  const executedIds: number[] = [];
  const scheduled: Array<AnyModel[]> = [];
  const bonosAdded: Array<AnyModel | undefined> = [];

  while (possibles.length > 0) {
    const possible = possibles[0];

    const result = await evaluateToApplyDiscount({
      possible,
      discountMatrixId,
      todayIs,
      userId,
      activeCombinations,
      activeCombinationNodes,
    });

    if (result) {
      const { executedId, scheduledRows, bonoAdded } = result;

      executedIds.push(executedId);
      scheduled.push(scheduledRows);
      bonosAdded.push(bonoAdded);

      possibles = await removeConflictingPending(
        possible,
        possibles,
        idToActorsMap,
        actorToIdsMap,
      );
    }

    await possible.update({ status: 0 });
    possibles = possibles.filter((p) => p.id !== possible.id);
  }

  return {
    success: true,
    executedIds,
    scheduled,
    bonosAdded,
  };
};

const loadAndPreparePossibles = async (
  clientId: number,
  ambiguous: boolean,
): Promise<AnyModel[]> => {
  //@ts-ignore
  const possibles = await GfDiscountsPending.getPossiblesByClientId(
    clientId,
    ambiguous,
  );
  return sortPossiblesByUsedSize(possibles);
};

function sortPossiblesByUsedSize(possibles: AnyModel[]): AnyModel[] {
  return possibles.slice().sort((a, b) => {
    const aUsed = parseUsed(a.used);
    const bUsed = parseUsed(b.used);
    return bUsed.length - aUsed.length;
  });
}

function parseUsed(used: any): any[] {
  if (Array.isArray(used)) return used;
  try {
    const parsed = JSON.parse(used);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildActorIndexMaps(possibles: AnyModel[]) {
  const idToActorsMap = new Map<number, Set<number>>();
  const actorToIdsMap = new Map<number, Set<number>>();

  for (const p of possibles) {
    const used = parseUsed(p.used);
    const actorIds = used
      .filter(
        (item) => item.type === 'contract' && typeof item.typeId === 'number',
      )
      .map((item) => item.typeId);

    const actorSet = new Set(actorIds);
    idToActorsMap.set(p.id, actorSet);

    for (const actorId of actorSet) {
      if (!actorToIdsMap.has(actorId)) actorToIdsMap.set(actorId, new Set());
      actorToIdsMap.get(actorId)!.add(p.id);
    }
  }

  return { idToActorsMap, actorToIdsMap };
}

async function removeConflictingPending(
  executed: AnyModel,
  possibles: AnyModel[],
  idToActorsMap: Map<number, Set<number>>,
  actorToIdsMap: Map<number, Set<number>>,
): Promise<AnyModel[]> {
  const executedActors = idToActorsMap.get(executed.id);
  if (!executedActors) return possibles;

  const conflictIds = new Set<number>();
  for (const actorId of executedActors) {
    const ids = actorToIdsMap.get(actorId);
    if (ids) ids.forEach((id) => conflictIds.add(id));
  }

  const toDisable = possibles.filter(
    (p) => conflictIds.has(p.id) && p.id !== executed.id,
  );
  await Promise.all(toDisable.map((p) => p.update({ status: 0 })));

  return possibles.filter((p) => !conflictIds.has(p.id));
}

async function loadActiveCombinations(clientId: number, possibles: AnyModel[]) {
  const activeExecuteds = await GfDiscountsExecuted.findAll({
    where: { '$contract.clientId$': clientId, active: 1 },
    include: [{ model: GfContract, as: 'contract' }],
  });

  const matrixIndexed = makeAvailableMatrixIndexedForClient(
    possibles,
    activeExecuteds,
  );
  const combinations = await makeMatrixIndexedCombinations();
  const activeCombinations = findActiveCombinations(
    matrixIndexed,
    combinations,
  );

  const activeCombinationNodes = groupBy(
    Object.values(activeCombinations).flat(1),
    'matrixId',
  );

  return { activeCombinations, activeCombinationNodes };
}

function makeAvailableMatrixIndexedForClient(
  possibles: AnyModel[],
  actives: AnyModel[],
) {
  const possiblesGroupByMatrixId = groupBy(possibles, 'matrixId');
  const activesGroupByMatrixId = groupBy(actives, 'matrixId');

  const merged: Record<
    string,
    { matrixId: number; reference: string; id: number; contractId: number }[]
  > = {};
  const allKeys = new Set([
    ...Object.keys(possiblesGroupByMatrixId),
    ...Object.keys(activesGroupByMatrixId),
  ]);

  for (const key of allKeys) {
    const modelsFromObj1 = (possiblesGroupByMatrixId[key] || []).map((p) => ({
      matrixId: p.matrixId,
      reference: 'possible',
      id: p.id,
      contractId: p.contractId,
    }));
    const modelsFromObj2 = (activesGroupByMatrixId[key] || []).map((p) => ({
      matrixId: p.matrixId,
      reference: 'executed',
      id: p.id,
      contractId: p.targetContractId,
    }));
    merged[key] = [...modelsFromObj2, ...modelsFromObj1];
  }

  return merged;
}

async function makeMatrixIndexedCombinations() {
  const matrixIndexedCombinations: Record<string, number[][]> = {};
  const combinationSets = await MatrixReplacementCombinationSet.findAll({
    include: [
      {
        model: MatrixReplacementCombinationRule,
        as: 'combinationSetRules',
      },
    ],
  });

  for (const combinationSet of combinationSets) {
    if (!matrixIndexedCombinations[combinationSet.matrixId]) {
      matrixIndexedCombinations[combinationSet.matrixId] = [];
    }

    matrixIndexedCombinations[combinationSet.matrixId].push(
      combinationSet.combinationSetRules.map((rule: AnyModel) => rule.matrixId),
    );
  }

  return matrixIndexedCombinations;
}

function findActiveCombinations(
  matrixList: Record<
    string,
    { matrixId: number; reference: string; id: number; contractId: number }[]
  >,
  matrixIndexedCombinations: Record<string, number[][]>,
) {
  const acceptedCombinations: Record<
    string,
    { matrixId: number; reference: string; id: number; contractId: number }[]
  > = {};

  for (const [matrixId, combinations] of Object.entries(
    matrixIndexedCombinations,
  )) {
    for (const combination of combinations) {
      let acceptMatrix = true;
      const matrixListForCheck = { ...matrixList };
      const acceptedTempCombination: {
        matrixId: number;
        reference: string;
        id: number;
        contractId: number;
      }[] = [];

      for (const combinedMatrixId of combination) {
        if (!matrixListForCheck[combinedMatrixId]?.length) {
          acceptMatrix = false;
          break;
        } else {
          const possible = matrixListForCheck[combinedMatrixId].pop();
          assert(possible, 'possible not found');
          acceptedTempCombination.push(possible);
        }
      }

      if (acceptMatrix) {
        if (!acceptedCombinations[matrixId])
          acceptedCombinations[matrixId] = [];
        acceptedCombinations[matrixId].push(...acceptedTempCombination);
        matrixList = { ...matrixListForCheck };
      }
    }
  }

  return acceptedCombinations;
}
