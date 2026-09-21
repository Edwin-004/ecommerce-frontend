import { Link } from 'react-router-dom';
import { FiEye } from 'react-icons/fi';
import { useGetOrdersQuery } from './orderApi'; // RTK Query မှ Hook ကို Import လုပ်ခြင်း
import styles from './AllOrders.module.css';

export const AllOrders = () => {
  // RTK Query မှ Data၊ Loading နှင့် Error အခြေအနေများကို တိုက်ရိုက်ဆွဲထုတ်ခြင်း
  // data: orders = [] ဆိုသည်မှာ data မရလာသေးခင် အလွတ် [] ဖြင့်ထားရှိရန်ဖြစ်သည်
  const { data: orders = [], isLoading, isError } = useGetOrdersQuery();

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

  return (
    <div className={styles.pageContainer}>
      <h2 className={styles.pageTitle}>All Orders</h2>

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
              // Loading ဖြစ်နေစဉ် ပြသမည်
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: 'center', padding: '20px' }}
                >
                  Loading orders...
                </td>
              </tr>
            ) : isError ? (
              // Error တက်သွားလျှင် ပြသမည်
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: 'center', padding: '20px', color: 'red' }}
                >
                  Error fetching orders!
                </td>
              </tr>
            ) : orders.length === 0 ? (
              // Data မရှိလျှင် ပြသမည်
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: 'center', padding: '20px' }}
                >
                  No orders found.
                </td>
              </tr>
            ) : (
              // Data ရလာလျှင် Loop ပတ်၍ ပြသမည်
              orders.map((order) => (
                <tr key={order.orderId}>
                  <td style={{ fontWeight: 'bold' }}>{order.orderNo}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>{order.customerName}</td>
                  <td>{order.totalAmount.toLocaleString()} MMK</td>
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
                    <Link
                      to={`/admin/orders/${order.orderNo}`}
                      className={styles.actionBtn}
                    >
                      <FiEye size={18} /> View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
