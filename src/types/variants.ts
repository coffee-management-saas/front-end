export type VariantStatus = "ACTIVE" | "INACTIVE";

export interface Variant {
  id: number;
  costPrice: number;
  price: number;
  productName: string;
  sizeCode: string;
  skuCode: string;
  status: VariantStatus;
}

export interface VariantsMeta {
  currentPage: number;
  size: number;
  lastPage: number;
  totalElements: number;
}

export interface VariantsResponse {
  code: number;
  status: string;
  message: string;
  data: Variant[];
  meta?: VariantsMeta;
}

export type VariantFilter = {
  page: number;
  size: number;
  productId: number | string;
  status?: VariantStatus;
};
export type CreateVariantPayload = {
  productId: number | string;
  sizeId: number | string;
  price: number;
  costPrice: number;
  skuCode: string;
  status: Variant["status"];
};