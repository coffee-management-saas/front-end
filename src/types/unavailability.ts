export type EmployeeUnavailabilityStatus = "ACTIVE" | "INACTIVE" | string;

export type EmployeeUnavailabilityDto = {
  employeeUnavailabilityId: number;
  employeeId: number;
  employeeName: string;
  reason: string;
  startTime: string;
  endTime: string;
  specificDate: string;
  isRecurring: boolean;
  status: EmployeeUnavailabilityStatus;
};

export type UnavailabilityMeta = {
  currentPage: number;
  size: number;
  lastPage: number;
  totalElements: number;
};

export type UnavailabilityListResponse = {
  code: number;
  status?: string;
  message?: string;
  data: EmployeeUnavailabilityDto[];
  meta?: UnavailabilityMeta;
};

export type CreateUnavailabilityInput = {
  employeeId: number;
  reason: string;
  startTime: string;
  endTime: string;
  specificDate: string;
  isRecurring: boolean;
  status?: EmployeeUnavailabilityStatus;
};

export type CreateUnavailabilityResponse = {
  code: number;
  status?: string;
  message?: string;
  data: EmployeeUnavailabilityDto;
};

export type UpdateUnavailabilityInput = CreateUnavailabilityInput;

export type UpdateUnavailabilityResponse = {
  code: number;
  status?: string;
  message?: string;
  data: EmployeeUnavailabilityDto;
};

