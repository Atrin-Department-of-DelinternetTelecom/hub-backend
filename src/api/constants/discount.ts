export enum TYPE {
  CHARGE = 'charge',
  DISCOUNT = 'discount',
}

export enum DISCOUNT_TYPE {
  FIX = 'fix',
  PERCENTAGE = 'percentage',
}

export enum MOVEMENT_ACTIONS {
  INSERT = 'scheduled',
  APPLIED = 'applied',
  UPDATE = 'edited',
  DELETE = 'deleted',
  PARTIALLY_APPLIED = 'partialApplied',
}
