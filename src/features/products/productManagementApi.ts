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

export const getAssetUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const clean = url.startsWith('/') ? url : `/${url}`;
  return `http://localhost:8080${clean}`;
};

export const productManagementApi = {
  // Get all products (with pagination or full list, latest first)
  getProducts: async (): Promise<ProductItem[]> => {
    try {
      const response = await apiFetch<any>('/api/backoffice/products?sort=productId,desc');
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
  getProductById: (id: number) => apiFetch<ProductItem>(`/api/backoffice/products/${id}`),

  // Create product
  createProduct: (payload: {
    productName: string;
    description?: string;
    status: string;
    categoryId: number;
    brandId?: number;
    userId: number;
  }) =>
    apiFetch<ProductItem>('/api/backoffice/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Categories
  getCategories: async (): Promise<CategoryItem[]> => {
    try {
      const response = await apiFetch<any>('/api/backoffice/categories');
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
      const response = await apiFetch<any>('/api/backoffice/brands');
      if (response && Array.isArray(response.content)) return response.content;
      if (Array.isArray(response)) return response;
      return [];
    } catch {
      return [];
    }
  },

  // Product Images
  getProductImages: (productId: number) =>
    apiFetch<any[]>(`/api/backoffice/product-images/product/${productId}`),

  uploadProductImage: async (productId: number, file: File, isPrimary = true) => {
    const formData = new FormData();
    formData.append('productId', String(productId));
    formData.append('file', file);
    formData.append('isPrimary', String(isPrimary));
    formData.append('userId', '1');

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('http://localhost:8080/api/backoffice/product-images/upload', {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('Image upload failed');
    return res.json();
  },

  // Variations & Options
  getVariations: () => apiFetch<any[]>('/api/backoffice/variations'),
  createVariation: (name: string) =>
    apiFetch<any>('/api/backoffice/variations', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  deleteVariation: (id: number) =>
    apiFetch<string>(`/api/backoffice/variations/${id}`, { method: 'DELETE' }),

  getVariationOptions: () => apiFetch<any[]>('/api/backoffice/variation-options'),
  createVariationOption: (variationId: number, value: string) =>
    apiFetch<any>('/api/backoffice/variation-options', {
      method: 'POST',
      body: JSON.stringify({ variation: { variationId }, value }),
    }),
  deleteVariationOption: (id: number) =>
    apiFetch<string>(`/api/backoffice/variation-options/${id}`, { method: 'DELETE' }),

  // Variants & Inventory
  getProductVariants: () => apiFetch<any[]>('/api/backoffice/product-variants'),
  createProductVariant: (payload: any) =>
    apiFetch<any>('/api/backoffice/product-variants', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  assignOptionToVariant: (variantId: number, optionId: number) =>
    apiFetch<any>('/api/backoffice/variant-option-values', {
      method: 'POST',
      body: JSON.stringify({ variant: { variantId }, option: { optionId } }),
    }),

  // Product Tags Mapping
  getProductTags: (productId: number) =>
    apiFetch<any[]>(`/api/backoffice/product-tags/product/${productId}`),

  assignProductTags: (productId: number, tagIds: number[]) =>
    apiFetch<any[]>(`/api/backoffice/product-tags/product/${productId}`, {
      method: 'POST',
      body: JSON.stringify(tagIds),
    }),

  // Product Variant Images
  uploadProductVariantImage: async (variantId: number, file: File, isPrimary = false) => {
    const formData = new FormData();
    formData.append('variantId', String(variantId));
    formData.append('file', file);
    formData.append('isPrimary', String(isPrimary));
    formData.append('userId', '1');

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('http://localhost:8080/api/backoffice/product-variant-images/upload', {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('Variant image upload failed');
    return res.json();
  },

  getVariantImages: (variantId: number) =>
    apiFetch<any[]>(`/api/backoffice/product-variant-images/variant/${variantId}`),
};
