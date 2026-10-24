export interface InventoryItem {
  inventoryId: number;
  variantId: number;
  sku: string;
  productName: string;
  sellingPrice: number | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  status: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  isPerishable?: boolean;
  expiryDate?: string | null;
  batchNumber?: string | null;
  daysUntilExpiry?: number | null;
  expiryStatus?: 'GOOD' | 'EXPIRING_SOON' | 'EXPIRED' | 'NON_PERISHABLE';
  attributeSummary?: string | null;
  createdAt: string;
  modifiedAt: string;
}

export interface InventoryTransaction {
  txnId: number;
  variantId: number;
  sku: string;
  productName: string;
  txnType: 'RESTOCK' | 'SALE' | 'RETURN' | 'WRITE_OFF' | 'ADJUSTMENT';
  qty: number;
  beforeQty: number;
  afterQty: number;
  referenceType?: string;
  referenceId?: number;
  remark?: string;
  createdByName?: string;
  createdAt: string;
}

export interface RestockPayload {
  variantId: number;
  quantity: number;
  referenceType?: string;
  referenceId?: number;
  remark?: string;
  expiryDate?: string;
  batchNumber?: string;
}

export interface WriteOffPayload {
  variantId: number;
  quantity: number;
  remark: string;
}

export interface StockAdjustmentPayload {
  variantId: number;
  newQuantity: number;
  remark: string;
}

export interface InventoryCreatePayload {
  variantId: number;
  initialQuantity?: number;
  reorderLevel?: number;
  isPerishable?: boolean;
  expiryDate?: string;
  batchNumber?: string;
}
