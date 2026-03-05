export type CustomerStatus = "ACTIVE" | "INACTIVE" | "DELETED" | string;

export type CustomerDto = {
  customerId: number;
  username: string;
  fullname: string;
  rankId?: string | number;
  email: string;
  phone: string;
  address: string;
  dob?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: CustomerStatus;
};

export type CustomersMeta = {
  currentPage: number;
  size: number;
  lastPage: number;
  totalElements: number;
};

export type CustomersResponse = {
  code: number;
  status?: string;
  message?: string;
  data: CustomerDto[];
  meta?: CustomersMeta;
};

export type CustomerDetailResponse = {
  code: number;
  status?: string;
  message?: string;
  data: CustomerDto;
};

export type UpdateCustomerInput = {
  fullname: string;
  phone: string;
  email: string;
  address: string;
  dob: string;
};

export type CustomersFilter = {
  page: number;
  size: number;
};
