import api, { API_BASE_URL } from '../../utils/axiosConfig';

export interface ProductItem {
  productId: number;
  productName: string;
  description?: string;
  status: string;
  categoryId?: number;
  categoryName?: string;
  brandId?: number;
  brandName?: string;
  sellingPrice?: number;
  stock?: number;
  sku?: string;
  imageUrl?: string;
  isPerishable?: boolean;
  expiryDate?: string;
  batchNumber?: string;
}

export interface CategoryItem {
  categoryId: number;
  categoryName: string;
}

export interface BrandItem {
  brandId: number;
  brandName: string;
}

export const getAssetUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const clean = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${clean}`;
};

export const productManagementApi = {
  // Get all products (latest first)
  getProducts: async (): Promise<ProductItem[]> => {
    try {
      const response = await api.get<any>(
        '/products?sort=productId,desc&size=10000&page=0'
      );

      // Spring Boot Page response
      if (response.data && Array.isArray(response.data.content)) {
        return response.data.content;
      }

      // Direct array response
      if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  },

  // Get single product
  getProductById: async (id: number): Promise<ProductItem> => {
    const response = await api.get<ProductItem>(`/products/${id}`);
    return response.data;
  },

  // Create product
  createProduct: async (payload: {
    productName: string;
    description?: string;
    status: string;
    categoryId: number;
    brandId?: number;
    userId: number;
    isPerishable?: boolean;
  }): Promise<ProductItem> => {
    const response = await api.post<ProductItem>('/products', payload);
    return response.data;
  },

  // Update product
  updateProduct: async (
    id: number,
    payload: {
      productName: string;
      description?: string;
      status: string;
      categoryId: number;
      brandId?: number;
      userId: number;
      isPerishable?: boolean;
    }
  ): Promise<ProductItem> => {
    const response = await api.put<ProductItem>(`/products/${id}`, payload);
    return response.data;
  },

  // Delete product
  deleteProduct: async (id: number): Promise<void> => {
    await api.delete<void>(`/products/${id}`);
  },

  // Update product status
  updateProductStatus: async (id: number, status: string): Promise<any> => {
    const response = await api.patch<any>(`/products/${id}/status?status=${status}`);
    return response.data;
  },

  // Categories
  getCategories: async (): Promise<CategoryItem[]> => {
    try {
      const response = await api.get<any>('/categories');
      if (response.data && Array.isArray(response.data.content)) return response.data.content;
      if (Array.isArray(response.data)) return response.data;
      return [];
    } catch {
      return [];
    }
  },

  // Brands
  getBrands: async (): Promise<BrandItem[]> => {
    try {
      const response = await api.get<any>('/brands');
      if (response.data && Array.isArray(response.data.content)) return response.data.content;
      if (Array.isArray(response.data)) return response.data;
      return [];
    } catch {
      return [];
    }
  },

  // Product Images
  getProductImages: async (productId: number): Promise<any[]> => {
    const response = await api.get<any[]>(`/product-images/product/${productId}`);
    return response.data;
  },

  uploadProductImage: async (productId: number, file: File, isPrimary = true): Promise<any> => {
    const formData = new FormData();
    formData.append('productId', String(productId));
    formData.append('file', file);
    formData.append('isPrimary', String(isPrimary));
    formData.append('userId', '5'); // Active admin ID fallback

    const response = await api.post('/product-images/upload', formData);
    return response.data;
  },

  deleteProductImage: async (imageId: number): Promise<void> => {
    await api.delete<void>(`/product-images/${imageId}`);
  },

  setPrimaryProductImage: async (imageId: number, userId = 1): Promise<any> => {
    const response = await api.patch<any>(`/product-images/${imageId}/primary?userId=${userId}`);
    return response.data;
  },

  // Variations & Options
  getVariations: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/variations');
    return response.data;
  },

  createVariation: async (name: string): Promise<any> => {
    const response = await api.post<any>('/variations', { name });
    return response.data;
  },

  deleteVariation: async (id: number): Promise<string> => {
    const response = await api.delete<string>(`/variations/${id}`);
    return response.data;
  },

  getVariationOptions: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/variation-options');
    return response.data;
  },

  createVariationOption: async (variationId: number, value: string): Promise<any> => {
    const response = await api.post<any>('/variation-options', {
      variation: { variationId },
      value,
    });
    return response.data;
  },

  deleteVariationOption: async (id: number): Promise<string> => {
    const response = await api.delete<string>(`/variation-options/${id}`);
    return response.data;
  },

  // Variants & Inventory
  getProductVariants: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/product-variants');
    return response.data;
  },

  getVariantsByProductId: async (productId: number): Promise<any[]> => {
    const response = await api.get<any[]>(`/product-variants/product/${productId}`);
    return response.data;
  },

  createProductVariant: async (payload: any): Promise<any> => {
    const response = await api.post<any>('/product-variants', payload);
    return response.data;
  },

  createProductVariantWithOptions: async (payload: {
    productId: number;
    sku?: string;
    sellingPrice: number;
    costPrice?: number;
    status: string;
    optionIds: number[];
    initialStock?: number;
    expiryDate?: string;
    batchNumber?: string;
    isPerishable?: boolean;
  }): Promise<any> => {
    const response = await api.post<any>('/product-variants/create-with-options', payload);
    return response.data;
  },

  assignOptionToVariant: async (variantId: number, optionId: number): Promise<any> => {
    const response = await api.post<any>('/variant-option-values', {
      variant: { variantId },
      option: { optionId },
    });
    return response.data;
  },

  // Product Tags Mapping
  getProductTags: async (productId: number): Promise<any[]> => {
    const response = await api.get<any[]>(`/product-tags/product/${productId}`);
    return response.data;
  },

  assignProductTags: async (productId: number, tagIds: number[]): Promise<any[]> => {
    const response = await api.post<any[]>(`/product-tags/product/${productId}`, tagIds);
    return response.data;
  },

  // Product Variant Images
  uploadProductVariantImage: async (variantId: number, file: File, isPrimary = false): Promise<any> => {
    const formData = new FormData();
    formData.append('variantId', String(variantId));
    formData.append('file', file);
    formData.append('isPrimary', String(isPrimary));
    formData.append('userId', '5'); // Active admin ID fallback

    const response = await api.post('/product-variant-images/upload', formData);
    return response.data;
  },

  getVariantImages: async (variantId: number): Promise<any[]> => {
    const response = await api.get<any[]>(`/product-variant-images/variant/${variantId}`);
    return response.data;
  },

  deleteVariantImage: async (imageId: number): Promise<void> => {
    await api.delete<void>(`/product-variant-images/${imageId}`);
  },

  // Excel Bulk Import & Template
  downloadExcelTemplate: async (): Promise<void> => {
    const response = await api.get('/products/excel-template', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_import_template.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  bulkImportProducts: async (file: File): Promise<{
    totalRows: number;
    successCount: number;
    failedCount: number;
    errors: Array<{
      rowNumber: number;
      productName: string;
      sku: string;
      errorReason: string;
    }>;
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/products/bulk-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  batchCreateProducts: async (rows: Array<{
    productName: string;
    description?: string;
    categoryName: string;
    brandName?: string;
    sellingPrice: number;
    costPrice?: number;
    stock: number;
    sku?: string;
    size?: string;
    color?: string;
    status: string;
  }>): Promise<{
    totalRows: number;
    successCount: number;
    failedCount: number;
    errors: Array<{
      rowNumber: number;
      productName: string;
      sku: string;
      errorReason: string;
    }>;
  }> => {
    const response = await api.post('/products/batch-create', rows);
    return response.data;
  },
};
