export type StockCheckDetail = {
  ingredientId: number;
  ingredientName: string;
  snapshotQuantity: number;
  actualQuantity: number;
  diffQuantity: number;
  reason: string | null;
};

export type StockCheckSession = {
  id: number;
  code: string;
  startedAt: string | null;
  completedAt: string | null;
  inventoryStatus: "ACTIVE" | "INACTIVE" | "DELETED";
  createdByName: string | null;
  isApproved: boolean;
  details: StockCheckDetail[];
};

export type StockChecksMeta = {
  currentPage: number;
  size: number;
  lastPage: number;
  totalElements: number;
};

export type StockChecksResponse = {
  code: number;
  status: string;
  message: string;
  data: StockCheckSession[];
  meta: StockChecksMeta;
};

export type StockCheckStartPayload = {
  code: string;
  note: string;
  ingredientIds: number[];
};

export type StockCheckStartResponse = {
  code: number;
  status: string;
  message: string;
  data: StockCheckSession;
};

export type StockCheckUpdateDetail = {
  ingredientId: number;
  actualQuantity: number;
  reason: string | null;
};

export type StockCheckUpdatePayload = {
  sessionId: number;
  details: StockCheckUpdateDetail[];
};

export type StockCheckUpdateResponse = {
  code: number;
  status: string;
  message: string;
  data: StockCheckSession;
};

export type StockCheckApprovePayload = {
  sessionId: number;
  isApproved: boolean;
  note: string;
};

export type StockCheckApproveResponse = {
  code: number;
  status: string;
  message: string;
  data: StockCheckSession;
};
