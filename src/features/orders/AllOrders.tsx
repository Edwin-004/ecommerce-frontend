import { BackButton } from '../../components/common/BackButton';
import {
  useGetOrdersQuery,
  useGetOrderByOrderNoQuery,
  useGetPaymentByOrderNoQuery,
  useGetCouriersQuery,
  useCreateShipmentMutation,
  useUpdateOrderStatusMutation,
  useGetOrderStatusHistoryQuery,
} from './orderApi'; // RTK Query မှ Hook ကို Import လုပ်ခြင်း
import styles from './AllOrders.module.css';
import { useEffect, useState, useRef } from 'react';
import {
  FiShoppingCart,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiSearch,
} from 'react-icons/fi';

const ORDER_EXPORT_COLUMNS = [
  { key: 'orderNo', label: 'Order No' },
  { key: 'orderDate', label: 'Date' },
  { key: 'customerName', label: 'Customer' },
  { key: 'totalAmount', label: 'Total Amount' },
  { key: 'orderStatus', label: 'Order Status' },
  { key: 'paymentStatus', label: 'Payment' },
];

export const AllOrders = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const { data, isLoading, isError } = useGetOrdersQuery({
    page: currentPage,
    size: pageSize,
  });
  // data ထဲတွင် ယခုအခါ data.content အဖြစ် ပြောင်းသွားပါမည်
  const orders = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const [selectedOrderNo, setSelectedOrderNo] = useState<string | null>(null);
  const { data: paymentInfo, isLoading: LoadingPaymentInfo } =
    useGetPaymentByOrderNoQuery(selectedOrderNo || '', {
      skip: !selectedOrderNo,
    });
  const { data: orderDetails, isLoading: loadingDetails } =
    useGetOrderByOrderNoQuery(selectedOrderNo || '', {
      skip: !selectedOrderNo,
    });

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Dynamic Export State
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>(
    ORDER_EXPORT_COLUMNS.map((c) => c.key)
  );
  const [showColumnDropdown, setShowColumnDropdown] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'excel' | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const columnDropdownRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
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

  const handleToggleColumn = (colKey: string) => {
    setSelectedExportColumns((prev) => {
      if (prev.includes(colKey)) {
        if (prev.length === 1) {
          alert('At least one column must be selected for export.');
          return prev;
        }
        return prev.filter((k) => k !== colKey);
      }
      return [...prev, colKey];
    });
  };

  const handleSelectAllColumns = () => {
    setSelectedExportColumns(ORDER_EXPORT_COLUMNS.map((c) => c.key));
  };

  const handleDynamicExport = async (format: 'pdf' | 'excel') => {
    if (selectedExportColumns.length === 0) {
      alert('Please select at least one column to export.');
      return;
    }
    try {
      setExportingFormat(format);
      setShowExportMenu(false);

      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      if (searchTerm && searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      params.append('columns', selectedExportColumns.join(','));

      const response = await fetch(
        `http://localhost:8080/api/v1/reports/orders/export/${format}?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Export failed');
        throw new Error(errorText || `Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      const filename = `orders-report.${ext}`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setExportSuccessMessage(`Successfully downloaded ${filename}`);
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to export orders report:', err);
      alert('Failed to export orders report: ' + (err.message || 'Unknown error'));
    } finally {
      setExportingFormat(null);
    }
  };


  const filteredOrders = orders.filter((order: any) => {
    const matchStatus =
      statusFilter === 'ALL' || order.orderStatus === statusFilter;
    const matchSearch =
      order.orderNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const getOrderCountByStatus = (status: string) => {
    if (status === 'ALL') return orders.length;
    return orders.filter((order: any) => order.orderStatus === status).length;
  };

  const { data: statusHistory = [], isLoading: isLoadingHistory } =
    useGetOrderStatusHistoryQuery(selectedOrderNo || '', {
      skip: !selectedOrderNo, // ရွေးထားတဲ့ OrderNo မရှိရင် API မခေါ်ပါ
    });

  const getCourierPrefix = (name: string) => {
    switch (name) {
      case 'J_AND_T':
        return 'JNT';
      case 'NINJAVAN':
        return 'NJA';
      case 'ROYAL_EXPRESS':
        return 'RYL';
      case 'FLASH_EXPRESS':
        return 'FLS';
      case 'KMD':
        return 'KMD';
      default:
        return 'TRK';
    }
  };
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showShipmentModal, setShowShipmentModal] = useState<boolean>(false);
  const [courierName, setCourierName] = useState<string>(''); // Default Enum
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  // const [courierList, setCourierList] = useState<string[]>([]);
  const { data: courierList = [] } = useGetCouriersQuery();
  const [createShipment, { isLoading: isCreatingShipment }] =
    useCreateShipmentMutation();
  const [updateOrderStatusApi, { isLoading: isUpdatingStatus }] =
    useUpdateOrderStatusMutation();
  const isUpdating = isCreatingShipment || isUpdatingStatus;

  const handleUpdateClick = () => {
    if (selectedStatus === 'SHIPPED') {
      setShowShipmentModal(true); // Modal ကို ဖွင့်ပါ
    } else {
      handleStatusUpdate(); // မူလအတိုင်း တန်းပြီး Status ပြောင်းပါ
    }
  };

  useEffect(() => {
    // Modal ပွင့်နေပြီး Courier လည်း ရွေးထားမယ်၊ Order No လည်း ရှိနေမယ်ဆိုရင်
    if (showShipmentModal && courierName && selectedOrderNo) {
      const prefix = getCourierPrefix(courierName);
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const formattedOrderNo = selectedOrderNo.replace(/_/g, '-');

      setTrackingNumber(`${prefix}-${formattedOrderNo}-${randomDigits}`);
    } else {
      setTrackingNumber('');
    }
  }, [courierName, selectedOrderNo, showShipmentModal]);

  useEffect(() => {
    if (courierList.length > 0 && !courierName) {
      setCourierName(courierList[0]);
    }
  }, [courierList, courierName]);

  // J_AND_T ကဲ့သို့သော Enum String များကို J&T Express ဟု ဖတ်လွယ်အောင် ပြောင်းပေးမည့် Helper
  const formatCourierName = (name: string) => {
    if (name === 'J_AND_T') return 'J&T Express';
    if (name === 'NINJAVAN') return 'Ninjavan';
    if (name === 'ROYAL_EXPRESS') return 'Royal Express';
    if (name === 'FLASH_EXPRESS') return 'Flash Express';
    if (name === 'KMD') return 'KMD Express';
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  useEffect(() => {
    if (orderDetails) {
      setSelectedStatus(orderDetails.orderStatus);
    }
  }, [orderDetails]);

  const handleStatusUpdate = async () => {
    if (!selectedOrderNo) return;

    try {
      if (selectedStatus === 'SHIPPED') {
        // Shipment API ခေါ်ခြင်း (POST)
        await createShipment({
          orderNo: selectedOrderNo,
          courierName,
          trackingNumber,
        }).unwrap();
      } else {
        // ရိုးရိုး Status ပြောင်းသည့် API ခေါ်ခြင်း (PATCH)
        await updateOrderStatusApi({
          orderNo: selectedOrderNo,
          newStatus: selectedStatus,
        }).unwrap();
      }

      alert('Status Updated Successfully!');
      setShowShipmentModal(false);
      setTrackingNumber('');
    } catch (error) {
      console.log('Error updating status:', error);
      alert('Status Update unsuccessful! Please try again.');
    }
  };

  // Status ပေါ်မူတည်၍ အရောင်ရွေးပေးမည့် Helper Method
  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return styles.statusPending;
      case 'PROCESSING':
        return styles.statusProcessing;
      case 'SHIPPED':
        return styles.statusShipped;
      case 'DELIVERED':
        return styles.statusDelivered;
      case 'CANCELLED':
        return styles.statusCancelled;
      default:
        return '';
    }
  };

  // variantAttributes String (eg: "{"Size": "L"}") ကို ပြေပြစ်စွာပြသရန် Helper
  const formatAttributes = (attrString: string) => {
    try {
      const parsed = JSON.parse(attrString);
      return Object.values(parsed).join(', ');
    } catch {
      return attrString;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <BackButton fallbackUrl="/admin/dashboard" />
          <div className={styles.titleArea}>
            <h1>
              <FiShoppingCart /> All Orders
            </h1>
            <p>
              Track customer purchases, fulfillment stages, shipments, and payment
              statuses
            </p>
          </div>
        </div>
      </div>

      {exportSuccessMessage && (
        <div className={styles.exportSuccessBanner}>
          <i className="bi bi-check-circle-fill text-success me-2" />
          <span>{exportSuccessMessage}</span>
        </div>
      )}

      <div className={styles.filterSection}>
        <div className={styles.tabsContainer}>
          {[
            'ALL',
            'PENDING',
            'PAID',
            'PROCESSING',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED',
          ].map((status) => {
            const count = getOrderCountByStatus(status);
            return (
              <button
                key={status}
                className={`${styles.tabButton} ${statusFilter === status ? styles.activeTab : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
                <span
                  className={`${styles.statusCountBadge} ${statusFilter === status ? styles.activeCountBadge : ''}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div className={styles.searchContainer}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search Order No or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Dynamic Column Selector Popover */}
          <div className={styles.columnSelectorContainer} ref={columnDropdownRef}>
            <button
              type="button"
              className={styles.btnColumnSelector}
              onClick={() => setShowColumnDropdown((prev) => !prev)}
              title="Select columns to export"
            >
              <i className="bi bi-sliders text-secondary me-1" />
              <span>Columns ({selectedExportColumns.length}/6)</span>
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
                  {ORDER_EXPORT_COLUMNS.map((col) => (
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

          {/* Export Dropdown Menu (PDF & Excel Only) */}
          <div className={styles.exportDropdownContainer} ref={exportMenuRef}>
            <button
              type="button"
              className={`${styles.btnExportDropdown} ${exportingFormat ? styles.btnExporting : ''}`}
              onClick={() => setShowExportMenu((prev) => !prev)}
              disabled={!!exportingFormat}
              title="Export filtered orders as PDF or Excel"
            >
              {exportingFormat ? (
                <>
                  <span className={styles.exportSpinner} />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-download me-1" />
                  <span>Export</span>
                  <i className="bi bi-chevron-down ms-1" style={{ fontSize: '11px' }} />
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
                    void handleDynamicExport('excel');
                  }}
                >
                  <div className={styles.exportMenuIconExcel}>
                    <i className="bi bi-file-earmark-excel fs-5" />
                  </div>
                  <div className={styles.exportMenuText}>
                    <span className={styles.exportMenuTitle}>Excel Spreadsheet</span>
                    <span className={styles.exportMenuSub}>.xlsx format</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={styles.exportMenuItem}
                  onClick={() => {
                    setShowExportMenu(false);
                    void handleDynamicExport('pdf');
                  }}
                >
                  <div className={styles.exportMenuIconPdf}>
                    <i className="bi bi-file-earmark-pdf fs-5" />
                  </div>
                  <div className={styles.exportMenuText}>
                    <span className={styles.exportMenuTitle}>PDF Document</span>
                    <span className={styles.exportMenuSub}>Standard PDF report</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!selectedOrderNo ? (
        /* ==================== View ၁။ Table View (ဘာမှမရွေးထားချိန်) ==================== */
        <div className={styles.tableContainer}>
          <table className={styles.orderTable}>
            <thead>
              <tr>
                <th>Order No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Total Amount</th>
                <th>Order Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className={styles.tableCellCenter}>
                    Loading orders...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'red' }}>
                    Error fetching orders!
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.tableCellCenter}>
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => (
                  <tr
                    key={order.orderId}
                    onClick={() => setSelectedOrderNo(order.orderNo)}
                    className={styles.tableRow}
                  >
                    <td style={{ fontWeight: 'bold' }}>{order.orderNo}</td>
                    <td>{order.createdAt?.split(' ')[0]}</td>
                    <td>{order.customerName}</td>
                    <td>{order.totalAmount?.toLocaleString()} MMK</td>
                    <td>
                      <span
                        className={`${styles.badge} ${getStatusBadgeClass(order.orderStatus)}`}
                      >
                        {order.orderStatus === 'DELIVERED' && <span className={styles.statusDot}>✔</span>}
                        {order.orderStatus === 'PENDING' && <span className={styles.statusDot}>⏳</span>}
                        {order.orderStatus === 'SHIPPED' && <span className={styles.statusDot}>🚚</span>}
                        {order.orderStatus === 'PROCESSING' && <span className={styles.statusDot}>⚙</span>}
                        {order.orderStatus === 'CANCELLED' && <span className={styles.statusDot}>✖</span>}
                        <span>{order.orderStatus}</span>
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.paymentBadge} ${order.paymentStatus === 'SUCCESS' || order.paymentStatus === 'PAID' ? styles.paymentSuccess : (order.paymentStatus === 'REFUNDED' || order.paymentStatus === 'PARTIALLY_REFUNDED' ? styles.paymentRefunded : styles.paymentPending)}`}>
                        {(order.paymentStatus === 'SUCCESS' || order.paymentStatus === 'PAID') && '✔ '}
                        {order.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* ================= Pagination Controls (အသစ်ထပ်တိုးရန်) ================= */}
          {totalPages > 0 && (
            <div className={styles.paginationContainer}>
              <span className={styles.pageInfoText}>
                Page {currentPage + 1} of {totalPages}
              </span>
              <div className={styles.paginationControls}>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 0))
                  }
                  disabled={currentPage === 0}
                  className={styles.paginationBtn}
                >
                  <FiChevronLeft size={15} /> Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
                  }
                  disabled={data?.last || currentPage === totalPages - 1}
                  className={styles.paginationBtn}
                >
                  Next <FiChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ==================== View ၂။ Split View (ရွေးချယ်ထားချိန်) ==================== */
        <div className={styles.splitContainer}>
          {/* ဘယ်ဘက်ခြမ်း: List View */}
          <div className={styles.listContainer}>
            {filteredOrders.map((order: any) => (
              <div
                key={order.orderId}
                className={`${styles.listItem} ${selectedOrderNo === order.orderNo ? styles.activeOrder : ''}`}
                onClick={() => setSelectedOrderNo(order.orderNo)}
              >
                <div className={styles.listHeader}>
                  <strong className={styles.customerName}>
                    {order.customerName}
                  </strong>
                  <span className={styles.amountText}>
                    {order.totalAmount?.toLocaleString()} MMK
                  </span>
                </div>
                <div className={styles.listSubtext}>
                  {order.orderNo} • {order.createdAt?.split(' ')[0]}
                </div>
                <div>
                  Order Status :
                  <span
                    className={`${styles.badge} ${getStatusBadgeClass(order.orderStatus)}`}
                  >
                    {order.orderStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ညာဘက်ခြမ်း: Detail View */}
          <div className={styles.detailContainer}>
            {loadingDetails ? (
              <p>Loading details...</p>
            ) : orderDetails ? (
              <div>
                <div className={styles.detailHeader}>
                  <h3>Order Details: #{orderDetails.orderNo}</h3>
                  {/* Close Button ထည့်သွင်းခြင်း */}
                  <button
                    className={styles.closeBtn}
                    onClick={() => setSelectedOrderNo(null)}
                    aria-label="Close details"
                  >
                    <FiX size={18} />
                  </button>
                </div>

                {/* --- ဒီနေရာမှစ၍ OrderManagement ၏ Card UI ဖြင့် အစားထိုးထားသည် --- */}
                <div className={styles.detailGrid}>
                  {/* Information View (Customer + Items) */}
                  <div>
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Customer Information</h3>
                      <p className={styles.infoText}>
                        <strong>Name:</strong> {orderDetails.customerName}
                      </p>
                      <p className={styles.infoText}>
                        <strong>Phone:</strong>{' '}
                        {orderDetails.shippingAddress?.phoneNumber || 'N/A'}
                      </p>
                      <p className={styles.infoText}>
                        <strong>Address:</strong>{' '}
                        {[
                          orderDetails.shippingAddress?.addressLine1,
                          orderDetails.shippingAddress?.township,
                          orderDetails.shippingAddress?.city,
                          orderDetails.shippingAddress?.regionOrState,
                        ]
                          .filter(Boolean)
                          .join(', ') || 'N/A'}
                      </p>
                      <p className={styles.infoText}>
                        <strong>Date: </strong>
                        {orderDetails.createdAt}
                      </p>
                    </div>

                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Ordered Items</h3>
                      <table className={styles.itemTable}>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderDetails.items?.map((item: any) => (
                            <tr key={item.orderItemId}>
                              <td>
                                {item.productName}
                                {item.variantAttributes && (
                                  <span className={styles.variantText}>
                                    ({formatAttributes(item.variantAttributes)})
                                  </span>
                                )}
                              </td>
                              <td>{item.qty}</td>
                              <td>{item.subtotal?.toLocaleString()} MMK</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className={styles.totalSection}>
                        <h4 style={{ margin: 0 }}>
                          Total:{' '}
                          <span className={styles.totalText}>
                            {orderDetails.totalAmount?.toLocaleString()} MMK
                          </span>
                        </h4>
                      </div>
                    </div>

                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Status History</h3>

                      {isLoadingHistory ? (
                        <p className={styles.loadingText}>Loading history...</p>
                      ) : statusHistory.length > 0 ? (
                        <div className={styles.historyTableWrapper}>
                          <table className={styles.historyTable}>
                            <thead>
                              <tr>
                                <th>Status</th>
                                <th>Date & Time</th>
                                <th>Updated By</th>
                              </tr>
                            </thead>
                            <tbody>
                              {statusHistory.map(
                                (history: any, index: number) => (
                                  <tr key={history.historyId || index}>
                                    <td>
                                      <span
                                        className={`${styles.badge} ${getStatusBadgeClass(history.newStatus)}`}
                                        style={{
                                          fontSize: '11px',
                                          padding: '4px 8px',
                                        }}
                                      >
                                        {history.newStatus}
                                      </span>
                                    </td>
                                    <td className={styles.historyTimeCell}>
                                      {history.changedAt?.split('T').join(' ')}
                                    </td>
                                    <td className={styles.historyUserCell}>
                                      {history.changedBy || 'System Admin'}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p
                          style={{ fontSize: '14px', color: '#999', margin: 0 }}
                        >
                          No status history available.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action View (Update Status) */}
                  <div className={styles.actionColumn}>
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Order Action</h3>
                      <p style={{ marginBottom: '16px' }}>
                        Status:{' '}
                        <span
                          className={`${styles.badge} ${getStatusBadgeClass(orderDetails.orderStatus)}`}
                        >
                          {orderDetails.orderStatus}
                        </span>
                      </p>

                      <div className={styles.statusUpdateBox}>
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className={styles.statusSelect}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PAID">PAID</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>

                        <button
                          onClick={handleUpdateClick}
                          className={styles.updateBtn}
                          disabled={
                            isUpdating ||
                            selectedStatus === orderDetails.orderStatus
                          }
                        >
                          {isUpdating ? 'Updating...' : 'Update Status'}
                        </button>
                      </div>
                    </div>
                    {/* ၂။ Payment Information Card*/}
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Payment Information</h3>
                      {LoadingPaymentInfo ? (
                        <p className={styles.loadingText}>
                          Loading payment info...
                        </p>
                      ) : paymentInfo ? (
                        <div>
                          <div className={styles.paymentRow}>
                            <span className={styles.paymentLabel}>Status:</span>
                            <strong
                              className={
                                paymentInfo.paymentStatus === 'SUCCESS'
                                  ? styles.paymentStatusSuccess
                                  : paymentInfo.paymentStatus === 'FAILED'
                                    ? styles.paymentStatusFailed
                                    : styles.paymentStatusPending
                              }
                            >
                              {paymentInfo.paymentStatus || 'N/A'}
                            </strong>
                          </div>

                          <div className={styles.paymentRow}>
                            <span className={styles.paymentLabel}>Method:</span>
                            <strong className={styles.paymentValue}>
                              {paymentInfo.paymentMethod || 'N/A'}
                            </strong>
                          </div>

                          <div className={styles.paymentRow}>
                            <span className={styles.paymentLabel}>
                              Txn Ref:
                            </span>
                            <strong className={styles.txnRefValue}>
                              {paymentInfo.transactionRef || 'N/A'}
                            </strong>
                          </div>

                          <div className={styles.paymentRow}>
                            <span className={styles.paymentLabel}>
                              Paid At:
                            </span>
                            <strong className={styles.paymentValue}>
                              {paymentInfo.paidAt
                                ? paymentInfo.paidAt.split('T').join(' ')
                                : '-'}
                            </strong>
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: '14px', color: '#999' }}>
                          Payment data not found.
                        </p>
                      )}
                    </div>
                    {/* ၃။ Shipment Information Card */}
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Shipment Information</h3>

                      {orderDetails.shipment ? (
                        <div>
                          <div className={styles.paymentRow}>
                            <span className={styles.paymentLabel}>
                              Courier:
                            </span>
                            <strong className={styles.paymentValue}>
                              {formatCourierName(
                                orderDetails.shipment.courierName
                              )}
                            </strong>
                          </div>

                          <div className={styles.paymentRow}>
                            <span className={styles.paymentLabel}>
                              Tracking:
                            </span>
                            <strong
                              className={styles.txnRefValue}
                              style={{ color: '#556ee6' }}
                            >
                              {orderDetails.shipment.trackingNumber || 'N/A'}
                            </strong>
                          </div>

                          <div className={styles.paymentRow}>
                            <span className={styles.paymentLabel}>
                              Shipped At:
                            </span>
                            <strong className={styles.paymentValue}>
                              {orderDetails.shipment.shippedAt
                                ? orderDetails.shipment.shippedAt
                                    .split('T')
                                    .join(' ')
                                : '-'}
                            </strong>
                          </div>
                        </div>
                      ) : (
                        <p
                          style={{ fontSize: '14px', color: '#999', margin: 0 }}
                        >
                          Shipment not created yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p>Order Data မရှိပါ။</p>
            )}
          </div>
        </div>
      )}

      {/* ==================== Shipment Modal ==================== */}
      {showShipmentModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalHeaderTitle}>Create Shipment</h3>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Courier Service:</label>
              <select
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                className={styles.formControl}
              >
                {/* Backend မှ ရလာသော Courier List ကို Dynamic Map ထုတ်ခြင်း */}
                {courierList.length > 0 ? (
                  courierList.map((courier) => (
                    <option key={courier} value={courier}>
                      {formatCourierName(courier)}
                    </option>
                  ))
                ) : (
                  <option value="">Loading...</option>
                )}
              </select>
            </div>

            <div className={styles.formGroupLast}>
              <label className={styles.inputLabel}>Tracking Number:</label>
              <input
                type="text"
                value={trackingNumber}
                readOnly
                placeholder="Enter waybill number"
                className={styles.formControl}
              />
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowShipmentModal(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={!trackingNumber.trim() || isUpdating}
                className={styles.confirmBtn}
              >
                {isUpdating ? 'Saving...' : 'Confirm & Ship'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
