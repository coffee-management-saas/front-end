export type IngredientBaseUnit =
  | "GRAM"
  | "KILOGRAM"
  | "LITER"
  | "MILLILITER"
  | "PIECE"
  | "PAIR";

export type IngredientStorageType =
  | "NORMAL"
  | "COOL"
  | "FROZEN"
  | "DRY"
  | "REFRIGERATED";

export type IngredientInventoryStatus = "ACTIVE" | "INACTIVE" | "DELETED";

export type IngredientDto = {
  id: number;
  name: string;
  skuCode: string;
  baseUnit: IngredientBaseUnit;
  minStockAlert: number;
  storageType: IngredientStorageType;
  totalStockQuantity: number;
  inventoryStatus: IngredientInventoryStatus;
};

export type IngredientInput = {
  name: string;
  skuCode: string;
  baseUnit: IngredientBaseUnit;
  minStockAlert: number;
  storageType: IngredientStorageType;
  inventoryStatus: IngredientInventoryStatus;
};

export type IngredientsMeta = {
  currentPage: number;
  size: number;
  lastPage: number;
  totalElements: number;
};

export type IngredientsResponse = {
  code: number;
  status: string;
  message: string;
  data: IngredientDto[];
  meta: IngredientsMeta;
};

export type IngredientResponse = {
  code: number;
  status: string;
  message: string;
  data: IngredientDto;
};
