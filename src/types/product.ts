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

export interface Size {
  id: number;
  name: string;
  code: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  code: string;
  price: number;
  size?: string | Size;
  sizeCode?: string;
  name?: string;
  image: string | null;
}

export interface ProductsMeta {
  currentPage: number;
  size: number;
  lastPage: number;
  totalElements: number;
}

export interface ApiEnvelope<T> {
  code: number;
  status: string;
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
export type ProductInput = {
  name: string;
  categoryId: number;
  description?: string | null;
  image?: string | null;
  status?: Product["status"];
};