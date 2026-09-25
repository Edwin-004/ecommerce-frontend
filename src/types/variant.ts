export interface Variation {
  variationId: number;
  name: string;
}

export interface VariationOption {
  optionId: number;
  variation?: Variation;
  value: string;
}

export interface ProductSummary {
  productId: number;
  productName: string;
  status?: string;
}

export interface ProductVariant {
  variantId: number;
  product: ProductSummary;
  sku: string;
  sellingPrice: number;
  costPrice?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface VariantOptionValue {
  id: number;
  variant: ProductVariant;
  option: VariationOption;
}

export interface CreateVariantPayload {
  product: { productId: number };
  sku?: string;
  sellingPrice: number;
  costPrice?: number;
  status: 'ACTIVE' | 'INACTIVE';
  optionIds?: number[];
}
