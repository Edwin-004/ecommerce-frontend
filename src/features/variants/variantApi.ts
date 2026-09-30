import { apiFetch } from '../../utils/api';
import type {
  Variation,
  VariationOption,
  ProductVariant,
  VariantOptionValue,
  ProductSummary,
} from '../../types/variant';

export const variantApi = {
  // Variations CRUD
  getVariations: () => apiFetch<Variation[]>('/api/backoffice/variations'),

  createVariation: (name: string) =>
    apiFetch<Variation>('/api/backoffice/variations', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  updateVariation: (id: number, name: string) =>
    apiFetch<Variation>(`/api/backoffice/variations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  deleteVariation: (id: number) =>
    apiFetch<string>(`/api/backoffice/variations/${id}`, {
      method: 'DELETE',
    }),

  // Variation Options CRUD
  getVariationOptions: () => apiFetch<VariationOption[]>('/api/backoffice/variation-options'),

  getOptionsByVariationId: (variationId: number) =>
    apiFetch<VariationOption[]>(`/api/backoffice/variation-options/variation/${variationId}`),

  createVariationOption: (variationId: number, value: string) =>
    apiFetch<VariationOption>('/api/backoffice/variation-options', {
      method: 'POST',
      body: JSON.stringify({
        variation: { variationId },
        value,
      }),
    }),

  deleteVariationOption: (id: number) =>
    apiFetch<string>(`/api/backoffice/variation-options/${id}`, {
      method: 'DELETE',
    }),

  // Product Variants CRUD
  getProductVariants: () => apiFetch<ProductVariant[]>('/api/backoffice/product-variants'),

  getProductVariantById: (id: number) =>
    apiFetch<ProductVariant>(`/api/backoffice/product-variants/${id}`),

  createProductVariant: (payload: {
    product: { productId: number };
    sku?: string;
    sellingPrice: number;
    costPrice?: number;
    status: string;
  }) =>
    apiFetch<ProductVariant>('/api/backoffice/product-variants', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProductVariant: (
    id: number,
    payload: {
      product?: { productId: number };
      sku?: string;
      sellingPrice?: number;
      costPrice?: number;
      status?: string;
    }
  ) =>
    apiFetch<ProductVariant>(`/api/backoffice/product-variants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteProductVariant: (id: number) =>
    apiFetch<string>(`/api/backoffice/product-variants/${id}`, {
      method: 'DELETE',
    }),

  // Auto-Generate SKU Preview
  generateSkuPreview: (productId: number, optionIds?: number[]) => {
    let url = `/api/backoffice/product-variants/generate-sku?productId=${productId}`;
    if (optionIds && optionIds.length > 0) {
      url += `&optionIds=${optionIds.join(',')}`;
    }
    return apiFetch<string>(url);
  },

  // Variant Option Values (Mapping)
  getVariantOptionMappings: (variantId: number) =>
    apiFetch<VariantOptionValue[]>(`/api/backoffice/variant-option-values/variant/${variantId}`),

  assignOptionToVariant: (variantId: number, optionId: number) =>
    apiFetch<VariantOptionValue>('/api/backoffice/variant-option-values', {
      method: 'POST',
      body: JSON.stringify({
        variant: { variantId },
        option: { optionId },
      }),
    }),

  removeOptionMapping: (id: number) =>
    apiFetch<string>(`/api/backoffice/variant-option-values/${id}`, {
      method: 'DELETE',
    }),

  // Get base products list for dropdown selector
  getProductsList: async (): Promise<ProductSummary[]> => {
    try {
      const response = await apiFetch<any>('/api/backoffice/products');
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
};
