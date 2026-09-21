export interface OrderItemDto {
  orderItemId: number;
  variantId: number;
  productName: string;
  variantAttributes: string;
  qty: number;
  unitPrice: number;
  discountAmount: number;
  subtotal: number;
}

export interface OrderStatusHistoryDto {
  historyId: number;
  oldStatus: string | null;
  newStatus: string;
  remark: string | null;
  changedAt: string;
  changedByName: string;
}

export interface OrderAddressDto {
  orderAddressId: number;
  recipientName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  regionOrState: string;
  township: string;
}

export interface OrderResponseDto {
  orderId: number;
  orderNo: string;
  customerName: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  items?: OrderItemDto[];
  statusHistories?: OrderStatusHistoryDto[];
  shippingAddress?: OrderAddressDto;
}