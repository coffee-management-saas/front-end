// src/types/category.ts

export type ProductCategory = {
  id: number;
  name: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CategoryMeta = {
  currentPage: number;
  size: number;
  lastPage: number;
  totalElements: number;
};

export type ProductCategoriesResponse = {
  code: number;
  status: string;
  message: string;
  data: ProductCategory[];
  meta: CategoryMeta;
};
//UI type mẫu
export interface Category {
  id: string;
  name: string;
  description: string;
  image?: string;
  productCount: number;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}
