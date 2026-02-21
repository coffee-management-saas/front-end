export type EmployeeType = "FULL_TIME" | "PART_TIME" | "TEMPORARY" | string;

export type ShopEmployeeDetail = {
  employeeId?: number;
  shopId?: number;
  userProfileId?: number;
  employeeType: EmployeeType;
  hourlyWage: number;
  weeklyHourLimit: number;
  updatedAt?: string;
};

export type ShopEmployeeProfile = {
  userProfileId?: number;
  username: string;
  fullname: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  createdAt?: string;
  employee?: ShopEmployeeDetail;
};

export type CreateShopEmployeeRequest = {
  userProfileId?: number;
  username: string;
  password?: string;
  fullname: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  createdAt?: string;
  employee?: ShopEmployeeDetail;
  employeeType?: EmployeeType;
  hourlyWage?: number;
  weeklyHourLimit?: number;
  shopId?: number;
};

export type CreateShopEmployeeResponse =
  | {
      code?: number;
      status?: string;
      message?: string;
      data?: ShopEmployeeProfile | null;
    }
  | ShopEmployeeProfile
  | null;
