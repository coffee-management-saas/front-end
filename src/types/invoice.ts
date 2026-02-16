export type InvoiceItem = {
  ingredientId: number;
  ingredientName: string;
  inputUnit: string;
  inputQuantity: number;
  unitPrice: number;
  convertedQuantity: number;
  baseUnit: string;
  batchCode: string;
  expiredAt: string;
};

export type InvoiceCreateItem = {
  ingredientId: number;
  inputUnit: string;
  inputQuantity: number;
  unitPrice: number;
  batchCode: string;
  expiredAt: string;
};

export type InvoiceDto = {
  id: number;
  code: string;
  supplierName: string;
  totalAmount: number;
  invoiceImageUrl: string | null;
  importedAt: string;
  createdByName: string | null;
  items: InvoiceItem[];
};

export type InvoiceCreateInput = {
  code: string;
  supplierName: string;
  invoiceImageUrl?: string | null;
  note?: string | null;
  items: InvoiceCreateItem[];
};

export type InvoicesMeta = {
  currentPage: number;
  size: number;
  lastPage: number;
  totalElements: number;
};

export type InvoicesResponse = {
  code: number;
  status: string;
  message: string;
  data: InvoiceDto[];
  meta: InvoicesMeta;
};

export type InvoiceResponse = {
  code: number;
  status: string;
  message: string;
  data: InvoiceDto;
};
