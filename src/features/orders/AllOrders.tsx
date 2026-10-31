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
import { useEffect, useState } from 'react';
import {
  FiShoppingCart,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiSearch,
} from 'react-icons/fi';

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
  const VALID_TRANSITIONS: Record<string, string[]> = {
    PENDING: ['PAID'],
    PAID: ['PROCESSING'],
    PROCESSING: ['SHIPPED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [], // ဘယ်မှ ထပ်သွားခွင့်မရှိပါ
    CANCELLED: [], // ဘယ်မှ ထပ်သွားခွင့်မရှိပါ
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
                        {order.orderStatus}
                      </span>
                    </td>
                    <td>
                      <span className={styles.paymentSuccess}>
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
                    {order.totalAmount?.toLocaleString()} Ks
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
                              <td>{item.subtotal?.toLocaleString()} Ks</td>
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
                          {/* လက်ရှိ Status ကို အမြဲတမ်း Default အနေနဲ့ ပြထားပေးမည် */}
                          <option value={currentOrderStatus}>
                            {currentOrderStatus}
                          </option>

                          {/* သွားခွင့်ရှိတဲ့ Status များကိုသာ Option အဖြစ် Filter ထုတ်ပြီး ပြမည် */}
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
