export type RecipeItemInput = {
  ingredientId: number;
  quantityRequired: number;
  note?: string | null;
};

export type RecipeCreateInput = {
  variantId: number;
  toppingId: number;
  items: RecipeItemInput[];
};

export type RecipeItemDto = {
  id: number;
  ingredientId: number;
  ingredientName?: string | null;
  unitName?: string | null;
  variantId: number;
  toppingId: number;
  quantityRequired: number;
  note?: string | null;
};

export type RecipeResponse = {
  code: number;
  status?: string;
  message?: string;
  data: RecipeItemDto[];
};
export type IngredientsApiResponse = {
  code?: number;
  message?: string;
  data?: unknown;
};

export type RecipeApiResponse = {
  code?: number;
  message?: string;
  data?: unknown;
};

export type VariantsApiResponse = {
  code?: number;
  message?: string;
  data?: unknown;
};

export type ProductsApiResponse = {
  code?: number;
  message?: string;
  data?: unknown;
};

export type ToppingsApiResponse = {
  code?: number;
  message?: string;
  data?: unknown;
};

export type RecipeItemForm = {
  ingredientId: number;
  quantityRequired: number;
  note: string;
};

export type RecipeForm = {
  variantId: number;
  toppingId: number;
  items: RecipeItemForm[];
};
