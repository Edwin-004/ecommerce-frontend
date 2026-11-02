import React, { useState, useRef, useEffect } from 'react';
import {
  FiUploadCloud,
  FiDownload,
  FiFileText,
  FiAlertCircle,
  FiX,
  FiRefreshCw,
  FiArrowRight,
  FiAlertTriangle,
  FiPlus,
  FiTrash2,
  FiGrid,
  FiClipboard,
  FiExternalLink,
  FiCheckCircle,
} from 'react-icons/fi';
import { productManagementApi, type CategoryItem, type BrandItem } from './productManagementApi';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

interface GridRow {
  id: string;
  productName: string;
  description: string;
  categoryName: string;
  brandName: string;
  sellingPrice: string;
  costPrice: string;
  stock: string;
  sku: string;
  size: string;
  color: string;
  status: string;
}

interface RowError {
  rowNumber: number;
  productName: string;
  sku: string;
  errorReason: string;
}

interface ImportResult {
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: RowError[];
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'EXCEL' | 'GRID'>('EXCEL');

  // Categories & Brands list for Dropdowns
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);

  // Web Grid State
  const [gridRows, setGridRows] = useState<GridRow[]>([]);
  const [savingGrid, setSavingGrid] = useState<boolean>(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState<boolean>(false);
  const [excelOpeningNotice, setExcelOpeningNotice] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Result & Error States
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Paste raw text modal state
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pastedText, setPastedText] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
      if (gridRows.length === 0) {
        initInitialRows(5);
      }
    }
  }, [isOpen]);

  const loadDropdownData = async () => {
    try {
      const [cats, brs] = await Promise.all([
        productManagementApi.getCategories(),
        productManagementApi.getBrands(),
      ]);
      setCategories(cats || []);
      setBrands(brs || []);
    } catch {
      // ignore
    }
  };

  const createBlankRow = (index: number): GridRow => ({
    id: `row-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
    productName: '',
    description: '',
    categoryName: categories.length > 0 ? categories[0].categoryName : '',
    brandName: '',
    sellingPrice: '',
    costPrice: '',
    stock: '10',
    sku: '',
    size: '',
    color: '',
    status: 'ACTIVE',
  });

  const initInitialRows = (count: number) => {
    const newRows: GridRow[] = [];
    for (let i = 0; i < count; i++) {
      newRows.push(createBlankRow(i));
    }
    setGridRows(newRows);
  };

  if (!isOpen) return null;

  // Grid editing handlers
  const handleCellChange = (id: string, field: keyof GridRow, value: string) => {
    setGridRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleAddRows = (count: number) => {
    const newRows: GridRow[] = [];
    for (let i = 0; i < count; i++) {
      newRows.push(createBlankRow(i));
    }
    setGridRows((prev) => [...prev, ...newRows]);
  };

  const handleDeleteRow = (id: string) => {
    setGridRows((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      return filtered.length > 0 ? filtered : [createBlankRow(0)];
    });
  };

  const handleClearEmptyRows = () => {
    setGridRows((prev) => {
      const nonEmpty = prev.filter((r) => r.productName.trim() !== '');
      return nonEmpty.length > 0 ? nonEmpty : [createBlankRow(0)];
    });
  };

  // Handle Clipboard Paste (e.g. from real Excel / Google Sheets)
  const handleApplyPaste = () => {
    if (!pastedText.trim()) {
      setShowPasteModal(false);
      return;
    }

    const lines = pastedText.trim().split(/\r?\n/);
    const parsedRows: GridRow[] = [];

    lines.forEach((line, idx) => {
      const cols = line.split('\t');
      if (cols.length === 0 || !cols[0]?.trim()) return;

      // Map columns: 0: Name, 1: Desc, 2: Cat, 3: Brand, 4: Price, 5: Cost, 6: Stock, 7: SKU, 8: Size, 9: Color, 10: Status
      parsedRows.push({
        id: `pasted-${Date.now()}-${idx}`,
        productName: cols[0]?.trim() || '',
        description: cols[1]?.trim() || '',
        categoryName: cols[2]?.trim() || (categories[0]?.categoryName ?? 'General'),
        brandName: cols[3]?.trim() || '',
        sellingPrice: cols[4]?.replace(/[^0-9.]/g, '') || '',
        costPrice: cols[5]?.replace(/[^0-9.]/g, '') || '',
        stock: cols[6]?.replace(/[^0-9]/g, '') || '10',
        sku: cols[7]?.trim() || '',
        size: cols[8]?.trim() || '',
        color: cols[9]?.trim() || '',
        status: cols[10]?.trim().toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      });
    });

    if (parsedRows.length > 0) {
      setGridRows(parsedRows);
    }
    setPastedText('');
    setShowPasteModal(false);
  };

  // Save Interactive Web Grid Rows to Database
  const handleSaveGridToDatabase = async () => {
    const validRows = gridRows.filter((r) => r.productName.trim() !== '');

    if (validRows.length === 0) {
      setErrorMsg('Please enter at least one product with a name.');
      return;
    }

    try {
      setSavingGrid(true);
      setErrorMsg(null);

      const payload = validRows.map((r) => ({
        productName: r.productName.trim(),
        description: r.description.trim() || undefined,
        categoryName: r.categoryName.trim(),
        brandName: r.brandName.trim() || undefined,
        sellingPrice: Number(r.sellingPrice) || 0,
        costPrice: r.costPrice ? Number(r.costPrice) : undefined,
        stock: r.stock !== '' ? Number(r.stock) : 10,
        sku: r.sku.trim() || undefined,
        size: r.size.trim() || undefined,
        color: r.color.trim() || undefined,
        status: r.status,
      }));

      const res = await productManagementApi.batchCreateProducts(payload);
      setResult(res);
      onImportSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setErrorMsg('Backend Server (Port 8080) ရပ်တန့်နေပါသည် သို့မဟုတ် ချိတ်ဆက်မရသေးပါ။ Backend ကို Run ပေးပါရန်။');
      } else {
        setErrorMsg(err.response?.data?.message || err.message || 'Failed to save products.');
      }
    } finally {
      setSavingGrid(false);
    }
  };

  // Open directly in Microsoft Excel App
  const handleOpenInExcelApp = async () => {
    try {
      setDownloadingTemplate(true);
      setExcelOpeningNotice(true);
      setErrorMsg(null);

      // 1. Download file to browser so user always has local .xlsx
      await productManagementApi.downloadExcelTemplate();

      // 2. Launch Microsoft Excel desktop app via Windows Office URI Protocol
      const templateUrl = 'http://localhost:8080/api/backoffice/products/excel-template.xlsx';
      window.location.href = `ms-excel:ofe|u|${templateUrl}`;
    } catch (err: any) {
      console.error(err);
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setErrorMsg('Backend Server (Port 8080) ရပ်တန့်နေပါသည် သို့မဟုတ် ချိတ်ဆက်မရသေးပါ။ Backend ကို Run ပေးပါရန်။');
      } else {
        setErrorMsg(err.response?.data?.message || err.message || 'Failed to open Excel template.');
      }
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // File Download Handler
  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      setErrorMsg(null);
      await productManagementApi.downloadExcelTemplate();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setErrorMsg('Backend Server (Port 8080) ရပ်တန့်နေပါသည် သို့မဟုတ် ချိတ်ဆက်မရသေးပါ။ Backend ကို Run ပေးပါရန်။');
      } else {
        setErrorMsg(err.response?.data?.message || err.message || 'Failed to download Excel template.');
      }
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleStartFileImport = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setErrorMsg(null);
      const res = await productManagementApi.bulkImportProducts(selectedFile);
      setResult(res);
      onImportSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setErrorMsg('Backend Server (Port 8080) ရပ်တန့်နေပါသည် သို့မဟုတ် ချိတ်ဆက်မရသေးပါ။ Backend ကို Run ပေးပါရန်။');
      } else {
        setErrorMsg(err.response?.data?.message || err.message || 'Failed to import products from Excel.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setErrorMsg(null);
    initInitialRows(5);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validRowCount = gridRows.filter((r) => r.productName.trim() !== '').length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: activeTab === 'GRID' && !result ? '1060px' : '680px',
          maxWidth: '98vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              <FiFileText />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                Excel Bulk Import (ကုန်ပစ္စည်း အမြောက်အမြား သွင်းယူခြင်း)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Open in Microsoft Excel App to enter 1,000 to 5,000 products easily.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f8fafc',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        {!result && (
          <div
            style={{
              display: 'flex',
              padding: '0 24px',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
              gap: '24px',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('EXCEL')}
              style={{
                padding: '12px 0',
                border: 'none',
                background: 'none',
                fontSize: '13px',
                fontWeight: 600,
                color: activeTab === 'EXCEL' ? '#107c41' : '#64748b',
                borderBottom: `2px solid ${activeTab === 'EXCEL' ? '#107c41' : 'transparent'}`,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FiFileText size={16} />
              Microsoft Excel App (Excel တွင် တိုက်ရိုက်ဖွင့်သွင်းမည်)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('GRID')}
              style={{
                padding: '12px 0',
                border: 'none',
                background: 'none',
                fontSize: '13px',
                fontWeight: 600,
                color: activeTab === 'GRID' ? '#4f46e5' : '#64748b',
                borderBottom: `2px solid ${activeTab === 'GRID' ? '#4f46e5' : 'transparent'}`,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FiGrid size={15} />
              Interactive Web Grid (Browser တွင် ရိုက်သွင်းမည်)
            </button>
          </div>
        )}

        {/* Body Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <FiAlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {result ? (
            /* Result Summary Screen */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TOTAL ROWS</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {result.totalRows}
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>SUCCESSFUL</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669', marginTop: '2px' }}>
                    {result.successCount}
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: result.failedCount > 0 ? '#fef2f2' : '#f8fafc',
                    border: `1px solid ${result.failedCount > 0 ? '#fecaca' : '#e2e8f0'}`,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: result.failedCount > 0 ? '#dc2626' : '#64748b',
                      fontWeight: 600,
                    }}
                  >
                    FAILED ROWS
                  </div>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: result.failedCount > 0 ? '#dc2626' : '#64748b',
                      marginTop: '2px',
                    }}
                  >
                    {result.failedCount}
                  </div>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#b91c1c',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <FiAlertTriangle />
                    <span>Failed Rows Breakdown ({result.errors.length})</span>
                  </div>
                  <div
                    style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', color: '#991b1b' }}>
                          <th style={{ padding: '6px 10px', textAlign: 'left' }}>Row #</th>
                          <th style={{ padding: '6px 10px', textAlign: 'left' }}>Product</th>
                          <th style={{ padding: '6px 10px', textAlign: 'left' }}>SKU</th>
                          <th style={{ padding: '6px 10px', textAlign: 'left' }}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.errors.map((err, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #fee2e2' }}>
                            <td style={{ padding: '6px 10px', fontWeight: 700 }}>Row {err.rowNumber}</td>
                            <td style={{ padding: '6px 10px' }}>{err.productName || '—'}</td>
                            <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>{err.sku || '—'}</td>
                            <td style={{ padding: '6px 10px', color: '#b91c1c' }}>{err.errorReason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'GRID' ? (
            /* TAB 1: INTERACTIVE WEB GRID */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Grid Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleAddRows(1)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <FiPlus size={14} /> Add 1 Row
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddRows(5)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <FiPlus size={14} /> Add 5 Rows
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPasteModal(true)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #c7d2fe',
                      background: '#eef2ff',
                      color: '#4338ca',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Paste tabular data directly from Excel or Google Sheets"
                  >
                    <FiClipboard size={14} /> Paste from Excel
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {validRowCount} active product(s) to save
                  </span>
                  <button
                    type="button"
                    onClick={handleClearEmptyRows}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#f1f5f9',
                      color: '#64748b',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Clear Blank Rows
                  </button>
                </div>
              </div>

              {/* Editable Table */}
              <div
                style={{
                  maxHeight: '420px',
                  overflowY: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr
                      style={{
                        background: '#4f46e5',
                        color: '#ffffff',
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                      }}
                    >
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '30px' }}>#</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '160px' }}>Product Name *</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '130px' }}>Category *</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '110px' }}>Brand</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '100px' }}>Selling Price *</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '90px' }}>Cost Price</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '70px' }}>Stock *</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '110px' }}>SKU</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '70px' }}>Size</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '80px' }}>Color</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '90px' }}>Status</th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', width: '36px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {gridRows.map((row, idx) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fcfcfd' }}>
                        {/* Row Index */}
                        <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>
                          {idx + 1}
                        </td>

                        {/* Product Name */}
                        <td style={{ padding: '4px 6px' }}>
                          <input
                            type="text"
                            placeholder="e.g. Cotton Polo"
                            value={row.productName}
                            onChange={(e) => handleCellChange(row.id, 'productName', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              outline: 'none',
                            }}
                          />
                        </td>

                        {/* Category */}
                        <td style={{ padding: '4px 6px' }}>
                          <select
                            value={row.categoryName}
                            onChange={(e) => handleCellChange(row.id, 'categoryName', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              background: '#fff',
                              outline: 'none',
                            }}
                          >
                            {categories.map((c) => (
                              <option key={c.categoryId} value={c.categoryName}>
                                {c.categoryName}
                              </option>
                            ))}
                            {categories.length === 0 && <option value="General">General</option>}
                          </select>
                        </td>

                        {/* Brand */}
                        <td style={{ padding: '4px 6px' }}>
                          <select
                            value={row.brandName}
                            onChange={(e) => handleCellChange(row.id, 'brandName', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              background: '#fff',
                              outline: 'none',
                            }}
                          >
                            <option value="">None</option>
                            {brands.map((b) => (
                              <option key={b.brandId} value={b.brandName}>
                                {b.brandName}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Selling Price */}
                        <td style={{ padding: '4px 6px' }}>
                          <input
                            type="number"
                            placeholder="25000"
                            value={row.sellingPrice}
                            onChange={(e) => handleCellChange(row.id, 'sellingPrice', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              outline: 'none',
                            }}
                          />
                        </td>

                        {/* Cost Price */}
                        <td style={{ padding: '4px 6px' }}>
                          <input
                            type="number"
                            placeholder="15000"
                            value={row.costPrice}
                            onChange={(e) => handleCellChange(row.id, 'costPrice', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              outline: 'none',
                            }}
                          />
                        </td>

                        {/* Stock */}
                        <td style={{ padding: '4px 6px' }}>
                          <input
                            type="number"
                            value={row.stock}
                            onChange={(e) => handleCellChange(row.id, 'stock', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              outline: 'none',
                            }}
                          />
                        </td>

                        {/* SKU */}
                        <td style={{ padding: '4px 6px' }}>
                          <input
                            type="text"
                            placeholder="Auto if empty"
                            value={row.sku}
                            onChange={(e) => handleCellChange(row.id, 'sku', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              outline: 'none',
                            }}
                          />
                        </td>

                        {/* Size */}
                        <td style={{ padding: '4px 6px' }}>
                          <input
                            type="text"
                            placeholder="M / XL"
                            value={row.size}
                            onChange={(e) => handleCellChange(row.id, 'size', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              outline: 'none',
                            }}
                          />
                        </td>

                        {/* Color */}
                        <td style={{ padding: '4px 6px' }}>
                          <input
                            type="text"
                            placeholder="Black"
                            value={row.color}
                            onChange={(e) => handleCellChange(row.id, 'color', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              outline: 'none',
                            }}
                          />
                        </td>

                        {/* Status */}
                        <td style={{ padding: '4px 6px' }}>
                          <select
                            value={row.status}
                            onChange={(e) => handleCellChange(row.id, 'status', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              background: '#fff',
                              outline: 'none',
                            }}
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                          </select>
                        </td>

                        {/* Delete Row Button */}
                        <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            title="Delete this row"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                            }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#94a3b8')}
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* TAB 1: MICROSOFT EXCEL APP WORKFLOW */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Step 1: Open Directly in Excel */}
              <div
                style={{
                  border: '1px solid #bbf7d0',
                  borderRadius: '14px',
                  padding: '20px',
                  background: '#f0fdf4',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: '#107c41',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      flexShrink: 0,
                    }}
                  >
                    <FiFileText />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#14532d', marginBottom: '4px' }}>
                      အဆင့် ၁: Microsoft Excel Software ဖြင့် တိုက်ရိုက်ဖွင့်ပါ
                    </div>
                    <div style={{ fontSize: '13px', color: '#166534', lineHeight: 1.5 }}>
                      အောက်ပါခလုတ်ကို နှိပ်လိုက်ပါက သင့်ကွန်ပျူတာရှိ Microsoft Excel App တန်းပွင့်လာပါမည်။ Category နှင့် Brand Dropdown များ အသင့်ပါဝင်ပြီး Product ၁,၀၀၀ မှ ၅,၀၀၀ ထိ စိတ်ကြိုက် လျင်မြန်စွာ ရိုက်ထည့်နိုင်ပါသည်။
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={handleOpenInExcelApp}
                    disabled={downloadingTemplate}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      background: '#107c41',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: downloadingTemplate ? 'wait' : 'pointer',
                      boxShadow: '0 2px 6px rgba(16, 124, 65, 0.3)',
                    }}
                  >
                    <FiExternalLink size={16} />
                    {downloadingTemplate ? 'Excel ဖွင့်နေပါသည်...' : 'Open in Microsoft Excel App'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={downloadingTemplate}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      background: '#ffffff',
                      border: '1px solid #86efac',
                      borderRadius: '8px',
                      color: '#15803d',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <FiDownload size={15} />
                    Download .xlsx File
                  </button>
                </div>

                {excelOpeningNotice && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: '#dcfce7',
                      border: '1px solid #bbf7d0',
                      color: '#166534',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <FiCheckCircle size={16} color="#16a34a" />
                    <span>
                      Microsoft Excel App ကို ဖွင့်လှစ်နေပါသည်... Browser က <strong>&quot;Open Microsoft Excel?&quot;</strong> ဟု မေးပါက <strong>Open</strong> ကို နှိပ်ပေးပါ။ သို့မဟုတ် ဒေါင်းလုဒ်ဆွဲထားသော ဖိုင်ကို နှိပ်၍လည်း Excel တွင် တိုက်ရိုက် ဖွင့်နိုင်ပါသည်။
                    </span>
                  </div>
                )}
              </div>

              {/* Step 2: Upload Filled Excel */}
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '20px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>
                    အဆင့် ၂: Excel တွင် Save ပြီးပါက ဤနေရာသို့ ပြန်တင်သွင်းပါ
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>
                    Excel ထဲတွင် Data ဖြည့်ပြီး Save (Ctrl + S) လုပ်ထားသော .xlsx ဖိုင်ကို အောက်တွင် ထည့်သွင်းပေးပါ။
                  </div>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${selectedFile ? '#107c41' : isDragging ? '#4f46e5' : '#cbd5e1'}`,
                    borderRadius: '12px',
                    padding: '28px 20px',
                    textAlign: 'center',
                    background: selectedFile ? '#f0fdf4' : isDragging ? '#eef2ff' : '#fcfcfd',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx"
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
                  />
                  {selectedFile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <FiCheckCircle size={38} color="#107c41" />
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#14532d' }}>
                        {selectedFile.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#16a34a' }}>
                        {(selectedFile.size / 1024).toFixed(1)} KB — ရွေးချယ်ပြီးပါပြီ
                      </div>
                    </div>
                  ) : (
                    <>
                      <FiUploadCloud size={38} color="#6366f1" style={{ marginBottom: '8px' }} />
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                        Click to select or drag and drop your saved Excel file here
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        Accepts .xlsx files up to 10MB (1,000 – 5,000 rows)
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {result ? 'Close' : 'Cancel'}
          </button>

          {!result ? (
            activeTab === 'GRID' ? (
              <button
                type="button"
                disabled={validRowCount === 0 || savingGrid}
                onClick={handleSaveGridToDatabase}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 22px',
                  borderRadius: '8px',
                  border: 'none',
                  background: validRowCount === 0 || savingGrid ? '#a5b4fc' : '#4f46e5',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: validRowCount === 0 || savingGrid ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
                }}
              >
                {savingGrid ? (
                  <>
                    <FiRefreshCw className="spin" size={14} />
                    Saving Products...
                  </>
                ) : (
                  <>
                    <span>Save {validRowCount > 0 ? `${validRowCount} Products` : 'All'} to Database</span>
                    <FiArrowRight size={14} />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={!selectedFile || uploading}
                onClick={handleStartFileImport}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: !selectedFile || uploading ? '#cbd5e1' : '#107c41',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer',
                  boxShadow: !selectedFile || uploading ? 'none' : '0 2px 8px rgba(16, 124, 65, 0.3)',
                }}
              >
                {uploading ? (
                  <>
                    <FiRefreshCw className="spin" size={14} />
                    စနစ်ထဲသို့ သွင်းနေပါသည်...
                  </>
                ) : (
                  <>
                    <span>စနစ်ထဲသို့ စတင်သွင်းမည် (Import Products)</span>
                    <FiArrowRight size={14} />
                  </>
                )}
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: '1px solid #4f46e5',
                background: '#4f46e5',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Add More Products
            </button>
          )}
        </div>
      </div>

      {/* Paste from Excel / Google Sheets Sub-Modal */}
      {showPasteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '20px',
          }}
          onClick={() => setShowPasteModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              width: '520px',
              maxWidth: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              Paste Table from Excel / Google Sheets
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
              Copy rows from your spreadsheet (Columns: Name, Description, Category, Brand, Price, Cost, Stock, SKU, Size, Color, Status) and paste (Ctrl+V) below:
            </p>
            <textarea
              rows={6}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste rows here (Tab-separated)..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontFamily: 'monospace',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPaste}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#4f46e5',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Apply Rows to Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
