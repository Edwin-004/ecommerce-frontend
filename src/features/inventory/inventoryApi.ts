import api from '../../utils/axiosConfig';
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
  getAllInventory: async () => {
    const response = await api.get<InventoryItem[]>('/inventory');
    return response.data;
  },

  // Get inventory for a specific variant
  getInventoryByVariantId: async (variantId: number) => {
    const response = await api.get<InventoryItem>(`/inventory/variant/${variantId}`);
    return response.data;
  },

  // Get low stock alerts
  getLowStockAlerts: async () => {
    const response = await api.get<InventoryItem[]>('/inventory/low-stock');
    return response.data;
  },

  // Initialize inventory for a variant
  initializeInventory: async (payload: InventoryCreatePayload) => {
    const response = await api.post<InventoryItem>('/inventory/initialize', payload);
    return response.data;
  },

  // Restock inventory
  restockVariant: async (payload: RestockPayload) => {
    const response = await api.post<InventoryItem>('/inventory/restock', payload);
    return response.data;
  },

  // Write off damaged/expired stock
  writeOffVariant: async (payload: WriteOffPayload) => {
    const response = await api.post<InventoryItem>('/inventory/write-off', payload);
    return response.data;
  },

  // Adjust stock count after physical audit
  adjustStock: async (payload: StockAdjustmentPayload) => {
    const response = await api.post<InventoryItem>('/inventory/adjust', payload);
    return response.data;
  },

  // Get full transaction history
  getTransactionHistory: async (txnType?: string) => {
    const response = await api.get<InventoryTransaction[]>('/inventory/transactions', {
      params: (txnType && txnType !== 'ALL') ? { txnType } : undefined,
    });
    return response.data;
  },

  // Get transactions for a specific variant
  getVariantTransactions: async (variantId: number) => {
    const response = await api.get<InventoryTransaction[]>(`/inventory/transactions/variant/${variantId}`);
    return response.data;
  },

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
    if (params.search && params.search.trim().length > 100) {
      throw new Error('Search query cannot exceed 100 characters.');
    }

    const queryParams: Record<string, any> = {};
    if (params.tabFilter) {
      queryParams['tabFilter'] = params.tabFilter;
    }
    if (params.search && params.search.trim()) {
      queryParams['search'] = params.search.trim();
    }
    if (params.status && params.status !== 'ALL') {
      queryParams['status'] = params.status;
    } else {
      queryParams['status'] = 'ALL';
    }
    if (params.columns && params.columns.length > 0) {
      queryParams['columns'] = params.columns.join(',');
    }

    const response = await api.get(`/reports/inventory/export/${format}`, {
      params: queryParams,
      responseType: 'blob',
    });

    return response.data as Blob;
  },
};
