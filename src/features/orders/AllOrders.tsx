import {
  useGetOrdersQuery,
  useGetOrderByOrderNoQuery,
  useGetPaymentByOrderNoQuery,
} from './orderApi'; // RTK Query မှ Hook ကို Import လုပ်ခြင်း
import styles from './AllOrders.module.css';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

export const AllOrders = () => {
  // RTK Query မှ Data၊ Loading နှင့် Error အခြေအနေများကို တိုက်ရိုက်ဆွဲထုတ်ခြင်း
  // data: orders = [] ဆိုသည်မှာ data မရလာသေးခင် အလွတ် [] ဖြင့်ထားရှိရန်ဖြစ်သည်
  const {
    data: orders = [],
    isLoading,
    isError,
    refetch: refetchList,
  } = useGetOrdersQuery();
  const [selectedOrderNo, setSelectedOrderNo] = useState<string | null>(null);
  const {
    data: paymentInfo,
    isLoading: LoadingPaymentInfo,
    refetch: refetchPaymentInfo,
  } = useGetPaymentByOrderNoQuery(selectedOrderNo || '', {
    skip: !selectedOrderNo,
  });
  const token =
    useSelector((state: any) => state.auth.token) ||
    localStorage.getItem('token');
  const {
    data: orderDetails,
    isLoading: loadingDetails,
    refetch: refetchDetails,
  } = useGetOrderByOrderNoQuery(selectedOrderNo || '', {
    skip: !selectedOrderNo,
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    if (orderDetails) {
      setSelectedStatus(orderDetails.orderStatus);
    }
  }, [orderDetails]);

  const handleStatusUpdate = async () => {
    if (!selectedOrderNo) return;

    setIsUpdating(true);
    try {
      // Backend သို့ PATCH Request ပို့ခြင်း
      const response = await fetch(
        `http://localhost:8080/api/backoffice/orders/${selectedOrderNo}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newStatus: selectedStatus }),
        }
      );

      if (!response.ok) throw new Error('Status Update Failed!');

      alert('Status Updated Successfully!');

      // Update အောင်မြင်သွားပါက ညာဘက်ခြမ်း Detail Data ကို အသစ်ပြန်ခေါ် (Refresh) လုပ်ရန်
      refetchDetails();
      refetchList();
      refetchPaymentInfo();
    } catch (error) {
      alert('Status Update unsuccessful! Please try again.');
    } finally {
      setIsUpdating(false);
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
                  <td colSpan={6} style={{ textAlign: 'center' }}>
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
                  <td colSpan={6} style={{ textAlign: 'center' }}>
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr
                    key={order.orderId}
                    onClick={() => setSelectedOrderNo(order.orderNo)}
                    style={{ cursor: 'pointer' }}
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
                      <span
                        style={{
                          color:
                            order.paymentStatus === 'SUCCESS'
                              ? 'green'
                              : 'orange',
                          fontWeight: 'bold',
                        }}
                      >
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
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                  }}
                >
                  <strong style={{ fontSize: '15px' }}>
                    {order.customerName}
                  </strong>
                  <span style={{ fontWeight: 'bold' }}>
                    {order.totalAmount?.toLocaleString()} Ks
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#666',
                    marginBottom: '8px',
                  }}
                >
                  {order.orderNo} • {order.createdAt?.split(' ')[0]}
                </div>
                <div>
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
                      <p style={{ margin: '8px 0' }}>
                        <strong>Name:</strong> {orderDetails.customerName}
                      </p>
                      <p style={{ margin: '8px 0' }}>
                        <strong>Phone:</strong>{' '}
                        {orderDetails.shippingAddress?.phoneNumber || 'N/A'}
                      </p>
                      <p style={{ margin: '8px 0' }}>
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
                      <p style={{ margin: '8px 0' }}>
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
                                  <span
                                    style={{
                                      color: 'gray',
                                      display: 'block',
                                      fontSize: '13px',
                                    }}
                                  >
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
                          <span style={{ color: 'green', fontSize: '1.2rem' }}>
                            {orderDetails.totalAmount?.toLocaleString()} MMK
                          </span>
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Action View (Update Status) */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '24px',
                    }}
                  >
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
                          onClick={handleStatusUpdate}
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
                        <p style={{ fontSize: '14px', color: '#666' }}>
                          Loading payment info...
                        </p>
                      ) : paymentInfo ? (
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              marginBottom: '12px',
                              alignItems: 'flex-start',
                            }}
                          >
                            <span
                              style={{
                                color: '#666',
                                width: '80px',
                                flexShrink: 0,
                              }}
                            >
                              Status:
                            </span>
                            <strong
                              style={{
                                color:
                                  paymentInfo.paymentStatus === 'SUCCESS'
                                    ? '#34df5c'
                                    : paymentInfo.paymentStatus === 'FAILED'
                                      ? '#ec3241'
                                      : '#f4c52b',
                              }}
                            >
                              {paymentInfo.paymentStatus || 'N/A'}
                            </strong>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              marginBottom: '12px',
                              alignItems: 'flex-start',
                            }}
                          >
                            <span
                              style={{
                                color: '#666',
                                width: '80px',
                                flexShrink: 0,
                              }}
                            >
                              Method:
                            </span>
                            <strong style={{ wordBreak: 'break-word' }}>
                              {paymentInfo.paymentMethod || 'N/A'}
                            </strong>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              marginBottom: '12px',
                              alignItems: 'flex-start',
                            }}
                          >
                            <span
                              style={{
                                color: '#666',
                                width: '80px',
                                flexShrink: 0,
                              }}
                            >
                              Txn Ref:
                            </span>
                            <strong style={{ wordBreak: 'break-all' }}>
                              {paymentInfo.transactionRef || 'N/A'}
                            </strong>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                            }}
                          >
                            <span
                              style={{
                                color: '#666',
                                width: '80px',
                                flexShrink: 0,
                              }}
                            >
                              Paid At:
                            </span>
                            <strong style={{ wordBreak: 'break-word' }}>
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
    </div>
  );
};
