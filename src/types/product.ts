// src/types/product.ts

export type ProductStatus = "ACTIVE" | "INACTIVE";

export interface Product {
  categoryId: number;
  categoryName: string;
  description: string | null;
  id: number;
  image: string | null;
  name: string;
  status: ProductStatus;
}

export interface ProductsMeta {
  currentPage: number;
  size: number;
  lastPage: number;
  totalElements: number;
}

export interface ApiEnvelope<T> {
  code: number;
  status: string; // "OK" | ...
  message: string;
  data: T;
  meta?: ProductsMeta;
}

export type ProductsResponse = ApiEnvelope<Product[]>;

export interface ProductFilter {
  page: number;
  size: number;
  categoryId?: number;
  status?: ProductStatus;
}
