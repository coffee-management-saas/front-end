export type SizeStatus = "ACTIVE" | "INACTIVE" | "OUTOFSTOCK" | "DELETED";

export interface Size {
  id: number;
  code: string;
  status: SizeStatus;
}

export type CreateSizePayload = {
  code: string;
  status: SizeStatus;
};

export type UpdateSizePayload = {
  code: string;
  status: SizeStatus;
};
