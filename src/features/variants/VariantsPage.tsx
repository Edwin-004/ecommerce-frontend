import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  FiExternalLink,
  FiFilter,
  FiTrendingUp,
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
import { Pagination } from '../../components/common/Pagination';

export const VariantsPage: React.FC = () => {
  const navigate = useNavigate();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [options, setOptions] = useState<VariationOption[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);

  const [searchParams, setSearchParams] = useSearchParams();

  const paramTab = (searchParams.get('tab') as 'VARIANTS' | 'VARIATIONS') || 'VARIANTS';
  const paramSearch = searchParams.get('search') || '';
  const paramStatus = searchParams.get('status') || 'ALL';
  const paramProduct = searchParams.get('product') || 'ALL';
  const paramPage = Number(searchParams.get('page')) || 1;

  const [activeTab, setActiveTabState] = useState<'VARIANTS' | 'VARIATIONS'>(paramTab);
  const [searchQuery, setSearchQueryState] = useState(paramSearch);
  const [selectedProductFilter, setSelectedProductFilterState] = useState<string>(paramProduct);
  const [statusFilter, setStatusFilterState] = useState<string>(paramStatus);
  const [sortBy, setSortBy] = useState<string>('newest');

  const [page, setPageState] = useState(paramPage);

  const updateVariantParams = (updates: { tab?: string; search?: string; status?: string; product?: string; page?: number }) => {
    const next = new URLSearchParams(searchParams);
    const nextTab = updates.tab !== undefined ? updates.tab : activeTab;
    const nextSearch = updates.search !== undefined ? updates.search : searchQuery;
    const nextStatus = updates.status !== undefined ? updates.status : statusFilter;
    const nextProduct = updates.product !== undefined ? updates.product : selectedProductFilter;
    const nextPage = updates.page !== undefined ? updates.page : 1;

    if (nextTab && nextTab !== 'VARIANTS') next.set('tab', nextTab); else next.delete('tab');
    if (nextSearch && nextSearch.trim()) next.set('search', nextSearch.trim()); else next.delete('search');
    if (nextStatus && nextStatus !== 'ALL') next.set('status', nextStatus); else next.delete('status');
    if (nextProduct && nextProduct !== 'ALL') next.set('product', nextProduct); else next.delete('product');
    if (nextPage > 1) next.set('page', String(nextPage)); else next.delete('page');

    setSearchParams(next, { replace: true });
  };

  const setActiveTab = (t: 'VARIANTS' | 'VARIATIONS') => {
    setActiveTabState(t);
    setPageState(1);
    updateVariantParams({ tab: t, page: 1 });
  };

  const setSearchQuery = (q: string) => {
    setSearchQueryState(q);
    setPageState(1);
    updateVariantParams({ search: q, page: 1 });
  };

  const setStatusFilter = (st: string) => {
    setStatusFilterState(st);
    setPageState(1);
    updateVariantParams({ status: st, page: 1 });
  };

  const setSelectedProductFilter = (p: string) => {
    setSelectedProductFilterState(p);
    setPageState(1);
    updateVariantParams({ product: p, page: 1 });
  };

  const setPage = (p: number) => {
    setPageState(p);
    updateVariantParams({ page: p });
  };

  useEffect(() => {
    setActiveTabState((searchParams.get('tab') as 'VARIANTS' | 'VARIATIONS') || 'VARIANTS');
    setSearchQueryState(searchParams.get('search') || '');
    setStatusFilterState(searchParams.get('status') || 'ALL');
    setSelectedProductFilterState(searchParams.get('product') || 'ALL');
    setPageState(Number(searchParams.get('page')) || 1);
  }, [searchParams]);





  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states

  const [pageSize, setPageSize] = useState(10);

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
    if (!window.confirm('Are you sure you want to deactivate this product variant? (Historical orders and stock audit will be safely preserved)')) return;
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

  // Filtered and Sorted variants
  const filteredVariants = useMemo(() => {
    let result = [...variants];

    // Filter by Product
    if (selectedProductFilter !== 'ALL') {
      result = result.filter((v) => String(v.product?.productId) === selectedProductFilter);
    }

    // Filter by Status
    if (statusFilter !== 'ALL') {
      result = result.filter((v) => v.status === statusFilter);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((v) => {
        return (
          (v.sku && v.sku.toLowerCase().includes(q)) ||
          (v.product?.productName && v.product.productName.toLowerCase().includes(q)) ||
          (v.attributeSummary && v.attributeSummary.toLowerCase().includes(q))
        );
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') return (b.variantId || 0) - (a.variantId || 0);
      if (sortBy === 'oldest') return (a.variantId || 0) - (b.variantId || 0);
      if (sortBy === 'price-desc') return (b.sellingPrice || 0) - (a.sellingPrice || 0);
      if (sortBy === 'price-asc') return (a.sellingPrice || 0) - (b.sellingPrice || 0);
      if (sortBy === 'margin-desc') {
        const marginA = (a.sellingPrice || 0) - (a.costPrice || 0);
        const marginB = (b.sellingPrice || 0) - (b.costPrice || 0);
        return marginB - marginA;
      }
      if (sortBy === 'sku-asc') return (a.sku || '').localeCompare(b.sku || '');
      return 0;
    });

    return result;
  }, [variants, searchQuery, selectedProductFilter, statusFilter, sortBy]);

  // Reset page when filter or tab changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedProductFilter, statusFilter, sortBy, activeTab]);

  // Paginated variants slice
  const paginatedVariants = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredVariants.slice(start, start + pageSize);
  }, [filteredVariants, page, pageSize]);

  const activeCount = useMemo(() => variants.filter((v) => v.status === 'ACTIVE').length, [variants]);
  const inactiveCount = useMemo(() => variants.filter((v) => v.status === 'INACTIVE').length, [variants]);

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={`${styles.title} text-xl font-semibold text-slate-900 tracking-tight`}>
            SKU Directory &amp; Global Attributes
          </h1>
          <p className={`${styles.subtitle} text-xs text-slate-500`}>
            Central hub to inspect cross-store SKU pricing, profit margins, and manage reusable variation attributes (Color, Size)
          </p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={loadData} disabled={loading} title="Refresh data">
            <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
          </button>
          {activeTab === 'VARIANTS' ? (
            <button className={styles.btnPrimary} onClick={() => setShowCreateVariantModal(true)}>
              <FiPlus /> New Variant SKU
            </button>
          ) : (
            <button className={styles.btnPrimary} onClick={() => setShowAddVariationModal(true)}>
              <FiPlus /> New Global Attribute
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
            <p>Total Sellable SKUs</p>
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
            <p>Global Variation Attributes</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statAmber}`}><FiTag /></div>
          <div className={styles.statContent}>
            <h3>{options.length}</h3>
            <p>Configured Option Values</p>
          </div>
        </div>
      </div>

      {/* Context Guide Banner */}
      <div style={{
        background: activeTab === 'VARIANTS' ? '#f0fdf4' : '#faf5ff',
        border: `1px solid ${activeTab === 'VARIANTS' ? '#bbf7d0' : '#e9d5ff'}`,
        borderRadius: '12px',
        padding: '12px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
        color: activeTab === 'VARIANTS' ? '#166534' : '#6b21a8'
      }}>
        <div style={{ fontSize: '18px', flexShrink: 0 }}>
          {activeTab === 'VARIANTS' ? '📊' : '🏷️'}
        </div>
        <div style={{ lineHeight: 1.5 }}>
          {activeTab === 'VARIANTS' ? (
            <span>
              <strong>SKU Pricing &amp; Margin Directory:</strong> View and compare selling prices, cost prices, and calculated profit margins across all product variants in one place. To edit full descriptions, categories, or product gallery photos, open the <strong>Product Management</strong> page.
            </span>
          ) : (
            <span>
              <strong>Global Reusable Attributes:</strong> Predefine standard attributes (e.g. Size, Color, Material) and standard options here so they are ready as one-click templates when adding or editing products.
            </span>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'VARIANTS' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('VARIANTS')}
          >
            <FiPackage /> SKU Directory ({variants.length})
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'VARIATIONS' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('VARIATIONS')}
          >
            <FiLayers /> Global Attributes ({variations.length})
          </button>
        </div>

        {activeTab === 'VARIANTS' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div className={styles.searchBox} style={{ position: 'relative' }}>
              <FiSearch color="#94a3b8" />
              <input
                type="text"
                placeholder="Search SKU or Product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  title="Clear search"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            {/* Filter by Product */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={selectedProductFilter}
                onChange={(e) => setSelectedProductFilter(e.target.value)}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1e293b',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="ALL">All Products ({products.length})</option>
                {products.map((p) => (
                  <option key={p.productId} value={String(p.productId)}>
                    {p.productName}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1e293b',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1e293b',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="newest">✨ Newest First (Default)</option>
                <option value="oldest">Oldest First</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="margin-desc">Margin: High to Low</option>
                <option value="sku-asc">SKU Code (A - Z)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'VARIANTS' ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className="w-14 py-3 px-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider" style={{ width: '60px', textAlign: 'center' }}>
                  No.
                </th>
                <th>SKU</th>
                <th>Base Product</th>
                <th>Attributes / Options</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Profit Margin</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={9} className={styles.emptyState}>
                    <FiPackage />
                    <p>No product variants found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedVariants.map((v, index) => {
                  const rowNumber = (page - 1) * pageSize + index + 1;
                  const cost = v.costPrice || 0;
                  const selling = v.sellingPrice || 0;
                  const margin = selling - cost;
                  const hasCost = Boolean(v.costPrice && v.costPrice > 0);
                  const marginPct = hasCost ? ((margin / cost) * 100).toFixed(1) : null;
                  const isPositive = margin >= 0;

                  return (
                    <tr key={v.variantId}>
                      <td className="py-3.5 px-4 text-[13px] font-medium text-slate-500 tabular-nums text-center" style={{ textAlign: 'center' }}>
                        {rowNumber}
                      </td>
                      <td>
                        <span className={styles.skuTag}>{v.sku}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>
                            {v.product?.productName || '-'}
                          </span>
                          {v.product?.productId && (
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/products/edit/${v.product.productId}`)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#3b82f6',
                                padding: '2px',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                              title="Open Product details"
                            >
                              <FiExternalLink size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        {v.attributeSummary ? (
                          <span style={{
                            padding: '3px 8px',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 500
                          }}>
                            {v.attributeSummary}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Default</span>
                        )}
                      </td>
                      <td style={{ color: '#64748b' }}>
                        {hasCost ? `${cost.toLocaleString()} MMK` : '—'}
                      </td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        {selling ? `${selling.toLocaleString()} MMK` : '0 MMK'}
                      </td>
                      <td>
                        {hasCost ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            background: isPositive ? '#ecfdf5' : '#fef2f2',
                            color: isPositive ? '#059669' : '#dc2626'
                          }}>
                            {isPositive ? '+' : ''}{margin.toLocaleString()} MMK ({isPositive ? '+' : ''}{marginPct}%)
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`${styles.badge} ${
                          v.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive
                        }`}>
                          {v.status === 'ACTIVE' ? <FiCheckCircle /> : <FiXCircle />}
                          {v.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="table-btn-edit"
                            onClick={() => setSelectedVariant(v)}
                            title="Edit pricing / status"
                          >
                            <FiEdit2 size={12} /> Edit
                          </button>
                          <button
                            type="button"
                            className="table-btn-delete"
                            onClick={() => handleDeleteVariant(v.variantId)}
                            title="Deactivate variant (Soft Delete)"
                          >
                            <FiTrash2 size={12} /> Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {filteredVariants.length > 0 && (
            <div style={{ padding: '0 16px 16px 16px' }}>
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(filteredVariants.length / pageSize)}
                totalResults={filteredVariants.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </div>
          )}
        </div>
      ) : (
        /* Variations & Options Tab */
        <div className={styles.variationsGrid}>
          {variations.length === 0 ? (
            <div className={styles.emptyState} style={{ gridColumn: '1 / -1' }}>
              <FiLayers />
              <p>No global variation attributes configured yet.</p>
              <button
                type="button"
                className={styles.btnPrimary}
                style={{ marginTop: '12px' }}
                onClick={() => setShowAddVariationModal(true)}
              >
                <FiPlus /> Create First Attribute (e.g. Size, Color)
              </button>
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
                      placeholder={`Add ${v.name} option (e.g. Red, XL)`}
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
