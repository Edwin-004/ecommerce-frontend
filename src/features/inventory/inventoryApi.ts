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
  getAllInventory: () => apiFetch<InventoryItem[]>('/api/backoffice/inventory'),

  // Get inventory for a specific variant
  getInventoryByVariantId: (variantId: number) =>
    apiFetch<InventoryItem>(`/api/backoffice/inventory/variant/${variantId}`),

  // Get low stock alerts
  getLowStockAlerts: () => apiFetch<InventoryItem[]>('/api/backoffice/inventory/low-stock'),

  // Initialize inventory for a variant
  initializeInventory: (payload: InventoryCreatePayload) =>
    apiFetch<InventoryItem>('/api/backoffice/inventory/initialize', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Restock inventory
  restockVariant: (payload: RestockPayload) =>
    apiFetch<InventoryItem>('/api/backoffice/inventory/restock', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Write off damaged/expired stock
  writeOffVariant: (payload: WriteOffPayload) =>
    apiFetch<InventoryItem>('/api/backoffice/inventory/write-off', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Adjust stock count after physical audit
  adjustStock: (payload: StockAdjustmentPayload) =>
    apiFetch<InventoryItem>('/api/backoffice/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Get full transaction history
  getTransactionHistory: (txnType?: string) => {
    const url = txnType && txnType !== 'ALL'
      ? `/api/backoffice/inventory/transactions?txnType=${txnType}`
      : '/api/backoffice/inventory/transactions';
    return apiFetch<InventoryTransaction[]>(url);
  },

  // Get transactions for a specific variant
  getVariantTransactions: (variantId: number) =>
    apiFetch<InventoryTransaction[]>(`/api/backoffice/inventory/transactions/variant/${variantId}`),
};
