export type ProductCategory = {
  id: number;
  name: string;
  status?: string;
  createdAt?: string;
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
export interface Category {
  id: string;
  name: string;
  productCount: number;
  status: "active" | "inactive";
  createdAt: Date;
}
export type DeleteResponse = {
  code: number;
  status: string;
  message: string;
  data: null;
};
