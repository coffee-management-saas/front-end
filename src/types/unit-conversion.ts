export type UnitConversionInput = {
  ingredientId: number;
  fromUnit: string;
  toUnit: string;
  conversionFactor: number;
  isStandard: boolean;
};

export type UnitConversionDto = {
  id: number;
  ingredientId: number;
  ingredientName?: string | null;
  fromUnit: string;
  toUnit: string;
  conversionFactor: number;
  isStandard: boolean;
  inventoryStatus?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type UnitConversionResponse = {
  code: number;
  status?: string;
  message?: string;
  data: UnitConversionDto;
};
