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
  // Dynamic Column Export (PDF & Excel)
  exportInventoryReport: async (
    format: 'pdf' | 'excel',
    params: {
      tabFilter?: string;
      search?: string;
      status?: string;
      columns?: string[];
    }
  ): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const query = new URLSearchParams();
    if (params.tabFilter) {
      query.append('tabFilter', params.tabFilter);
    }
    if (params.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }
    if (params.status && params.status !== 'ALL') {
      query.append('status', params.status);
    } else {
      query.append('status', 'ALL');
    }
    if (params.columns && params.columns.length > 0) {
      query.append('columns', params.columns.join(','));
    }

    const url = `http://localhost:8080/api/v1/reports/inventory/export/${format}?${query.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      let errorMsg = `Export failed with HTTP ${response.status}`;
      try {
        const errorText = await response.text();
        if (errorText) errorMsg = errorText;
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    return response.blob();
  },
};
