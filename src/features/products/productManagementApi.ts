import { apiFetch } from '../../utils/api';

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
}

export interface CategoryItem {
  categoryId: number;
  categoryName: string;
}

export interface BrandItem {
  brandId: number;
  brandName: string;
}

export const productManagementApi = {
  // Get all products (with pagination or full list)
  getProducts: async (): Promise<ProductItem[]> => {
    try {
      const response = await apiFetch<any>('/api/products');
      if (response && Array.isArray(response.content)) {
        return response.content;
      }
      if (Array.isArray(response)) {
        return response;
      }
      return [];
    } catch {
      return [];
    }
  },

  // Get single product
  getProductById: (id: number) => apiFetch<ProductItem>(`/api/products/${id}`),

  // Create product
  createProduct: (payload: {
    productName: string;
    description?: string;
    status: string;
    categoryId: number;
    brandId?: number;
    userId: number;
  }) =>
    apiFetch<ProductItem>('/api/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Categories
  getCategories: async (): Promise<CategoryItem[]> => {
    try {
      const response = await apiFetch<any>('/api/categories');
      if (response && Array.isArray(response.content)) return response.content;
      if (Array.isArray(response)) return response;
      return [];
    } catch {
      return [];
    }
  },

  // Brands
  getBrands: async (): Promise<BrandItem[]> => {
    try {
      const response = await apiFetch<any>('/api/brands');
      if (response && Array.isArray(response.content)) return response.content;
      if (Array.isArray(response)) return response;
      return [];
    } catch {
      return [];
    }
  },

  // Product Images
  getProductImages: (productId: number) =>
    apiFetch<any[]>(`/api/product-images/product/${productId}`),

  uploadProductImage: async (productId: number, file: File, isPrimary = true) => {
    const formData = new FormData();
    formData.append('productId', String(productId));
    formData.append('file', file);
    formData.append('isPrimary', String(isPrimary));
    formData.append('userId', '1');

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('http://localhost:8080/api/product-images/upload', {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('Image upload failed');
    return res.json();
  },

  // Variations & Options
  getVariations: () => apiFetch<any[]>('/api/variations'),
  createVariation: (name: string) =>
    apiFetch<any>('/api/variations', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  deleteVariation: (id: number) =>
    apiFetch<string>(`/api/variations/${id}`, { method: 'DELETE' }),

  getVariationOptions: () => apiFetch<any[]>('/api/variation-options'),
  createVariationOption: (variationId: number, value: string) =>
    apiFetch<any>('/api/variation-options', {
      method: 'POST',
      body: JSON.stringify({ variation: { variationId }, value }),
    }),
  deleteVariationOption: (id: number) =>
    apiFetch<string>(`/api/variation-options/${id}`, { method: 'DELETE' }),

  // Variants & Inventory
  getProductVariants: () => apiFetch<any[]>('/api/product-variants'),
  createProductVariant: (payload: any) =>
    apiFetch<any>('/api/product-variants', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  assignOptionToVariant: (variantId: number, optionId: number) =>
    apiFetch<any>('/api/variant-option-values', {
      method: 'POST',
      body: JSON.stringify({ variant: { variantId }, option: { optionId } }),
    }),
};
