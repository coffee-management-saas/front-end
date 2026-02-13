export type SizeStatus = "ACTIVE" | "INACTIVE";

export interface Size {
  sizeId: number;
  code: string;
  status: SizeStatus;
}
