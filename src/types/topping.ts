// types/topping.ts

export type ToppingStatus = "ACTIVE" | "INACTIVE";

export interface ToppingDto {
  id: number;
  name: string;
  price: number;
  status: ToppingStatus;
}

export interface PaginationMeta {
  currentPage: number;
  size: number;
  lastPage: number;
  totalElements: number;
}

export interface ApiResponse<TData, TMeta = undefined> {
  code: number;
  status: string;
  message: string;
  data: TData;
  meta?: TMeta;
}

// ✅ Type dùng cho UI (vì UI cần quantity)
export type ToppingItem = ToppingDto & { quantity: number };

export type ToppingsResponse = ApiResponse<ToppingDto[], PaginationMeta>;
