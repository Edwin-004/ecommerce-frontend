import {
  useGetOrdersQuery,
  useGetOrderByOrderNoQuery,
  useGetPaymentByOrderNoQuery,
  useGetCouriersQuery,
  useCreateShipmentMutation,
  useUpdateOrderStatusMutation,
} from './orderApi'; // RTK Query မှ Hook ကို Import လုပ်ခြင်း
import styles from './AllOrders.module.css';
import { useEffect, useState } from 'react';

export const AllOrders = () => {
  // RTK Query မှ Data၊ Loading နှင့် Error အခြေအနေများကို တိုက်ရိုက်ဆွဲထုတ်ခြင်း
  // data: orders = [] ဆိုသည်မှာ data မရလာသေးခင် အလွတ် [] ဖြင့်ထားရှိရန်ဖြစ်သည်
  const { data: orders = [], isLoading, isError } = useGetOrdersQuery();
  const [selectedOrderNo, setSelectedOrderNo] = useState<string | null>(null);
  const { data: paymentInfo, isLoading: LoadingPaymentInfo } =
    useGetPaymentByOrderNoQuery(selectedOrderNo || '', {
      skip: !selectedOrderNo,
    });
  const { data: orderDetails, isLoading: loadingDetails } =
    useGetOrderByOrderNoQuery(selectedOrderNo || '', {
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
      <h2 className={styles.pageTitle}>All Orders</h2>

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
                  <td colSpan={6} className={styles.tableCellCenter}>
                    Loading orders...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'red' }}>
                    Error fetching orders!
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.tableCellCenter}>
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
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
        </div>
      ) : (
        /* ==================== View ၂။ Split View (ရွေးချယ်ထားချိန်) ==================== */
        <div className={styles.splitContainer}>
          {/* ဘယ်ဘက်ခြမ်း: List View */}
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
                  >
                    ✖
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
                        <label style={{ fontSize: '14px', fontWeight: '500' }}>
                          Update Status to:
                        </label>
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
                    {/* ၂။ Payment Information Card (အသစ်ထပ်တိုးရန်) */}
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
