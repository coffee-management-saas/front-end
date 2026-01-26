export interface ProfileData {
  customerId: string;
  username: string;
  fullname: string;
  rankId: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}
export type UpdateProfileBody = Partial<
  Pick<ProfileData, "fullname" | "email" | "phone" | "address" | "dob">
>;
