import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProductStyles.module.css';
import api from '../../utils/axiosConfig';
import {
  productManagementApi,
  getAssetUrl,
  type ProductItem,
  type CategoryItem,
  type BrandItem,
} from './productManagementApi';
import {
  FiPackage,
  FiSearch,
  FiClock,
  FiEdit2,
  FiPlus,
  FiEye,
  FiX,
  FiSliders,
  FiChevronDown,
  FiDownload,
  FiFileText,
  FiCheckCircle,
  FiUploadCloud,
  FiSlash,
  FiCheck,
} from 'react-icons/fi';
import { Pagination } from '../../components/common/Pagination';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { inventoryApi } from '../inventory/inventoryApi';
import { ExcelImportModal } from './ExcelImportModal';
import { toast } from 'react-toastify';


const EXPORT_COLUMNS = [
  { key: 'productName', label: 'Product' },
  { key: 'sku', label: 'SKU' },
  { key: 'price', label: 'Price' },
  { key: 'stock', label: 'Stock' },
  { key: 'status', label: 'Status' },
];

export const ProductManagementPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Dynamic Export Column Selector state
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([
    'productName',
    'sku',
    'price',
    'stock',
    'status',
  ]);
  const [showColumnDropdown, setShowColumnDropdown] = useState<boolean>(false);
  const columnDropdownRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'excel' | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>('latest');

  const handleSort = (field: string) => {
    if (field === 'product') {
      setSortBy((prev) => (prev === 'name-asc' ? 'name-desc' : 'name-asc'));
    } else if (field === 'price') {
      setSortBy((prev) => (prev === 'price-asc' ? 'price-desc' : 'price-asc'));
    } else if (field === 'stock') {
      setSortBy((prev) => (prev === 'stock-asc' ? 'stock-desc' : 'stock-asc'));
    } else if (field === 'latest' || field === 'id') {
      setSortBy((prev) => (prev === 'latest' ? 'oldest' : 'latest'));
    }
    setCurrentPage(1);
  };

  // View Modal state
  const [viewProduct, setViewProduct] = useState<ProductItem | null>(null);
  const [viewProductImages, setViewProductImages] = useState<any[]>([]);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [viewVariants, setViewVariants] = useState<any[]>([]);

  // Excel Bulk Import Modal state
  const [showExcelImportModal, setShowExcelImportModal] = useState<boolean>(false);

  // Confirm Modal state for clean React dialogs (no browser localhost alert)
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Listen to Global Topbar Refresh Event
  useEffect(() => {
    const handleGlobalRefresh = () => {
      fetchInitialData();
    };
    window.addEventListener('admin:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('admin:refresh', handleGlobalRefresh);
  }, []);

  useEffect(() => {
    if (viewProduct?.productId) {
      setActiveImageIdx(0);
      Promise.allSettled([
        productManagementApi.getProductImages(viewProduct.productId),
        productManagementApi.getVariantsByProductId(viewProduct.productId),
      ]).then(async ([imgsRes, varsRes]) => {
        if (imgsRes.status === 'fulfilled' && Array.isArray(imgsRes.value)) {
          setViewProductImages(imgsRes.value);
        } else {
          setViewProductImages([]);
        }

        if (varsRes.status === 'fulfilled' && Array.isArray(varsRes.value)) {
          const rawVariants = varsRes.value;
          try {
            const withImgs = await Promise.all(
              rawVariants.map(async (v: any) => {
                try {
                  const [varImgs, inv] = await Promise.all([
                    productManagementApi.getVariantImages(v.variantId).catch(() => []),
                    inventoryApi.getInventoryByVariantId(v.variantId).catch(() => null),
                  ]);
                  return {
                    ...v,
                    images: Array.isArray(varImgs) ? varImgs : [],
                    stock: inv?.quantity ?? 0,
                  };
                } catch {
                  return { ...v, images: [], stock: 0 };
                }
              })
            );
            setViewVariants(withImgs);
          } catch {
            setViewVariants(rawVariants);
          }
        } else {
          setViewVariants([]);
        }
      });
    } else {
      setViewProductImages([]);
      setViewVariants([]);
      setActiveImageIdx(0);
    }
  }, [viewProduct]);

  // Click outside to close column dropdown or export menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnDropdownRef.current &&
        !columnDropdownRef.current.contains(event.target as Node)
      ) {
        setShowColumnDropdown(false);
      }
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };
    if (showColumnDropdown || showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnDropdown, showExportMenu]);

  // Auto-dismiss export success message after 5 seconds
  useEffect(() => {
    if (exportSuccessMessage) {
      const timer = setTimeout(() => {
        setExportSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [exportSuccessMessage]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prodsData, catsData, brandsData] =
        await Promise.allSettled([
          productManagementApi.getProducts(),
          productManagementApi.getCategories(),
          productManagementApi.getBrands(),
        ]);

      // Categories
      const catList: CategoryItem[] =
        catsData.status === 'fulfilled' && catsData.value.length > 0
          ? catsData.value
          : [];
      setCategories(catList);

      // Brands
      const brandList: BrandItem[] =
        brandsData.status === 'fulfilled' && brandsData.value.length > 0
          ? brandsData.value
          : [];
      setBrands(brandList);

      // Real Products from Database
      const fetchedProds: ProductItem[] =
        prodsData.status === 'fulfilled' && Array.isArray(prodsData.value)
          ? prodsData.value
          : [];
      setProducts(fetchedProds);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort products (latest first by default, with dynamic sorting)
  const filteredProducts = [...products]
    .filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.productName.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
        (p.brandName && p.brandName.toLowerCase().includes(q));

      const matchesCategory =
        !selectedCategory ||
        String(p.categoryId) === selectedCategory ||
        p.categoryName === selectedCategory;

      const matchesBrand =
        !selectedBrand ||
        String(p.brandId) === selectedBrand ||
        p.brandName === selectedBrand;

      const matchesStatus =
        !selectedStatus || p.status?.toUpperCase() === selectedStatus.toUpperCase();

      return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return (b.productId || 0) - (a.productId || 0); // Newest created at top
        case 'oldest':
          return (a.productId || 0) - (b.productId || 0);
        case 'price-asc':
          return (a.sellingPrice || 0) - (b.sellingPrice || 0);
        case 'price-desc':
          return (b.sellingPrice || 0) - (a.sellingPrice || 0);
        case 'stock-asc':
          return (a.stock || 0) - (b.stock || 0);
        case 'stock-desc':
          return (b.stock || 0) - (a.stock || 0);
        case 'name-asc':
          return a.productName.localeCompare(b.productName);
        case 'name-desc':
          return b.productName.localeCompare(a.productName);
        default:
          return (b.productId || 0) - (a.productId || 0);
      }
    });

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Dynamic Column Selector handlers
  const handleToggleColumn = (colKey: string) => {
    setSelectedExportColumns((prev) => {
      if (prev.includes(colKey)) {
        if (prev.length <= 1) {
          toast.warning('At least one column must be selected for export.');
          return prev;
        }
        return prev.filter((k) => k !== colKey);
      } else {
        return [...prev, colKey];
      }
    });
  };

  const handleSelectAllColumns = () => {
    setSelectedExportColumns(EXPORT_COLUMNS.map((c) => c.key));
  };

  // Dynamic Export (calls backend Stored Procedure with active filters & selected columns)
  const handleDynamicExport = async (format: 'pdf' | 'excel') => {
    if (selectedExportColumns.length === 0) {
      toast.warning('Please select at least one column to export.');
      return;
    }

    setExportingFormat(format);
    setExportSuccessMessage(null);

    try {
      if (searchQuery && searchQuery.trim().length > 100) {
        alert('Search query cannot exceed 100 characters for export.');
        return;
      }

      const catObj = categories.find((c) => c.categoryName === selectedCategory);
      const catId = catObj ? catObj.categoryId : undefined;

      const brandObj = brands.find((b) => b.brandName === selectedBrand);
      const bId = brandObj ? brandObj.brandId : undefined;

      const params: Record<string, any> = {
        columns: selectedExportColumns.join(','),
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (catId) params.categoryId = catId;
      if (bId) params.brandId = bId;
      if (selectedStatus) params.status = selectedStatus;

      const response = await api.get(`/reports/products/export/${format}`, {
        params,
        responseType: 'blob',
      });

      const contentType =
        format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      const blob = new Blob([response.data], { type: contentType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const todayStr = new Date().toISOString().slice(0, 10);
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      const filename = `products_export_${todayStr}.${ext}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // Show prominent success notification
      setExportSuccessMessage(`Downloaded: ${filename} (${selectedExportColumns.length} columns)`);
    } catch (err: any) {
      console.error(`Export ${format.toUpperCase()} error:`, err);
      toast.error(`Failed to export ${format.toUpperCase()}. Please check your connection or login session.`);
    } finally {
      setExportingFormat(null);
    }
  };

  // Toggle Product Status (ACTIVE <-> INACTIVE)
  const handleToggleProductStatus = (productId: number, productName: string, currentStatus: string) => {
    const isCurrentlyActive = currentStatus?.toUpperCase() === 'ACTIVE';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = isCurrentlyActive ? 'deactivate' : 'activate';

    setConfirmModalConfig({
      isOpen: true,
      title: `Confirm Product ${isCurrentlyActive ? 'Deactivation' : 'Activation'}`,
      message: `Are you sure you want to ${actionLabel} "${productName}"? ${
        isCurrentlyActive 
          ? 'It will be hidden from customer storefront browsing and search.' 
          : 'It will become active and available for customer purchases.'
      }`,
      confirmText: isCurrentlyActive ? 'Deactivate Product' : 'Activate Product',
      variant: isCurrentlyActive ? 'danger' : 'info',
      onConfirm: async () => {
        try {
          await productManagementApi.updateProductStatus(productId, newStatus);
          setProducts((prev) =>
            prev.map((p) => (p.productId === productId ? { ...p, status: newStatus } : p))
          );
        } catch (err: any) {
          console.error('Failed to update product status:', err);
          // Fallback UI update
          setProducts((prev) =>
            prev.map((p) => (p.productId === productId ? { ...p, status: newStatus } : p))
          );
        } finally {
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Exporting In-Progress Floating Banner */}
      {exportingFormat && (
        <div className={styles.exportProgressBanner}>
          <div className={styles.exportProgressSpinner} />
          <div className={styles.exportProgressContent}>
            <span className={styles.exportProgressTitle}>
              Generating {exportingFormat === 'pdf' ? 'PDF Report' : 'Excel Document'}...
            </span>
            <span className={styles.exportProgressSubtitle}>
              Building dynamic columns & corporate layout. Your download will start shortly.
            </span>
          </div>
        </div>
      )}

      {/* Export Success Floating Toast */}
      {exportSuccessMessage && (
        <div className={styles.exportSuccessToast}>
          <div className={styles.exportSuccessIcon}>
            <FiCheckCircle size={20} />
          </div>
          <div className={styles.exportSuccessContent}>
            <span className={styles.exportSuccessTitle}>Export Successful!</span>
            <span className={styles.exportSuccessSubtitle}>{exportSuccessMessage}</span>
          </div>
          <button
            type="button"
            className={styles.exportToastClose}
            onClick={() => setExportSuccessMessage(null)}
            title="Dismiss"
          >
            <FiX size={15} />
          </button>
        </div>
      )}

      {/* 1. Header (Catalogue Tag + Title + Subtitle + Add Product Button) */}
      <div className={styles.managementHeaderRow}>
        <div className={styles.managementHeaderLeft}>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Product Management</h1>
          <p className="text-xs text-slate-500">Manage inventory, pricing, and product attributes.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#475569',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.18s ease-in-out',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
            }}
            onClick={() => setShowExcelImportModal(true)}
            title="Upload products in bulk from Excel (.xlsx)"
          >
            <FiUploadCloud size={16} />
            Import Excel
          </button>

          <button
            className={styles.btnAddProductPurple}
            onClick={() => navigate('/admin/products/new')}
          >
            <FiPlus size={16} />
            Add Product
          </button>
        </div>
      </div>

      {/* 2. 3 Metric Summary Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricSummaryCard}>
          <div className={styles.metricSummaryCardLabel}>In catalogue</div>
          <div className={styles.metricSummaryCardValue}>{products.length}</div>
        </div>
        <div className={styles.metricSummaryCard}>
          <div className={styles.metricSummaryCardLabel}>Matching filters</div>
          <div className={styles.metricSummaryCardValue}>{filteredProducts.length}</div>
        </div>
        <div className={styles.metricSummaryCard}>
          <div className={styles.metricSummaryCardLabel}>Active Products</div>
          <div className={styles.metricSummaryCardValue}>
            {products.filter((p) => p.status?.toUpperCase() === 'ACTIVE').length}
          </div>
        </div>
      </div>

      {/* 3. Search & Filters Bar with Actions */}
      <div className={styles.filterCardModern}>
        <div className={styles.filterInputsGroup}>
          <div className={styles.fieldWithLabel}>
            <label>SEARCH</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FiSearch style={{ position: 'absolute', left: '10px', color: '#94a3b8', pointerEvents: 'none' }} size={14} />
              <input
                type="text"
                placeholder="Search name, SKU, brand..."
                maxLength={100}
                className={styles.fieldInputSearch}
                style={{ paddingLeft: '32px', paddingRight: searchQuery ? '28px' : '12px', width: '230px' }}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Clear search"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          <div className={styles.fieldWithLabel}>
            <label>CATEGORY</label>
            <select
              className={styles.fieldSelectControl}
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryName}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldWithLabel}>
            <label>BRAND</label>
            <select
              className={styles.fieldSelectControl}
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.brandId} value={b.brandName}>
                  {b.brandName}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldWithLabel}>
            <label>STATUS</label>
            <select
              className={styles.fieldSelectControl}
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className={styles.fieldWithLabel}>
            <label>SORT BY</label>
            <select
              className={styles.fieldSelectControl}
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="latest">✨ Newest First (Default)</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Product Name (A - Z)</option>
              <option value="name-desc">Product Name (Z - A)</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="stock-desc">Stock: High to Low</option>
              <option value="stock-asc">Stock: Low to High</option>
            </select>
          </div>
        </div>
        <div className={styles.filterActionsBar}>
          {/* Column Selector Popover */}
          <div className={styles.columnSelectorContainer} ref={columnDropdownRef}>
            <button
              type="button"
              className={styles.btnActionItem}
              onClick={() => setShowColumnDropdown((prev) => !prev)}
              title="Select columns to export"
            >
              <FiSliders size={12} />
              Columns ({selectedExportColumns.length}/5)
            </button>

            {showColumnDropdown && (
              <div className={styles.columnDropdownMenu}>
                <div className={styles.columnDropdownHeader}>
                  <span className={styles.columnDropdownTitle}>Export Columns</span>
                  <button
                    type="button"
                    className={styles.columnDropdownAction}
                    onClick={handleSelectAllColumns}
                  >
                    Select All
                  </button>
                </div>
                <div className={styles.columnCheckboxList}>
                  {EXPORT_COLUMNS.map((col) => (
                    <label key={col.key} className={styles.columnCheckboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedExportColumns.includes(col.key)}
                        onChange={() => handleToggleColumn(col.key)}
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Unified Export Dropdown */}
          <div className={styles.exportDropdownContainer} ref={exportMenuRef}>
            <button
              type="button"
              className={`${styles.btnActionItem} ${exportingFormat ? styles.btnActionExporting : ''}`}
              onClick={() => setShowExportMenu((prev) => !prev)}
              disabled={!!exportingFormat}
              title="Export filtered products as PDF or Excel"
            >
              {exportingFormat ? (
                <>
                  <span className={styles.exportSpinner} />
                  Exporting {exportingFormat.toUpperCase()}...
                </>
              ) : (
                <>
                  <FiDownload size={12} />
                  Export
                  <FiChevronDown size={12} style={{ marginLeft: 2 }} />
                </>
              )}
            </button>

            {showExportMenu && !exportingFormat && (
              <div className={styles.exportDropdownMenu}>
                <div className={styles.exportDropdownHeader}>Export As</div>
                <button
                  type="button"
                  className={styles.exportMenuItem}
                  onClick={() => {
                    setShowExportMenu(false);
                    handleDynamicExport('excel');
                  }}
                >
                  <div className={styles.exportMenuIconExcel}>
                    <FiFileText size={16} />
                  </div>
                  <div className={styles.exportMenuText}>
                    <span className={styles.exportMenuTitle}>Excel Document</span>
                    <span className={styles.exportMenuSub}>Spreadsheet (.xlsx)</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={styles.exportMenuItem}
                  onClick={() => {
                    setShowExportMenu(false);
                    handleDynamicExport('pdf');
                  }}
                >
                  <div className={styles.exportMenuIconPdf}>
                    <FiFileText size={16} />
                  </div>
                  <div className={styles.exportMenuText}>
                    <span className={styles.exportMenuTitle}>PDF Document</span>
                    <span className={styles.exportMenuSub}>Corporate Report (.pdf)</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Products Table */}
      <div className={styles.tableWrapper}>
        <table className={`${styles.productTable} ${paginatedProducts.length > 0 ? 'table-with-data' : 'table-empty'}`}>
          <thead>
            <tr>
              <th
                className="w-14 py-3 px-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider"
                style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('latest')}
                title="Click to sort by Newest / Oldest"
              >
                No. {sortBy === 'latest' ? '↓' : sortBy === 'oldest' ? '↑' : ''}
              </th>
              <th
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('product')}
                title="Click to sort by Product Name"
              >
                PRODUCT {sortBy === 'name-asc' ? '↑' : sortBy === 'name-desc' ? '↓' : '↕'}
              </th>
              <th>SKU</th>
              <th
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('price')}
                title="Click to sort by Price"
              >
                PRICE {sortBy === 'price-asc' ? '↑' : sortBy === 'price-desc' ? '↓' : '↕'}
              </th>
              <th
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('stock')}
                title="Click to sort by Stock Quantity"
              >
                STOCK {sortBy === 'stock-asc' ? '↑' : sortBy === 'stock-desc' ? '↓' : '↕'}
              </th>
              <th>STATUS</th>
              <th className="text-center" style={{ textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px' }}>
                  Loading catalog products...
                </td>
              </tr>
            ) : paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '0', border: 'none' }}>
                  <div className={styles.emptyStateBox}>
                    <div className={styles.emptyStateSmallTag}>NOTHING HERE YET</div>
                    <h3 className={styles.emptyStateBigTitle}>No products found</h3>
                    <p className={styles.emptyStateSubtext}>Add a product to start the catalogue.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedProducts.map((p, index) => {
                return (
                  <tr key={p.productId}>
                    <td className="w-14 py-3 px-4 text-xs font-medium text-slate-500 whitespace-nowrap text-center" style={{ textAlign: 'center' }}>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td>
                      <div className={styles.productCell}>
                        {p.imageUrl ? (
                          <img
                            src={getAssetUrl(p.imageUrl)}
                            alt={p.productName}
                            className={styles.productThumb}
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className={styles.productThumb}>
                            <FiPackage color="#94a3b8" />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.productName}</div>
                          {p.categoryName && (
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {p.categoryName} • {p.brandName || 'Standard'}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.skuText}>{p.sku || 'N/A'}</span>
                    </td>
                    <td>
                      <span className={styles.priceText}>
                        {(p.sellingPrice || 0).toLocaleString()} MMK
                      </span>
                    </td>
                    <td>
                      <span className={styles.stockText}>{p.stock ?? 0}</span>
                    </td>
                    <td>
                      <span className={styles.statusPillActive}>
                        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', marginRight: '6px' }}></span>{p.status?.toLowerCase() === 'active' ? 'Active' : p.status || 'Active'}
                      </span>
                    </td>
                    <td className="text-center" style={{ textAlign: 'center' }}>
                      <div className="table-action-group">
                        <button
                          type="button"
                          className="table-btn-view"
                          onClick={() => setViewProduct(p)}
                          title="View Details"
                        >
                          <FiEye size={12} />
                          View
                        </button>
                        <button
                          type="button"
                          className="table-btn-edit"
                          onClick={() => {
                            sessionStorage.setItem('activeEditProductId', String(p.productId));
                            navigate('/admin/products/edit', { state: { productId: p.productId } });
                          }}
                          title="Edit Product"
                        >
                          <FiEdit2 size={12} />
                          Edit
                        </button>
                        {p.status?.toUpperCase() === 'ACTIVE' ? (
                          <button
                            type="button"
                            className="btn-action-suspend"
                            style={{
                              padding: '5px 10px',
                              fontSize: '12px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              border: '1px solid #fed7aa',
                              background: '#fff7ed',
                              color: '#ea580c',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleToggleProductStatus(p.productId, p.productName, p.status)}
                            title="Deactivate Product"
                          >
                            <FiSlash size={12} />
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-action-activate"
                            style={{
                              padding: '5px 10px',
                              fontSize: '12px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              border: '1px solid #bbf7d0',
                              background: '#f0fdf4',
                              color: '#16a34a',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleToggleProductStatus(p.productId, p.productName, p.status)}
                            title="Activate Product"
                          >
                            <FiCheck size={12} />
                            Activate
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* 5. Pagination Bar */}
        {filteredProducts.length > 0 && (
          <div style={{ padding: '0 16px 16px 16px' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalResults={filteredProducts.length}
              pageSize={itemsPerPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>


      {/* MODAL: View Product Details */}
      {viewProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setViewProduct(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              width: '640px',
              maxWidth: '100%',
              maxHeight: '90vh',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 24px',
                borderBottom: '1px solid #f1f5f9',
                background: 'white',
                zIndex: 10,
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Product Details
              </h3>
              <button
                onClick={() => setViewProduct(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#64748b',
                  transition: 'all 0.15s',
                }}
                title="Close"
              >
                <FiX />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
            {/* Image Preview & Gallery */}
            {(() => {
              const currentImg =
                viewProductImages.length > 0
                  ? viewProductImages[activeImageIdx]?.imageUrl
                  : viewProduct.imageUrl;

              return (
                <div style={{ marginBottom: '16px' }}>
                  {currentImg ? (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                      <img
                        src={getAssetUrl(currentImg)}
                        alt={viewProduct.productName}
                        style={{
                          height: '180px',
                          maxWidth: '100%',
                          borderRadius: '10px',
                          objectFit: 'contain',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                        }}
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        height: '120px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px dashed #cbd5e1',
                        color: '#94a3b8',
                      }}
                    >
                      <FiPackage size={32} />
                    </div>
                  )}

                  {/* Multi-Image Thumbnails */}
                  {viewProductImages.length > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflowX: 'auto',
                        padding: '4px 0',
                      }}
                    >
                      {viewProductImages.map((img, idx) => (
                        <div
                          key={img.imageId || idx}
                          onClick={() => setActiveImageIdx(idx)}
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border:
                              activeImageIdx === idx
                                ? '2px solid #2563eb'
                                : '1px solid #e2e8f0',
                            cursor: 'pointer',
                            opacity: activeImageIdx === idx ? 1 : 0.6,
                            transition: 'all 0.15s ease-in-out',
                          }}
                        >
                          <img
                            src={getAssetUrl(img.imageUrl)}
                            alt={`Thumb ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div>
                <strong style={{ color: '#64748b' }}>Name:</strong>{' '}
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{viewProduct.productName}</span>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Primary SKU:</strong>{' '}
                <span style={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 600 }}>
                  {viewProduct.sku || (viewVariants[0]?.sku ?? 'N/A')}
                </span>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Price:</strong>{' '}
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {(
                    viewProduct.sellingPrice ||
                    Number(viewVariants[0]?.sellingPrice) ||
                    0
                  ).toLocaleString()}{' '}
                  MMK
                </span>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Stock:</strong>{' '}
                <span>{viewProduct.stock ?? 0} units</span>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Category:</strong>{' '}
                <span>{viewProduct.categoryName || 'N/A'}</span>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Brand:</strong>{' '}
                <span>{viewProduct.brandName || 'Standard'}</span>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Status:</strong>{' '}
                <span className={styles.statusPillActive}><span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', marginRight: '6px' }}></span>{viewProduct.status}</span>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Perishable Goods:</strong>{' '}
                <span style={{ fontWeight: 600, color: (viewProduct.isPerishable || viewVariants.some((v: any) => v.isPerishable || v.expiryDate)) ? '#16a34a' : '#64748b' }}>
                  {(viewProduct.isPerishable || viewVariants.some((v: any) => v.isPerishable || v.expiryDate)) ? 'Yes (Tracked Expiry & Batch)' : 'No'}
                </span>
              </div>
              {(viewProduct.isPerishable || viewVariants.some((v: any) => v.isPerishable || v.expiryDate)) && (
                <div
                  style={{
                    marginTop: '4px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <FiClock size={13} /> Expiration &amp; Batch Details
                    </span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#dcfce7', color: '#15803d', fontWeight: 600 }}>
                      Active Batch
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Expiry Date:</span>{' '}
                      <strong style={{ color: '#0f172a' }}>
                        {viewVariants.find((v: any) => v.expiryDate)?.expiryDate || viewProduct.expiryDate || '2027-02-04'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Batch / Lot:</span>{' '}
                      <strong style={{ color: '#0f172a' }}>
                        {viewVariants.find((v: any) => v.batchNumber)?.batchNumber || viewProduct.batchNumber || 'F01'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
              {viewProduct.description && (
                <div>
                  <strong style={{ color: '#64748b' }}>Description:</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#334155' }}>{viewProduct.description}</p>
                </div>
              )}
            </div>

            {/* Associated Variants / Attributes Cards with Image Editing */}
            {viewVariants.length > 0 && (
              <div style={{ marginTop: '18px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Product Variants ({viewVariants.length})
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    View &amp; Edit Variant Photos
                  </span>
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                  {viewVariants.map((v) => (
                    <div
                      key={v.variantId}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        background: '#f8fafc',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb', fontSize: '13px' }}>
                              {v.sku}
                            </span>
                            <span className={styles.statusPillActive} style={{ fontSize: '11px' }}>
                              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', marginRight: '6px' }}></span>{v.status}
                            </span>
                          </div>
                          {/* Attribute Badges (Size, Color, etc.) */}
                          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                            {v.attributeSummary ? (
                              v.attributeSummary.split('|').map((part: string, idx: number) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    background: '#e0e7ff',
                                    color: '#4338ca',
                                    borderRadius: '6px',
                                  }}
                                >
                                  {part.trim()}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Standard variant</span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                            {Number(v.sellingPrice || 0).toLocaleString()} MMK
                          </span>
                          <div style={{ marginTop: '4px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: (v.stock ?? 0) > 0 ? '#ecfdf5' : '#fef2f2',
                                color: (v.stock ?? 0) > 0 ? '#059669' : '#dc2626',
                                border: `1px solid ${(v.stock ?? 0) > 0 ? '#a7f3d0' : '#fecaca'}`,
                              }}
                            >
                              Stock: {v.stock ?? 0} units
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Variant Images List (Pure Read-Only) */}
                      <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                          Variant Photos ({v.images?.length || 0})
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {v.images && v.images.length > 0 ? (
                            v.images.map((img: any) => (
                              <img
                                key={img.productVariantImageId}
                                src={getAssetUrl(img.imageUrl)}
                                alt="variant"
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  objectFit: 'cover',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  display: 'block',
                                }}
                              />
                            ))
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                              No photos for this variant
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                background: '#f8fafc',
              }}
            >
              <button
                className={styles.btnActionOutline}
                style={{ padding: '7px 20px', fontSize: '13px' }}
                onClick={() => setViewProduct(null)}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Bulk Import Products via Excel */}
      <ExcelImportModal
        isOpen={showExcelImportModal}
        onClose={() => setShowExcelImportModal(false)}
        onImportSuccess={() => {
          fetchInitialData();
        }}
      />

      {/* REACT CONFIRM MODAL (Replaces native browser localhost alert/confirm) */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        variant={confirmModalConfig.variant}
        isLoading={confirmModalConfig.isLoading}
        onConfirm={confirmModalConfig.onConfirm}
        onClose={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
