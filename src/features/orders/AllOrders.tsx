import { Link } from 'react-router-dom';
import { FiEye } from 'react-icons/fi';
import { useGetOrdersQuery, useGetOrderByOrderNoQuery } from './orderApi'; // RTK Query မှ Hook ကို Import လုပ်ခြင်း
import styles from './AllOrders.module.css';
import { useEffect, useState } from 'react';

export const AllOrders = () => {
  // RTK Query မှ Data၊ Loading နှင့် Error အခြေအနေများကို တိုက်ရိုက်ဆွဲထုတ်ခြင်း
  // data: orders = [] ဆိုသည်မှာ data မရလာသေးခင် အလွတ် [] ဖြင့်ထားရှိရန်ဖြစ်သည်
  const { data: orders = [], isLoading, isError } = useGetOrdersQuery();
  const [selectedOrderNo, setSelectedOrderNo] = useState<string | null>(null);
  const {
    data: orderDetails,
    isLoading: loadingDetails,
    refetch,
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
            // 'Authorization': `Bearer ${token}` // Token လိုအပ်ပါက ဖြည့်ပါ
          },
          body: JSON.stringify({ status: selectedStatus }),
        }
      );

      if (!response.ok) throw new Error('Status Update Failed!');

      alert('Order Status အောင်မြင်စွာ ပြောင်းလဲသွားပါပြီ။');

      // Update အောင်မြင်သွားပါက ညာဘက်ခြမ်း Detail Data ကို အသစ်ပြန်ခေါ် (Refresh) လုပ်ရန်
      refetch();
    } catch (error) {
      alert('Status ပြောင်းလဲရာတွင် အမှားဖြစ်နေပါသည်။');
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>
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
                  <td colSpan={7} style={{ textAlign: 'center' }}>
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.orderId}>
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
                    <td>
                      <button
                        className={styles.actionBtn}
                        onClick={() => setSelectedOrderNo(order.orderNo)}
                      >
                        <FiEye size={18} /> View
                      </button>
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
                  <h3>Order: #{orderDetails.orderNo}</h3>
                  {/* Close Button ထည့်သွင်းခြင်း */}
                  <button
                    className={styles.closeBtn}
                    onClick={() => setSelectedOrderNo(null)}
                  >
                    ✖
                  </button>
                </div>

                {/* Customer & Address Info */}
                <div style={{ marginBottom: '20px', lineHeight: '1.6' }}>
                  <p style={{ margin: 0 }}>
                    <strong>Customer:</strong> {orderDetails.customerName}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Phone:</strong>{' '}
                    {orderDetails.shippingAddress?.phoneNumber || 'N/A'}
                  </p>

                  {/* Address အပြည့်အစုံ ထည့်သွင်းခြင်း */}
                  <p style={{ margin: 0 }}>
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

                  <p
                    style={{
                      margin: '8px 0 0 0',
                      color: 'green',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                    }}
                  >
                    Total: {orderDetails.totalAmount?.toLocaleString()} MMK
                  </p>
                </div>

                {/* Items List */}
                <h4
                  style={{
                    margin: '16px 0 8px 0',
                    borderBottom: '1px solid #eee',
                    paddingBottom: '4px',
                  }}
                >
                  Items
                </h4>
                <ul
                  style={{
                    paddingLeft: '20px',
                    margin: '0 0 24px 0',
                    fontSize: '14.5px',
                  }}
                >
                  {orderDetails.items?.map((item: any) => (
                    <li key={item.orderItemId} style={{ marginBottom: '8px' }}>
                      {item.productName}
                      {item.variantAttributes && (
                        <span style={{ color: 'gray' }}>
                          {' '}
                          ({formatAttributes(item.variantAttributes)})
                        </span>
                      )}{' '}
                      x {item.qty}
                      <span style={{ float: 'right', fontWeight: '500' }}>
                        {item.subtotal?.toLocaleString()} Ks
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Status Update Action */}
                <div
                  style={{
                    backgroundColor: '#f8f9fa',
                    padding: '16px',
                    borderRadius: '6px',
                  }}
                >
                  <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                    Update Status
                  </p>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginBottom: '12px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                    }}
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
                    disabled={
                      isUpdating || selectedStatus === orderDetails.orderStatus
                    }
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#556ee6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor:
                        isUpdating ||
                        selectedStatus === orderDetails.orderStatus
                          ? 'not-allowed'
                          : 'pointer',
                      opacity:
                        isUpdating ||
                        selectedStatus === orderDetails.orderStatus
                          ? 0.7
                          : 1,
                    }}
                  >
                    {isUpdating ? 'Updating...' : 'Update Status'}
                  </button>
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
