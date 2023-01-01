import { AnyModel, allModels } from '@models';
import _ from 'lodash';

type ModelName = keyof typeof allModels;

type StringIndexedObject = { [key: string]: unknown };

interface JoinSelector {
  model: string;
  required: boolean;
  as: string;
  attributes?: string[];
  include?: JoinSelector[];
}
type QueryCondition = {
  where: Record<string, unknown>;
  include: JoinObject[];
};

interface JoinObject {
  model: AnyModel;
  required: boolean;
  as: string;
  attributes?: string[];
  include?: JoinObject[];
}
type ReferencedColumnDetail = {
  referencedTable: {
    name: string;
  };
  referencedColumn: string;
  associations: string[];
};
type ColumnAttributes = {
  references?: {
    model: { name: string };
    key: string;
  };
};
interface CustomActionEventData {
  typeId: number;
  eventId: number;
  userId: number;
  resourceId: number;
  clientId: number;
  resourceType: string;
  payload: { [key: string]: unknown };
  changes: { [key: string]: unknown };
  original: { [key: string]: unknown };
  rootJoinData: { [key: string]: unknown };
}

const hasOwnProperty = (obj: object, prop: string) => prop in obj;

export const createCustomActionEvent = async (
  customActionType: AnyModel,
  actionEvent: AnyModel,
) => {
  const { CustomActionEvent } = allModels;
  const changes = actionEvent.get('changes');
  const payload = actionEvent.get('payload');
  const original = actionEvent.get('original');
  const keys = customActionType.get('keys');
  const matchingKeys = Object.keys(keys).filter((key) => {
    if (customActionType.action === 'Delete') {
      return hasOwnProperty(original, key);
    } else {
      return hasOwnProperty(changes, key);
    }
  });
  if (matchingKeys.length > 0) {
    const customActionEventData: CustomActionEventData = {
      typeId: customActionType.get('id'),
      eventId: actionEvent.get('id'),
      userId: actionEvent.get('user_id'),
      resourceId: actionEvent.get('resource_id'),
      clientId: actionEvent.get('resource_id'),
      resourceType: actionEvent.get('resource_type'),
      payload: {},
      changes: {},
      original: {},
      rootJoinData: {},
    };
    for (const key of matchingKeys) {
      if (hasOwnProperty(payload, key)) {
        const value = payload[key];
        customActionEventData.payload[key] = value;
      }
      if (hasOwnProperty(changes, key)) {
        const value = await updateCustomActionEventField({
          customActionType,
          fieldData: changes,
          fieldKey: key,
        });
        customActionEventData.changes[key] = value;
      }

      if (hasOwnProperty(original, key)) {
        const value = await updateCustomActionEventField({
          customActionType,
          fieldData: original,
          fieldKey: key,
        });
        customActionEventData.original[key] = value;
      }
    }
    if (!_.isEmpty(customActionType.root_join_selector)) {
      try {
        const { clientId, rootJoinData } = await updateRootJoinData(
          customActionType,
          actionEvent,
        );
        customActionEventData.clientId = clientId;
        customActionEventData.rootJoinData = rootJoinData;
      } catch (error) {
        console.error('could not find clientId and rootJoinData', error);
      }
    }
    await CustomActionEvent.create(customActionEventData);
  }
};
const updateRootJoinData = async (
  customActionType: AnyModel,
  actionEvent: AnyModel,
) => {
  try {
    const sourceModel = getModelByName(customActionType.resource_type);
    if (!sourceModel) {
      throw new Error(
        `Source model not found for resource type: ${customActionType.resource_type}`,
      );
    }
    const joinObject = createJoinSelectorRecursive(
      customActionType.root_join_selector,
    );
    if (!joinObject) {
      throw new Error(
        'Could not create join object even it exists in the the type',
      );
    }
    const resource_id = actionEvent.get('resource_id');
    let result: AnyModel | null;

    try {
      const queryConditions: QueryCondition = {
        where: { id: resource_id },
        include: [joinObject],
      };
      if (customActionType.action === 'Delete') {
        queryConditions.where.status = 0;
      }
      result = await sourceModel.findOne(queryConditions);
    } catch (error: unknown) {
      const queryError = error as Error;
      throw new Error('Error executing the query: ' + queryError.message);
    }
    if (result) {
      const joinedData = getJoinDataRecursively(joinObject, result);
      if (!joinedData) {
        throw new Error(
          'There is a problem in joining root data, joinedData is null',
        );
      }
      const clientId = getLastLeafOfJoinDataRecursively<number>(
        joinObject,
        result,
      );
      if (clientId !== undefined && clientId !== null) {
        return { clientId, rootJoinData: joinedData };
      } else {
        throw new Error(
          'There is a problem in joining root data, could not find clientId',
        );
      }
    } else {
      throw new Error('There is a problem in joining root data');
    }
  } catch (error) {
    console.error('Error while creating join selector recursively:', error);
    throw error;
  }
};
export const updateCustomActionEventField = async (params: {
  customActionType: AnyModel;
  fieldData: StringIndexedObject;
  fieldKey: string;
}) => {
  const { customActionType, fieldData, fieldKey } = params;
  const referencedColumns = getReferencedColumns(
    getModelByName(customActionType.resource_type),
  );

  const sourceDetail = referencedColumns[fieldKey];
  const fieldValue = fieldData[fieldKey];
  if (sourceDetail) {
    const { referencedTable, referencedColumn } = sourceDetail;
    const sourceModel = getModelByName(referencedTable.name);
    const value = await sourceModel.findOne({
      where: { [referencedColumn]: fieldValue },
      include: { all: true, required: false },
    });

    if (value) {
      try {
        const attributesToRetrieve = Object.keys(
          customActionType.get('keys')[fieldKey].attributes,
        );
        const selectedAttributes = attributesToRetrieve.reduce((acc, attr) => {
          if (!hasOwnProperty(value, attr)) {
            console.error(
              `Attribute "${attr}" does not exist on the value object. in ${referencedTable.name}`,
            );
            return acc;
          }
          acc[attr] = value[attr];
          return acc;
        }, {} as { [key: string]: unknown });
        return selectedAttributes;
      } catch (error) {
        console.error('Failed to retrieve attributes:', error);
      }
    }
  }
  return fieldValue;
};

