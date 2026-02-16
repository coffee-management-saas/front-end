// types/employee.ts

// 1. Employee type
export type EmployeeType = "PART_TIME" | "FULL_TIME" | "TEMPORARY";

// 2. Core employee model (BE trả về)
export interface Employee {
  employeeId: number;
  employeeType: EmployeeType;
  hourlyWage: number;
  weeklyHourLimit: number;
  shopId: number | null;
  userProfileId: number | null;
  updatedAt: string; // ISO date string
}

// 3. Pagination meta
export interface PaginationMeta {
  currentPage: number;
  size: number;
  lastPage: number;
  totalElements: number;
}

// 4. Generic API response
export interface ApiResponse<T> {
  code: number;
  status: string;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

// 5. API responses
export type EmployeeResponse = ApiResponse<Employee[]>;
export type CreateEmployeeResponse = ApiResponse<Employee>;

// 6. Create employee request (form / submit)
export interface CreateEmployeeRequest {
  userProfileId: number;
  employeeType: EmployeeType;
  hourlyWage: number;
  weeklyHourLimit: number;
}
