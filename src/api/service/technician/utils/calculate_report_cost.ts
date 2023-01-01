import { TechnicianMaterial } from '@api/models/technician/technician_materials';

const taxRate = 21;

export async function calculateEachMaterialCost(
  materialAmounts: { materialId: number; amount: number }[],
  { isAssistance }: { isAssistance: boolean },
): Promise<
  {
    materialId: number;
    amount: number;
    unitPrice: string | null;
    totalPrice: string | null;
  }[]
> {
  if (!isAssistance) {
    // installation reports for installation tasks has no material cost
    return materialAmounts.map((e) => {
      return {
        materialId: e.materialId,
        amount: e.amount,
        unitPrice: null,
        totalPrice: null,
      };
    });
  }

  const materials = await TechnicianMaterial.findAll({
    where: {
      id: materialAmounts.map((e) => e.materialId),
    },
  });

  if (materials.length !== materialAmounts.length) {
    throw new Error('some materials not found');
  }

  const materialsMap = Object.fromEntries(materials.map((e) => [e.id, e]));

  return materialAmounts.map((e) => {
    const unitPrice = materialsMap[e.materialId]?.unitPrice ?? null;

    return {
      materialId: materialsMap[e.materialId].id,
      amount: e.amount,
      unitPrice,
      totalPrice: unitPrice
        ? (Number(e.amount) * Number(unitPrice)).toFixed(2)
        : null,
    };
  });
}

function calculateInstallationOperationalCost(_elapsedTime: number) {
  return '48.76';
}

function calculateAssistanceOperationalCost(elapsedTime: number) {
  const intervals = Math.ceil(elapsedTime / 30);
  return intervals * 15;
}

export function calculateReportCost(report: {
  isAssistance: boolean;
  elapsedTime: number; // in minutes
  customOperationalCost?: number;
  customMaterialCost?: number;
  materials: {
    materialId: number;
    amount: number;
    unitPrice: string | null;
    totalPrice: string | null;
  }[];
}) {
  const operationalCost = report.isAssistance
    ? calculateAssistanceOperationalCost(report.elapsedTime)
    : calculateInstallationOperationalCost(report.elapsedTime);

  const materialCost = report.materials
    .reduce((acc, e) => (e.totalPrice ? acc + Number(e.totalPrice) : acc), 0)
    .toFixed(2);

  const subTotalCost = (
    Number(report.customMaterialCost || materialCost) +
    Number(report.customOperationalCost || operationalCost)
  ).toFixed(2);

  const totalCost = (Number(subTotalCost) * ((100 + taxRate) / 100)).toFixed(2);

  return {
    materialCost,
    operationalCost,
    taxRate,
    subTotalCost,
    totalCost,
    customMaterialCost:
      Number(report.customMaterialCost) == Number(materialCost)
        ? null
        : report.customMaterialCost,
    customOperationalCost:
      Number(report.customOperationalCost) == Number(operationalCost)
        ? null
        : report.customOperationalCost,
  };
}
