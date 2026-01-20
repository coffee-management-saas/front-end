export interface Promotion {
  promotionId: number;
  promotionCode: string;
  promotionName: string;
  promotionType: "ORDER" | "PRODUCT";
  minimumSpent: number;
  quantity: number;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  maxDiscountAmount: number;
  usageLimitPerUser: number;
  startDate: string;
  endDate: string;
  promotionStatus: "ACTIVE" | "INACTIVE";
  shopId: number;
  createdDate: string;
  updatedDate: string;
}
