export type Role = 'BUYER' | 'SELLER' | 'ADMIN';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'BCA_VA'
  | 'MANDIRI_VA'
  | 'BRI_VA'
  | 'QRIS'
  | 'GOPAY'
  | 'OVO'
  | 'SHOPEEPAY'
  | 'COD'
  | 'BANK_TRANSFER';

export interface CartItemDto {
  id: string;
  productId: string;
  productVariantId: string;
  productName: string;
  variantTitle: string;
  price: number;
  weightGram: number;
  quantity: number;
  imageUrl: string;
  storeId: string;
  storeName: string;
  storeCity: string;
}

export interface MultiVendorGroup {
  storeId: string;
  storeName: string;
  storeCity: string;
  items: CartItemDto[];
  totalGoodsAmount: number;
  totalWeightGram: number;
  selectedCourierCode: string;
  selectedService: string;
  shippingCost: number;
}
