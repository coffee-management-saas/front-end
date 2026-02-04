export interface Promotion {
  promotionId: number;
  promotionCode: string;
  promotionName: string;
  promotionType: "ORDER" | "PRODUCT";
  minimumSpent: number;
  quantity: number;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxDiscountAmount: number;
  usageLimitPerUser: number;
  startDate: string;
  endDate: string;
  promotionStatus: "ACTIVE" | "INACTIVE" | "DELETED";
  status?: "ACTIVE" | "INACTIVE" | "EXPIRED" | "DELETED";
  imageUrl?: string;
  shopId: number;
  createdDate: string;
  updatedDate: string;
}
