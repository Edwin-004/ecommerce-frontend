import React, { useState } from 'react';
import { FiX, FiCheck, FiZap, FiAlertCircle } from 'react-icons/fi';
import styles from './Variants.module.css';
import { variantApi } from './variantApi';
import type {
  ProductVariant,
  Variation,
  VariationOption,
  ProductSummary,
} from '../../types/variant';

// ==========================================
// 1. CREATE PRODUCT VARIANT MODAL
// ==========================================
interface CreateVariantModalProps {
  products: ProductSummary[];
  variations: Variation[];
  options: VariationOption[];
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateVariantModal: React.FC<CreateVariantModalProps> = ({
  products,
  variations,
  options,
  onClose,
  onSuccess,
}) => {
  const [productId, setProductId] = useState<number | ''>(products[0]?.productId || '');
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const [sku, setSku] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [generatingSku, setGeneratingSku] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toggle option selection
  const handleToggleOption = (optionId: number) => {
    setSelectedOptionIds((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
    );
  };

  // Auto-Generate SKU
  const handleGenerateSku = async () => {
    if (!productId) {
      setError('Please select a base Product first');
      return;
    }
    try {
      setGeneratingSku(true);
      setError(null);
      const generated = await variantApi.generateSkuPreview(Number(productId), selectedOptionIds);
      setSku(generated);
    } catch (err: any) {
      setError(err.message || 'Failed to auto-generate SKU');
    } finally {
      setGeneratingSku(false);
    }
  };

  // Submit Variant creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setError('Please select a product');
      return;
    }
    if (!sellingPrice || Number(sellingPrice) <= 0) {
      setError('Please specify a valid selling price');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Create Variant
      const newVariant = await variantApi.createProductVariant({
        product: { productId: Number(productId) },
        sku: sku.trim() || undefined,
        sellingPrice: Number(sellingPrice),
        costPrice: costPrice ? Number(costPrice) : undefined,
        status,
      });

      // 2. Map selected options to this variant
      if (selectedOptionIds.length > 0 && newVariant.variantId) {
        for (const optId of selectedOptionIds) {
          try {
            await variantApi.assignOptionToVariant(newVariant.variantId, optId);
          } catch (mapErr) {
            console.warn(`Failed to map option ${optId}`, mapErr);
          }
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create product variant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Create Product Variant</h3>
          <button className={styles.modalClose} onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorMessage}><FiAlertCircle /> {error}</div>}

            {/* Base Product */}
            <div className={styles.formGroup}>
              <label>Base Product *</label>
              <select
                value={productId}
                onChange={(e) => setProductId(Number(e.target.value))}
                required
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.productName} (#{p.productId})
                  </option>
                ))}
              </select>
            </div>

            {/* Options Selection grouped by Variation */}
            <div className={styles.formGroup}>
              <label>Select Variation Attributes & Options</label>
              {variations.length === 0 ? (
                <small style={{ color: '#64748b' }}>No variations created yet. Go to Variations tab to add them.</small>
              ) : (
                <div className={styles.optionSelectorBox}>
                  {variations.map((v) => {
                    const varOptions = options.filter((o) => o.variation?.variationId === v.variationId);
                    if (varOptions.length === 0) return null;
                    return (
                      <div key={v.variationId}>
                        <div className={styles.optionGroupTitle}>{v.name}</div>
                        <div className={styles.optionChoices}>
                          {varOptions.map((opt) => {
                            const isSelected = selectedOptionIds.includes(opt.optionId);
                            return (
                              <span
                                key={opt.optionId}
                                className={`${styles.optionChoiceItem} ${isSelected ? styles.optionChoiceActive : ''}`}
                                onClick={() => handleToggleOption(opt.optionId)}
                              >
                                {isSelected ? <FiCheck color="#2563eb" /> : null}
                                {opt.value}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SKU with Auto-Generate Button */}
            <div className={styles.formGroup}>
              <label>Stock Keeping Unit (SKU) *</label>
              <div className={styles.skuInputRow}>
                <input
                  type="text"
                  placeholder="e.g. NIKE-AIR-BLK-42"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                />
                <button
                  type="button"
                  className={styles.btnGenSku}
                  onClick={handleGenerateSku}
                  disabled={generatingSku || !productId}
                  title="Generate SKU automatically from product name and options"
                >
                  <FiZap /> {generatingSku ? 'Generating...' : 'Auto-Generate'}
                </button>
              </div>
              <small style={{ color: '#64748b', fontSize: '12px' }}>
                Leave empty or click Auto-Generate to create a standard unique SKU.
              </small>
            </div>

            {/* Pricing */}
            <div className={styles.row2}>
              <div className={styles.formGroup}>
                <label>Selling Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="149.99"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Cost Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="90.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Status */}
            <div className={styles.formGroup}>
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Creating...' : <><FiCheck /> Save Variant</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. EDIT PRODUCT VARIANT MODAL
// ==========================================
interface EditVariantModalProps {
  variant: ProductVariant;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditVariantModal: React.FC<EditVariantModalProps> = ({ variant, onClose, onSuccess }) => {
  const [sku, setSku] = useState(variant.sku);
  const [sellingPrice, setSellingPrice] = useState<number>(variant.sellingPrice);
  const [costPrice, setCostPrice] = useState<number>(variant.costPrice || 0);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(variant.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await variantApi.updateProductVariant(variant.variantId, {
        sku: sku.trim(),
        sellingPrice: Number(sellingPrice),
        costPrice: Number(costPrice),
        status,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update variant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Edit Product Variant #{variant.variantId}</h3>
          <button className={styles.modalClose} onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorMessage}><FiAlertCircle /> {error}</div>}

            <div className={styles.formGroup}>
              <label>SKU Code *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
              />
            </div>

            <div className={styles.row2}>
              <div className={styles.formGroup}>
                <label>Selling Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Cost Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Saving...' : 'Update Variant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. ADD VARIATION TYPE MODAL
// ==========================================
interface AddVariationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddVariationModal: React.FC<AddVariationModalProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await variantApi.createVariation(name.trim());
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create variation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className={styles.modalHeader}>
          <h3>New Variation Attribute</h3>
          <button className={styles.modalClose} onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorMessage}><FiAlertCircle /> {error}</div>}

            <div className={styles.formGroup}>
              <label>Attribute Name *</label>
              <input
                type="text"
                placeholder="e.g. Color, Size, Storage, Material"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Saving...' : 'Create Attribute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
