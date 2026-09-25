import { apiFetch } from '../../utils/api';
import type {
  InventoryItem,
  InventoryTransaction,
  RestockPayload,
  WriteOffPayload,
  StockAdjustmentPayload,
  InventoryCreatePayload,
} from '../../types/inventory';

export const inventoryApi = {
  // Get all inventory items
  getAllInventory: () => apiFetch<InventoryItem[]>('/api/inventory'),

  // Get inventory for a specific variant
  getInventoryByVariantId: (variantId: number) =>
    apiFetch<InventoryItem>(`/api/inventory/variant/${variantId}`),

  // Get low stock alerts
  getLowStockAlerts: () => apiFetch<InventoryItem[]>('/api/inventory/low-stock'),

  // Initialize inventory for a variant
  initializeInventory: (payload: InventoryCreatePayload) =>
    apiFetch<InventoryItem>('/api/inventory/initialize', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Restock inventory
  restockVariant: (payload: RestockPayload) =>
    apiFetch<InventoryItem>('/api/inventory/restock', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Write off damaged/expired stock
  writeOffVariant: (payload: WriteOffPayload) =>
    apiFetch<InventoryItem>('/api/inventory/write-off', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Adjust stock count after physical audit
  adjustStock: (payload: StockAdjustmentPayload) =>
    apiFetch<InventoryItem>('/api/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Get full transaction history
  getTransactionHistory: (txnType?: string) => {
    const url = txnType && txnType !== 'ALL'
      ? `/api/inventory/transactions?txnType=${txnType}`
      : '/api/inventory/transactions';
    return apiFetch<InventoryTransaction[]>(url);
  },

  // Get transactions for a specific variant
  getVariantTransactions: (variantId: number) =>
    apiFetch<InventoryTransaction[]>(`/api/inventory/transactions/variant/${variantId}`),
};
