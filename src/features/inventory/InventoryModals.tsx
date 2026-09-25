import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import styles from './Inventory.module.css';
import { inventoryApi } from './inventoryApi';
import type { InventoryItem, InventoryTransaction } from '../../types/inventory';

// ==========================================
// 1. RESTOCK MODAL
// ==========================================
interface RestockModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const RestockModal: React.FC<RestockModalProps> = ({ item, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState<number>(10);
  const [referenceType, setReferenceType] = useState<string>('MANUAL');
  const [referenceId, setReferenceId] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await inventoryApi.restockVariant({
        variantId: item.variantId,
        quantity: Number(quantity),
        referenceType,
        referenceId: referenceId ? Number(referenceId) : undefined,
        remark: remark || 'Stock replenishment',
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to restock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Restock Variant</h3>
          <button className={styles.modalClose} onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorMessage}><FiAlertCircle /> {error}</div>}

            <div className={styles.modalInfoBox}>
              <p><strong>SKU:</strong> <span className={styles.skuTag}>{item.sku}</span></p>
              <p><strong>Product:</strong> {item.productName}</p>
              <p><strong>Current Stock:</strong> {item.quantity} units</p>
            </div>

            <div className={styles.formGroup}>
              <label>Units to Add *</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Reference Type</label>
              <select value={referenceType} onChange={(e) => setReferenceType(e.target.value)}>
                <option value="MANUAL">Manual Stock In</option>
                <option value="PURCHASE_ORDER">Purchase Order</option>
                <option value="RETURN">Customer Return</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Reference ID (Optional)</label>
              <input
                type="number"
                placeholder="e.g. 1001"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Remark / Notes</label>
              <input
                type="text"
                placeholder="e.g. Supplier Batch #502"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Restocking...' : <><FiCheck /> Confirm Restock</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. WRITE-OFF MODAL
// ==========================================
interface WriteOffModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const WriteOffModal: React.FC<WriteOffModalProps> = ({ item, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [remark, setRemark] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Quantity must be at least 1');
      return;
    }
    if (quantity > item.quantity) {
      setError(`Cannot write off ${quantity} units. Current stock is only ${item.quantity}.`);
      return;
    }
    if (!remark.trim()) {
      setError('Please provide a reason for write-off');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await inventoryApi.writeOffVariant({
        variantId: item.variantId,
        quantity: Number(quantity),
        remark: remark.trim(),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to write off stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Write-Off Damaged / Expired Stock</h3>
          <button className={styles.modalClose} onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorMessage}><FiAlertCircle /> {error}</div>}

            <div className={styles.modalInfoBox}>
              <p><strong>SKU:</strong> <span className={styles.skuTag}>{item.sku}</span></p>
              <p><strong>Product:</strong> {item.productName}</p>
              <p><strong>Available Stock:</strong> <strong style={{ color: '#dc2626' }}>{item.quantity} units</strong></p>
            </div>

            <div className={styles.formGroup}>
              <label>Units to Remove *</label>
              <input
                type="number"
                min="1"
                max={item.quantity}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Reason for Write-Off *</label>
              <select value={remark} onChange={(e) => setRemark(e.target.value)} required>
                <option value="">-- Select Reason --</option>
                <option value="Damaged in warehouse storage">Damaged in warehouse storage</option>
                <option value="Expired / Past shelf life">Expired / Past shelf life</option>
                <option value="Defective from factory">Defective from factory</option>
                <option value="Lost in transit / Discrepancy">Lost in transit / Discrepancy</option>
                <option value="Water / Fire damage">Water / Fire damage</option>
              </select>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} style={{ background: '#dc2626' }} disabled={loading}>
              {loading ? 'Processing...' : 'Deduct from Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. STOCK ADJUSTMENT MODAL
// ==========================================
interface AdjustModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdjustModal: React.FC<AdjustModalProps> = ({ item, onClose, onSuccess }) => {
  const [newQuantity, setNewQuantity] = useState<number>(item.quantity);
  const [remark, setRemark] = useState<string>('Quarterly physical inventory count');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuantity < 0) {
      setError('Quantity cannot be negative');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await inventoryApi.adjustStock({
        variantId: item.variantId,
        newQuantity: Number(newQuantity),
        remark: remark.trim() || 'Physical inventory audit',
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Adjust Physical Stock Count</h3>
          <button className={styles.modalClose} onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={styles.errorMessage}><FiAlertCircle /> {error}</div>}

            <div className={styles.modalInfoBox}>
              <p><strong>SKU:</strong> <span className={styles.skuTag}>{item.sku}</span></p>
              <p><strong>Product:</strong> {item.productName}</p>
              <p><strong>System Recorded Stock:</strong> {item.quantity} units</p>
            </div>

            <div className={styles.formGroup}>
              <label>Actual Physical Count *</label>
              <input
                type="number"
                min="0"
                required
                value={newQuantity}
                onChange={(e) => setNewQuantity(Number(e.target.value))}
              />
              <small style={{ color: '#64748b' }}>
                Delta: {newQuantity - item.quantity > 0 ? `+${newQuantity - item.quantity}` : newQuantity - item.quantity} units
              </small>
            </div>

            <div className={styles.formGroup}>
              <label>Audit Reason / Remark *</label>
              <input
                type="text"
                required
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Saving...' : 'Save New Stock Count'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 4. VARIANT TRANSACTION HISTORY MODAL
// ==========================================
interface HistoryModalProps {
  item: InventoryItem;
  onClose: () => void;
}

export const VariantHistoryModal: React.FC<HistoryModalProps> = ({ item, onClose }) => {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi.getVariantTransactions(item.variantId)
      .then(setTransactions)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [item.variantId]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} ${styles.historyModal}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Audit Trail: {item.sku}</h3>
          <button className={styles.modalClose} onClick={onClose}><FiX /></button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalInfoBox}>
            <p><strong>Product:</strong> {item.productName} | <strong>Current Stock:</strong> {item.quantity} units</p>
          </div>

          <div className={styles.timeline}>
            {loading ? (
              <p style={{ textAlign: 'center', color: '#64748b' }}>Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b' }}>No transactions recorded yet.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Change</th>
                    <th>Before &rarr; After</th>
                    <th>By</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.txnId}>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${
                          t.txnType === 'RESTOCK' ? styles.badgeNormal :
                          t.txnType === 'WRITE_OFF' ? styles.badgeOutOfStock : styles.badgeLowStock
                        }`}>
                          {t.txnType}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: t.qty > 0 ? '#16a34a' : '#dc2626' }}>
                        {t.qty > 0 ? `+${t.qty}` : t.qty}
                      </td>
                      <td>{t.beforeQty} &rarr; {t.afterQty}</td>
                      <td>{t.createdByName || 'System'}</td>
                      <td style={{ fontSize: '12px' }}>{t.remark || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
