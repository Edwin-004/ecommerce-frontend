import api from '../../utils/axiosConfig';
import type {
  Variation,
  VariationOption,
  ProductVariant,
  VariantOptionValue,
  ProductSummary,
} from '../../types/variant';

export const variantApi = {
  // Variations CRUD
  getVariations: async () => {
    const response = await api.get<Variation[]>('/variations');
    return response.data;
  },

  createVariation: async (name: string) => {
    const response = await api.post<Variation>('/variations', { name });
    return response.data;
  },

  updateVariation: async (id: number, name: string) => {
    const response = await api.put<Variation>(`/variations/${id}`, { name });
    return response.data;
  },

  deleteVariation: async (id: number) => {
    const response = await api.delete<string>(`/variations/${id}`);
    return response.data;
  },

  // Variation Options CRUD
  getVariationOptions: async () => {
    const response = await api.get<VariationOption[]>('/variation-options');
    return response.data;
  },

  getOptionsByVariationId: async (variationId: number) => {
    const response = await api.get<VariationOption[]>(`/variation-options/variation/${variationId}`);
    return response.data;
  },

  createVariationOption: async (variationId: number, value: string) => {
    const response = await api.post<VariationOption>('/variation-options', {
      variation: { variationId },
      value,
    });
    return response.data;
  },

  deleteVariationOption: async (id: number) => {
    const response = await api.delete<string>(`/variation-options/${id}`);
    return response.data;
  },

  // Product Variants CRUD
  getProductVariants: async () => {
    const response = await api.get<ProductVariant[]>('/product-variants');
    return response.data;
  },

  getProductVariantById: async (id: number) => {
    const response = await api.get<ProductVariant>(`/product-variants/${id}`);
    return response.data;
  },

  getVariantsByProductId: async (productId: number) => {
    const response = await api.get<ProductVariant[]>(`/product-variants/product/${productId}`);
    return response.data;
  },

  createProductVariant: async (payload: {
    product: { productId: number };
    sku?: string;
    sellingPrice: number;
    costPrice?: number;
    status: string;
  }) => {
    const response = await api.post<ProductVariant>('/product-variants', payload);
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
  }) => {
    const response = await api.post<ProductVariant>('/product-variants/create-with-options', payload);
    return response.data;
  },

  updateProductVariant: async (
    id: number,
    payload: {
      product?: { productId: number };
      sku?: string;
      sellingPrice?: number;
      costPrice?: number;
      status?: string;
    }
  ) => {
    const response = await api.put<ProductVariant>(`/product-variants/${id}`, payload);
    return response.data;
  },

  deleteProductVariant: async (id: number) => {
    const response = await api.delete<string>(`/product-variants/${id}`);
    return response.data;
  },

  // Auto-Generate SKU Preview
  generateSkuPreview: async (productId: number, optionIds?: number[]) => {
    const response = await api.get<string>('/product-variants/generate-sku', {
      params: {
        productId,
        optionIds: (optionIds && optionIds.length > 0) ? optionIds.join(',') : undefined,
      },
    });
    return response.data;
  },

  // Variant Option Values (Mapping)
  getVariantOptionMappings: async (variantId: number) => {
    const response = await api.get<VariantOptionValue[]>(`/variant-option-values/variant/${variantId}`);
    return response.data;
  },

  assignOptionToVariant: async (variantId: number, optionId: number) => {
    const response = await api.post<VariantOptionValue>('/variant-option-values', {
      variant: { variantId },
      option: { optionId },
    });
    return response.data;
  },

  removeOptionMapping: async (id: number) => {
    const response = await api.delete<string>(`/variant-option-values/${id}`);
    return response.data;
  },

  // Get base products list for dropdown selector
  getProductsList: async (): Promise<ProductSummary[]> => {
    try {
      const response = await api.get<any>('/products');
      if (response.data && Array.isArray(response.data.content)) {
        return response.data.content;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch {
      return [];
    }
  },
};
