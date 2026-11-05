import { BackButton } from '../../components/common/BackButton';
import {
  useGetOrdersQuery,
  useGetOrderByOrderNoQuery,
  useGetPaymentByOrderNoQuery,
  useGetCouriersQuery,
  useCreateShipmentMutation,
  useUpdateOrderStatusMutation,
  useGetOrderStatusHistoryQuery,
} from './orderApi';
import styles from './AllOrders.module.css';
import { DatePicker } from '../../components/common/DatePicker';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { useEffect, useState, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';

const ORDER_EXPORT_COLUMNS = [
  { key: 'orderNo', label: 'Order No' },
  { key: 'orderDate', label: 'Date' },
  { key: 'customerName', label: 'Customer' },
  { key: 'totalAmount', label: 'Total Amount' },
  { key: 'orderStatus', label: 'Order Status' },
  { key: 'paymentStatus', label: 'Payment' },
];

export const AllOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const paramPage = Number(searchParams.get('page')) || 0;
  const paramStatus = searchParams.get('status') || 'PAID'; // Default PAID
  const paramSearch = searchParams.get('search') || '';
  const paramStart = searchParams.get('start') || '';
  const paramEnd = searchParams.get('end') || '';
  const paramOrderNo = searchParams.get('orderNo') || null;

  const [currentPage, setCurrentPageState] = useState(paramPage);
  const [startDate, setStartDateState] = useState<string>(paramStart);
  const [endDate, setEndDateState] = useState<string>(paramEnd);
  const [statusFilter, setStatusFilterState] = useState<string>(paramStatus);
  const [searchTerm, setSearchTermState] = useState<string>(paramSearch);
  const [selectedOrderNo, setSelectedOrderNoState] = useState<string | null>(
    paramOrderNo
  );

  const updateOrderQueryParams = (updates: {
    page?: number;
    status?: string;
    search?: string;
    start?: string;
    end?: string;
    orderNo?: string | null;
  }) => {
    const next = new URLSearchParams(searchParams);
    const nextStatus =
      updates.status !== undefined ? updates.status : statusFilter;
    const nextSearch =
      updates.search !== undefined ? updates.search : searchTerm;
    const nextStart = updates.start !== undefined ? updates.start : startDate;
    const nextEnd = updates.end !== undefined ? updates.end : endDate;
    const nextPage = updates.page !== undefined ? updates.page : 0;
    const nextOrderNo =
      updates.orderNo !== undefined ? updates.orderNo : selectedOrderNo;

    if (nextStatus && nextStatus !== 'ALL') next.set('status', nextStatus);
    else next.delete('status');
    if (nextSearch && nextSearch.trim()) next.set('search', nextSearch.trim());
    else next.delete('search');
    if (nextStart) next.set('start', nextStart);
    else next.delete('start');
    if (nextEnd) next.set('end', nextEnd);
    else next.delete('end');
    if (nextPage > 0) next.set('page', String(nextPage));
    else next.delete('page');
    if (nextOrderNo) next.set('orderNo', nextOrderNo);
    else next.delete('orderNo');

    setSearchParams(next, { replace: true });
  };

  const setStatusFilter = (st: string) => {
    setStatusFilterState(st);
    setCurrentPageState(0);
    updateOrderQueryParams({ status: st, page: 0 });
  };

  const setSearchTerm = (s: string) => {
    setSearchTermState(s);
    setCurrentPageState(0);
    updateOrderQueryParams({ search: s, page: 0 });
  };

  const setStartDate = (d: string) => {
    setStartDateState(d);
    setCurrentPageState(0);
    updateOrderQueryParams({ start: d, page: 0 });
  };

  const setEndDate = (d: string) => {
    setEndDateState(d);
    setCurrentPageState(0);
    updateOrderQueryParams({ end: d, page: 0 });
  };

  const setCurrentPage = (p: number) => {
    setCurrentPageState(p);
    updateOrderQueryParams({ page: p });
  };

  const setSelectedOrderNo = (no: string | null) => {
    setSelectedOrderNoState(no);
    updateOrderQueryParams({ orderNo: no });
  };

  useEffect(() => {
    setStatusFilterState(searchParams.get('status') || 'PAID');
    setSearchTermState(searchParams.get('search') || '');
    setStartDateState(searchParams.get('start') || '');
    setEndDateState(searchParams.get('end') || '');
    setCurrentPageState(Number(searchParams.get('page')) || 0);
    setSelectedOrderNoState(searchParams.get('orderNo') || null);
  }, [searchParams]);

  const pageSize = 10;

  const { data, isLoading, isError } = useGetOrdersQuery({
    page: currentPage,
    size: pageSize,
    status: statusFilter,
    search: searchTerm,
    startDate: startDate,
    endDate: endDate,
  });

  const orders = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const { data: paymentInfo, isLoading: LoadingPaymentInfo } =
    useGetPaymentByOrderNoQuery(selectedOrderNo || '', {
      skip: !selectedOrderNo,
    });
  const { data: orderDetails, isLoading: loadingDetails } =
    useGetOrderByOrderNoQuery(selectedOrderNo || '', {
      skip: !selectedOrderNo,
    });

  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>(
    ORDER_EXPORT_COLUMNS.map((c) => c.key)
  );
  const [showColumnDropdown, setShowColumnDropdown] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [exportingFormat, setExportingFormat] = useState<
    'pdf' | 'excel' | null
  >(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<
    string | null
  >(null);

  const columnDropdownRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

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
          toast.error('At least one column must be selected for export.');
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
      toast.error('Please select at least one column to export.');
      return;
    }
    try {
      setExportingFormat(format);
      setShowExportMenu(false);

      if (searchTerm && searchTerm.trim().length > 100) {
        alert('Search query cannot exceed 100 characters for export.');
        return;
      }

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
        throw new Error(
          errorText || `Export failed with status ${response.status}`
        );
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
      toast.error(
        'Failed to export orders report: ' + (err.message || 'Unknown error')
      );
    } finally {
      setExportingFormat(null);
    }
  };

  const { data: statusHistory = [], isLoading: isLoadingHistory } =
    useGetOrderStatusHistoryQuery(selectedOrderNo || '', {
      skip: !selectedOrderNo,
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
  const [courierName, setCourierName] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const { data: courierList = [] } = useGetCouriersQuery();
  const [createShipment, { isLoading: isCreatingShipment }] =
    useCreateShipmentMutation();
  const [updateOrderStatusApi, { isLoading: isUpdatingStatus }] =
    useUpdateOrderStatusMutation();

  const isUpdating = isCreatingShipment || isUpdatingStatus;

  const VALID_TRANSITIONS: Record<string, string[]> = {
    PENDING: ['PAID'],
    PAID: ['PROCESSING'],
    PROCESSING: ['SHIPPED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
  };

  const ALL_STATUS_OPTIONS = [
    'PENDING',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
  ];

  const currentOrderStatus = orderDetails?.orderStatus || '';
  const allowedNextStatuses = VALID_TRANSITIONS[currentOrderStatus] || [];

  const handleUpdateClick = () => {
    if (selectedStatus === 'SHIPPED') {
      setShowShipmentModal(true);
    } else {
      handleStatusUpdate();
    }
  };

  useEffect(() => {
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
        await createShipment({
          orderNo: selectedOrderNo,
          courierName,
          trackingNumber,
        }).unwrap();
      } else {
        await updateOrderStatusApi({
          orderNo: selectedOrderNo,
          newStatus: selectedStatus,
        }).unwrap();
      }
      setShowShipmentModal(false);
      setTrackingNumber('');
      toast.success('Order status updated successfully.');
    } catch (error) {
      toast.error('Failed to update order status. Please try again.');
    }
  };

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
          <div className={styles.titleArea}>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              All Orders
            </h1>
            <p className="text-xs text-slate-500">
              Track customer purchases, fulfillment stages, shipments, and
              payment statuses
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
          ].map((status) => (
            <button
              key={status}
              className={`${styles.tabButton} ${statusFilter === status ? styles.activeTab : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
        <div className={styles.rightFilterGroup}>
          <div className={styles.datePickerContainer}>
            <DatePicker
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Start Date"
              style={{ width: '135px' }}
              inputStyle={{
                border: 'none',
                padding: '4px 22px 4px 0',
                fontSize: '12px',
                background: 'transparent',
              }}
            />
            <span className={styles.dateSeparator}>-</span>
            <DatePicker
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="End Date"
              align="right"
              style={{ width: '135px' }}
              inputStyle={{
                border: 'none',
                padding: '4px 22px 4px 0',
                fontSize: '12px',
                background: 'transparent',
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <div className={styles.searchContainer}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search Order No or Customer..."
              maxLength={100}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div
            className={styles.columnSelectorContainer}
            ref={columnDropdownRef}
          >
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
                  <span className={styles.columnDropdownTitle}>
                    Export Columns
                  </span>
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

          <div className={styles.exportDropdownContainer} ref={exportMenuRef}>
            <button
              type="button"
              className={`${styles.btnExportDropdown} ${exportingFormat ? styles.btnExporting : ''}`}
              onClick={() => setShowExportMenu((prev) => !prev)}
              disabled={!!exportingFormat}
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
                  <i
                    className="bi bi-chevron-down ms-1"
                    style={{ fontSize: '11px' }}
                  />
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
                    <span className={styles.exportMenuTitle}>
                      Excel Spreadsheet
                    </span>
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
                    <span className={styles.exportMenuSub}>
                      Standard PDF report
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!selectedOrderNo ? (
        <div className={styles.tableContainer}>
          <table
            className={`${styles.orderTable} ${orders.length > 0 ? 'table-with-data' : 'table-empty'}`}
          >
            <thead>
              <tr>
                <th
                  className="text-center"
                  style={{ width: '60px', textAlign: 'center' }}
                >
                  No.
                </th>
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
                    Failed to load orders. Please try again.
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.tableCellCenter}>
                    No orders found{' '}
                    {statusFilter !== 'ALL' && `for status "${statusFilter}"`}.
                  </td>
                </tr>
              ) : (
                orders.map((order: any, index: number) => {
                  const rowNumber = currentPage * pageSize + index + 1;
                  return (
                    <tr
                      key={order.orderId}
                      onClick={() => setSelectedOrderNo(order.orderNo)}
                      className={styles.tableRow}
                    >
                      <td
                        className="text-center"
                        style={{
                          fontWeight: 600,
                          color: '#64748b',
                          textAlign: 'center',
                        }}
                      >
                        {rowNumber}
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{order.orderNo}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>{order.customerName}</td>
                      <td>{order.totalAmount?.toLocaleString()} MMK</td>
                      <td>
                        <span
                          className={`${styles.badge} ${getStatusBadgeClass(order.orderStatus)}`}
                        >
                          {order.orderStatus === 'DELIVERED' && (
                            <span className={styles.statusDot}>✔</span>
                          )}
                          {order.orderStatus === 'SHIPPED' && (
                            <span className={styles.statusDot}>🚚</span>
                          )}
                          {order.orderStatus === 'PROCESSING' && (
                            <span className={styles.statusDot}>⚙</span>
                          )}
                          {order.orderStatus === 'CANCELLED' && (
                            <span className={styles.statusDot}>✖</span>
                          )}
                          <span>{order.orderStatus}</span>
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.paymentBadge} ${order.paymentStatus === 'SUCCESS' || order.paymentStatus === 'PAID' ? styles.paymentSuccess : order.paymentStatus === 'REFUNDED' || order.paymentStatus === 'PARTIALLY_REFUNDED' ? styles.paymentRefunded : styles.paymentPending}`}
                        >
                          {(order.paymentStatus === 'SUCCESS' ||
                            order.paymentStatus === 'PAID') &&
                            '✔ '}
                          {order.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {orders.length > 0 && totalPages > 0 && (
            <div className={styles.paginationContainer}>
              <span className={styles.pageInfoText}>
                Page {currentPage + 1} of {totalPages}
              </span>
              <div className={styles.paginationControls}>
                <button
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 0))}
                  disabled={currentPage === 0}
                  className={styles.paginationBtn}
                >
                  <FiChevronLeft size={15} /> Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(currentPage + 1, totalPages - 1))
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
        <div className={styles.splitContainer}>
          <div className={styles.listContainer}>
            {orders.map((order: any) => (
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
                  {order.orderNo} | {formatDate(order.createdAt)}
                </div>
                <div>
                  Order Status :
                  <span
                    className={`${styles.badge} ${getStatusBadgeClass(order.orderStatus)}`}
                    style={{ marginLeft: '8px' }}
                  >
                    {order.orderStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.detailContainer}>
            {loadingDetails ? (
              <p>Loading details...</p>
            ) : orderDetails ? (
              <div>
                <div
                  className={styles.detailHeader}
                  style={{ justifyContent: 'flex-start', gap: '14px' }}
                >
                  <BackButton
                    onClick={() => setSelectedOrderNo(null)}
                    label="Back"
                  />
                  <h3 style={{ margin: 0 }}>
                    Order Details: #{orderDetails.orderNo}
                  </h3>
                </div>
                <div className={styles.detailGrid}>
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
                        {formatDateTime(orderDetails.createdAt)}
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
                                    {' '}
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
                                      {formatDateTime(history.changedAt)}
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
                  <div className={styles.actionColumn}>
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Order Action</h3>
                      <p style={{ marginBottom: '16px' }}>
                        Current Status:{' '}
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
                          disabled={allowedNextStatuses.length === 0}
                        >
                          <option value={currentOrderStatus}>
                            {currentOrderStatus}
                          </option>
                          {ALL_STATUS_OPTIONS.filter((status) =>
                            allowedNextStatuses.includes(status)
                          ).map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleUpdateClick}
                          className={styles.updateBtn}
                          disabled={
                            isUpdating ||
                            selectedStatus === orderDetails.orderStatus ||
                            allowedNextStatuses.length === 0
                          }
                        >
                          {isUpdating ? 'Updating...' : 'Update Status'}
                        </button>
                      </div>
                    </div>

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
                                ? formatDateTime(paymentInfo.paidAt)
                                : '-'}
                            </strong>
                          </div>
                        </div>
                      ) : (
                        <p
                          style={{ fontSize: '14px', color: '#999', margin: 0 }}
                        >
                          Payment data not found.
                        </p>
                      )}
                    </div>

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
                                ? formatDateTime(
                                    orderDetails.shipment.shippedAt
                                  )
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
              <p>No order data available.</p>
            )}
          </div>
        </div>
      )}

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