export const getModelByName = (modelName: ModelName): AnyModel => {
  const model = allModels[modelName];
  if (model === null || model === undefined) {
    console.log(`Could not find the ${modelName} from the allModels`);
  }
  return model;
};

export const createJoinSelectorRecursive = (
  joinSelector: JoinSelector,
): JoinObject | null => {
  if (!joinSelector) {
    return null;
  }
  const sourceModel = getModelByName(joinSelector.model);

  if (!sourceModel) {
    console.log(`Join Selector could not find the ${joinSelector.model}`);
    return null;
  }

  const joinObject: JoinObject = {
    model: sourceModel,
    required: true,
    as: joinSelector.as,
  };
  if (joinSelector.attributes) {
    joinObject.attributes = joinSelector.attributes;
  }

  if (joinSelector.include) {
    const include = joinSelector.include
      .map((nestedJoin) => createJoinSelectorRecursive(nestedJoin))
      .filter((nestedJoin): nestedJoin is JoinObject => nestedJoin !== null);
    joinObject.include = include;
  }

  return joinObject;
};
export const getJoinDataRecursively = (
  joinObject: JoinObject,
  result: AnyModel,
) => {
  const joinData = result.get(joinObject.as);

  if (!joinData) {
    return null;
  }
  const data = { [joinObject.as]: joinData.dataValues };

  if (joinObject.include) {
    for (const nestedJoin of joinObject.include) {
      const nestedJoinData = getJoinDataRecursively(nestedJoin, result);
      if (nestedJoinData) {
        data[nestedJoin.as] = nestedJoinData;
      }
    }
  }

  return data;
};
export const getLastLeafOfJoinDataRecursively = <T>(
  joinObject: JoinObject,
  result: AnyModel,
): T | null => {
  const joinData = result.get(joinObject.as);
  if (!joinData) {
    return null;
  }
  if (joinObject.include) {
    const nestedJoin = joinObject.include[0];
    const nestedJoinData = getLastLeafOfJoinDataRecursively<T>(
      nestedJoin,
      joinData,
    );
    return nestedJoinData;
  } else {
    if (joinObject.attributes && joinObject.attributes.length > 0) {
      return joinData[joinObject.attributes[0]];
    } else {
      console.error('JoinObject attributes are missing or empty.');
      return null;
    }
  }
};

export const getAllAssociationsToKey = (model: AnyModel, keyName: string) => {
  const associationsToKey: string[] = [];

  const associations = model.associations;
  for (const associationName in associations) {
    const association = associations[associationName];
    if (association.foreignKey === keyName) {
      associationsToKey.push(association?.as);
    }
  }

  return associationsToKey;
};
export const getReferencedColumns = (model: AnyModel) => {
  const referencedColumns: Record<string, ReferencedColumnDetail> = {};

  const tableAttributes = model.tableAttributes;

  for (const [columnName, column] of Object.entries(tableAttributes) as [
    string,
    ColumnAttributes,
  ][]) {
    if (column.references) {
      const referencedTable = column.references.model;
      const referencedColumn = column.references.key;
      if (referencedTable && referencedColumn) {
        const associations = getAllAssociationsToKey(model, columnName);
        referencedColumns[columnName] = {
          referencedTable,
          referencedColumn,
          associations,
        };
      }
    }
  }

  return referencedColumns;
};
