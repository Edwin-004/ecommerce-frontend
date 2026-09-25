import React, { useState, useEffect, useMemo } from 'react';
import {
  FiPackage,
  FiLayers,
  FiCheckCircle,
  FiXCircle,
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
  FiAlertCircle,
  FiTag,
  FiX,
} from 'react-icons/fi';
import styles from './Variants.module.css';
import { variantApi } from './variantApi';
import type {
  ProductVariant,
  Variation,
  VariationOption,
  ProductSummary,
} from '../../types/variant';
import {
  CreateVariantModal,
  EditVariantModal,
  AddVariationModal,
} from './VariantModals';

export const VariantsPage: React.FC = () => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [options, setOptions] = useState<VariationOption[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);

  const [activeTab, setActiveTab] = useState<'VARIANTS' | 'VARIATIONS'>('VARIANTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showCreateVariantModal, setShowCreateVariantModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [showAddVariationModal, setShowAddVariationModal] = useState(false);

  // Inline option adding
  const [newOptionValue, setNewOptionValue] = useState<{ [variationId: number]: string }>({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [variantsData, variationsData, optionsData, productsData] = await Promise.all([
        variantApi.getProductVariants(),
        variantApi.getVariations(),
        variantApi.getVariationOptions(),
        variantApi.getProductsList(),
      ]);

      setVariants(variantsData);
      setVariations(variationsData);
      setOptions(optionsData);
      setProducts(productsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load catalog data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Delete Variant
  const handleDeleteVariant = async (variantId: number) => {
    if (!window.confirm('Are you sure you want to delete this product variant?')) return;
    try {
      setLoading(true);
      await variantApi.deleteProductVariant(variantId);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete variant');
      setLoading(false);
    }
  };

  // Delete Variation
  const handleDeleteVariation = async (variationId: number) => {
    if (!window.confirm('Delete this variation attribute? All its options will also be deleted.')) return;
    try {
      setLoading(true);
      await variantApi.deleteVariation(variationId);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete variation');
      setLoading(false);
    }
  };

  // Add Option inline
  const handleAddOption = async (variationId: number) => {
    const val = newOptionValue[variationId]?.trim();
    if (!val) return;

    try {
      await variantApi.createVariationOption(variationId, val);
      setNewOptionValue((prev) => ({ ...prev, [variationId]: '' }));
      const updatedOpts = await variantApi.getVariationOptions();
      setOptions(updatedOpts);
    } catch (err: any) {
      alert(err.message || 'Failed to add option');
    }
  };

  // Delete Option
  const handleDeleteOption = async (optionId: number) => {
    try {
      await variantApi.deleteVariationOption(optionId);
      const updatedOpts = await variantApi.getVariationOptions();
      setOptions(updatedOpts);
    } catch (err: any) {
      alert(err.message || 'Failed to delete option');
    }
  };

  // Filtered variants
  const filteredVariants = useMemo(() => {
    return variants.filter((v) => {
      const q = searchQuery.toLowerCase();
      return (
        (v.sku && v.sku.toLowerCase().includes(q)) ||
        (v.product?.productName && v.product.productName.toLowerCase().includes(q))
      );
    });
  }, [variants, searchQuery]);

  const activeCount = useMemo(() => variants.filter((v) => v.status === 'ACTIVE').length, [variants]);
  const inactiveCount = useMemo(() => variants.filter((v) => v.status === 'INACTIVE').length, [variants]);

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Product Variants & Variations</h1>
          <p className={styles.subtitle}>
            Manage sellable SKU combinations, variation attributes (Color, Size), and automated SKU generation
          </p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={loadData} disabled={loading}>
            <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
          </button>
          {activeTab === 'VARIANTS' ? (
            <button className={styles.btnPrimary} onClick={() => setShowCreateVariantModal(true)}>
              <FiPlus /> New Variant
            </button>
          ) : (
            <button className={styles.btnPrimary} onClick={() => setShowAddVariationModal(true)}>
              <FiPlus /> New Attribute
            </button>
          )}
        </div>
      </div>

      {error && <div className={styles.errorMessage}><FiAlertCircle /> {error}</div>}

      {/* Metrics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statBlue}`}><FiPackage /></div>
          <div className={styles.statContent}>
            <h3>{variants.length}</h3>
            <p>Total Variants</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statGreen}`}><FiCheckCircle /></div>
          <div className={styles.statContent}>
            <h3>{activeCount}</h3>
            <p>Active SKUs ({inactiveCount} inactive)</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statPurple}`}><FiLayers /></div>
          <div className={styles.statContent}>
            <h3>{variations.length}</h3>
            <p>Variation Attributes</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statAmber}`}><FiTag /></div>
          <div className={styles.statContent}>
            <h3>{options.length}</h3>
            <p>Total Option Values</p>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'VARIANTS' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('VARIANTS')}
          >
            <FiPackage /> Product Variants ({variants.length})
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'VARIATIONS' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('VARIATIONS')}
          >
            <FiLayers /> Variations & Options ({variations.length})
          </button>
        </div>

        {activeTab === 'VARIANTS' && (
          <div className={styles.searchBox}>
            <FiSearch color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by SKU or Product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'VARIANTS' ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Variant ID</th>
                <th>SKU</th>
                <th>Base Product</th>
                <th>Selling Price</th>
                <th>Cost Price</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    <FiPackage />
                    <p>No product variants found.</p>
                  </td>
                </tr>
              ) : (
                filteredVariants.map((v) => (
                  <tr key={v.variantId}>
                    <td style={{ color: '#64748b' }}>#{v.variantId}</td>
                    <td><span className={styles.skuTag}>{v.sku}</span></td>
                    <td style={{ fontWeight: 600 }}>{v.product?.productName || '-'}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      ${v.sellingPrice ? v.sellingPrice.toFixed(2) : '0.00'}
                    </td>
                    <td style={{ color: '#64748b' }}>
                      {v.costPrice ? `$${v.costPrice.toFixed(2)}` : '-'}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${
                        v.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive
                      }`}>
                        {v.status === 'ACTIVE' ? <FiCheckCircle /> : <FiXCircle />}
                        {v.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        <button
                          className={`${styles.btnAction} ${styles.btnEdit}`}
                          onClick={() => setSelectedVariant(v)}
                          title="Edit pricing / status"
                        >
                          <FiEdit2 /> Edit
                        </button>
                        <button
                          className={`${styles.btnAction} ${styles.btnDelete}`}
                          onClick={() => handleDeleteVariant(v.variantId)}
                          title="Delete variant"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Variations & Options Tab */
        <div className={styles.variationsGrid}>
          {variations.length === 0 ? (
            <div className={styles.emptyState} style={{ gridColumn: '1 / -1' }}>
              <FiLayers />
              <p>No variation attributes configured yet.</p>
            </div>
          ) : (
            variations.map((v) => {
              const varOptions = options.filter((o) => o.variation?.variationId === v.variationId);
              return (
                <div key={v.variationId} className={styles.variationCard}>
                  <div className={styles.varCardHeader}>
                    <h3>
                      <FiTag color="#2563eb" /> {v.name}
                    </h3>
                    <button
                      className={styles.optionDeleteBtn}
                      onClick={() => handleDeleteVariation(v.variationId)}
                      title="Delete Variation Attribute"
                    >
                      <FiTrash2 />
                    </button>
                  </div>

                  <div className={styles.varOptionsContainer}>
                    {varOptions.length === 0 ? (
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>No option values yet</span>
                    ) : (
                      varOptions.map((opt) => (
                        <span key={opt.optionId} className={styles.optionPill}>
                          {opt.value}
                          <button
                            className={styles.optionDeleteBtn}
                            onClick={() => handleDeleteOption(opt.optionId)}
                            title="Delete option value"
                          >
                            <FiX />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <div className={styles.inlineAddOption}>
                    <input
                      type="text"
                      placeholder={`Add ${v.name} option (e.g. Red)`}
                      value={newOptionValue[v.variationId] || ''}
                      onChange={(e) =>
                        setNewOptionValue((prev) => ({ ...prev, [v.variationId]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption(v.variationId);
                        }
                      }}
                    />
                    <button
                      className={styles.btnSecondary}
                      style={{ padding: '6px 12px' }}
                      onClick={() => handleAddOption(v.variationId)}
                    >
                      Add
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Render Modals */}
      {showCreateVariantModal && (
        <CreateVariantModal
          products={products}
          variations={variations}
          options={options}
          onClose={() => setShowCreateVariantModal(false)}
          onSuccess={() => {
            setShowCreateVariantModal(false);
            loadData();
          }}
        />
      )}

      {selectedVariant && (
        <EditVariantModal
          variant={selectedVariant}
          onClose={() => setSelectedVariant(null)}
          onSuccess={() => {
            setSelectedVariant(null);
            loadData();
          }}
        />
      )}

      {showAddVariationModal && (
        <AddVariationModal
          onClose={() => setShowAddVariationModal(false)}
          onSuccess={() => {
            setShowAddVariationModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};
