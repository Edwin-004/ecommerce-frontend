import React, { useState, useEffect } from 'react';
import styles from './OrderManagement.module.css';
import type { OrderResponseDto } from '../../types/order';

const OrderManagement = () => {
  const [ordersList, setOrdersList] = useState<OrderResponseDto[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [selectedOrderNo, setSelectedOrderNo] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderResponseDto | null>(
    null
  );
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const API_BASE_URL = 'http://localhost:8080/api/backoffice/orders';

  // ၁။ ဘယ်ဘက်ခြမ်းအတွက် Order List ကို အရင်ဆွဲယူခြင်း
  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        const data = await response.json();
        setOrdersList(data); // မျှော်မှန်းချက် - Array of Orders ပြန်လာမည်
      } catch (err) {
        console.error('Order List ယူရာတွင် အမှားဖြစ်နေသည်:', err);
      } finally {
        setLoadingList(false);
      }
    };
    fetchAllOrders();
  }, []);

  // ၂။ ဘယ်ဘက်ခြမ်းမှ Order တစ်ခုကို နှိပ်လိုက်တိုင်း ညာဘက်ခြမ်းအတွက် Detail API ထပ်ခေါ်ခြင်း
  useEffect(() => {
    if (!selectedOrderNo) return;

    const fetchOrderDetails = async () => {
      setLoadingDetails(true);
      try {
        const response = await fetch(`${API_BASE_URL}/${selectedOrderNo}`);
        const data = await response.json();
        setOrderDetails(data);
        setSelectedStatus(data.orderStatus); // ညာဘက် Action Box အတွက် Status အလိုအလျောက်ရွေးပေးခြင်း
      } catch (err) {
        console.error('Order Detail ယူရာတွင် အမှားဖြစ်နေသည်:', err);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchOrderDetails();
  }, [selectedOrderNo]);

  // ၃။ ညာဘက်ခြမ်းရှိ Update Status လုပ်ဆောင်ချက်
  const handleStatusUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/${selectedOrderNo}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: selectedStatus }),
        }
      );

      if (response.ok) {
        alert('Changed Order Status successfully');
        // Update ပြီးပါက UI တွင် ချက်ချင်းပြောင်းပေးရန်
        setOrderDetails((prev: OrderResponseDto | null) => {
          if (!prev) return prev;
          return { ...prev, orderStatus: selectedStatus };
        });

        // ဘယ်ဘက်က List ထဲက Status ကိုပါ တစ်ခါတည်း Update လုပ်ပေးခြင်း
        setOrdersList((prevList) =>
          prevList.map((o) =>
            o.orderNo === selectedOrderNo
              ? { ...o, orderStatus: selectedStatus }
              : o
          )
        );
      }
    } catch (err) {
      alert('Status ပြောင်းလဲရာတွင် အမှားဖြစ်နေပါသည်။');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* ===================== ဘယ်ဘက်ခြမ်း (Order List) ===================== */}
      <div className={styles.leftPane}>
        <div className={styles.listHeader}>
          <h2>All Orders</h2>
        </div>

        <div className={styles.orderList}>
          {loadingList ? (
            <div style={{ padding: '20px' }}>Loading orders...</div>
          ) : (
            ordersList.map((order) => (
              <div
                key={order.orderNo}
                // ရွေးချယ်ထားသော Order ဖြစ်ပါက အရောင်ပြောင်းရန် CSS class ထည့်ခြင်း
                className={`${styles.orderItem} ${selectedOrderNo === order.orderNo ? styles.activeOrder : ''}`}
                onClick={() => setSelectedOrderNo(order.orderNo)} // နှိပ်လိုက်ပါက ID ကို State သို့ထည့်မည်
              >
                <div className={styles.orderItemHeader}>
                  <span className={styles.orderNo}>{order.orderNo}</span>
                  <span className={styles.orderDate}>
                    {order.createdAt?.split(' ')[0]}
                  </span>
                </div>
                <span className={styles.orderCustomer}>
                  {order.customerName}
                </span>
                <div className={styles.orderFooter}>
                  <span style={{ fontWeight: '600' }}>
                    {order.totalAmount?.toLocaleString()} MMK
                  </span>
                  <span
                    className={`${styles.badge} ${styles[order.orderStatus]}`}
                  >
                    {order.orderStatus}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===================== ညာဘက်ခြမ်း (Order Detail) ===================== */}
      <div className={styles.rightPane}>
        {!selectedOrderNo ? (
          // ဘာမှ မရွေးရသေးပါက ပြမည့် စာသား
          <div className={styles.emptyState}>
            အသေးစိတ်ကြည့်ရှုရန် ဘယ်ဘက်စာရင်းမှ Order တစ်ခုကို ရွေးချယ်ပါ။
          </div>
        ) : loadingDetails ? (
          <div>Loading details...</div>
        ) : orderDetails ? (
          <div>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>
              Order Details: #{orderDetails.orderNo}
            </h2>

            <div className={styles.detailGrid}>
              {/* Information View (Customer + Items) */}
              <div>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Customer Information</h3>
                  <p>
                    <strong>Name:</strong> {orderDetails.customerName}
                  </p>
                  <p>
                    <strong>Phone:</strong>{' '}
                    {orderDetails.shippingAddress?.phoneNumber}
                  </p>
                  <p>
                    <strong>Address:</strong>{' '}
                    {orderDetails.shippingAddress?.addressLine1},{' '}
                    {orderDetails.shippingAddress?.city}
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
                      {orderDetails.items?.map(
                        (item: {
                          orderItemId: React.Key | null | undefined;
                          productName:
                            | string
                            | number
                            | bigint
                            | boolean
                            | React.ReactElement<
                                unknown,
                                string | React.JSXElementConstructor<any>
                              >
                            | Iterable<React.ReactNode>
                            | React.ReactPortal
                            | Promise<
                                | string
                                | number
                                | bigint
                                | boolean
                                | React.ReactPortal
                                | React.ReactElement<
                                    unknown,
                                    string | React.JSXElementConstructor<any>
                                  >
                                | Iterable<React.ReactNode>
                                | null
                                | undefined
                              >
                            | null
                            | undefined;
                          qty:
                            | string
                            | number
                            | bigint
                            | boolean
                            | React.ReactElement<
                                unknown,
                                string | React.JSXElementConstructor<any>
                              >
                            | Iterable<React.ReactNode>
                            | React.ReactPortal
                            | Promise<
                                | string
                                | number
                                | bigint
                                | boolean
                                | React.ReactPortal
                                | React.ReactElement<
                                    unknown,
                                    string | React.JSXElementConstructor<any>
                                  >
                                | Iterable<React.ReactNode>
                                | null
                                | undefined
                              >
                            | null
                            | undefined;
                          subtotal: {
                            toLocaleString: () =>
                              | string
                              | number
                              | bigint
                              | boolean
                              | React.ReactElement<
                                  unknown,
                                  string | React.JSXElementConstructor<any>
                                >
                              | Iterable<React.ReactNode>
                              | React.ReactPortal
                              | Promise<
                                  | string
                                  | number
                                  | bigint
                                  | boolean
                                  | React.ReactPortal
                                  | React.ReactElement<
                                      unknown,
                                      string | React.JSXElementConstructor<any>
                                    >
                                  | Iterable<React.ReactNode>
                                  | null
                                  | undefined
                                >
                              | null
                              | undefined;
                          };
                        }) => (
                          <tr key={item.orderItemId}>
                            <td>{item.productName}</td>
                            <td>{item.qty}</td>
                            <td>{item.subtotal?.toLocaleString()} MMK</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                  <div className={styles.totalSection}>
                    <h4>
                      Total:{' '}
                      <span style={{ color: 'green' }}>
                        {orderDetails.totalAmount?.toLocaleString()} MMK
                      </span>
                    </h4>
                  </div>
                </div>
              </div>

              {/* Action View (Update Status) */}
              <div>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Order Action</h3>
                  <p>
                    Current Status: <strong>{orderDetails.orderStatus}</strong>
                  </p>

                  <div className={styles.statusUpdateBox}>
                    <label>Update Status to:</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className={styles.statusSelect}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>

                    <button
                      onClick={handleStatusUpdate}
                      className={styles.updateBtn}
                      disabled={
                        selectedStatus === orderDetails.orderStatus ||
                        isUpdating
                      }
                    >
                      {isUpdating ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>Order Data မရှိပါ။</div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
