// components/shipping/BulkEditRateModal.tsx (သို့) သက်ဆိုင်ရာ လမ်းကြောင်း
import { createPortal } from 'react-dom';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useUpdateZoneRateMutation } from './shippingApi';
import styles from './AddNewZoneModal.module.css'; // ပုံစံတူညီစေရန် AddNewZoneModal ၏ CSS ကို ယူသုံးပါ

interface BulkEditRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedZones: any[];
  onSuccess: () => void;
}

export const BulkEditRateModal: React.FC<BulkEditRateModalProps> = ({
  isOpen,
  onClose,
  selectedZones,
  onSuccess,
}) => {
  const [shippingFee, setShippingFee] = useState<number | string>('');
  const [estimatedDays, setEstimatedDays] = useState<number | string>('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | ''>('');

  const [updateZoneRate, { isLoading: isSubmitting }] =
    useUpdateZoneRateMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (shippingFee === '' && estimatedDays === '' && status === '') {
      toast.error(
        'Please enter new shipping fee, estimated days, or select a status to update.'
      );
      return;
    }

    // ရွေးချယ်ထားသော Zone အားလုံး၏ ID များကို စုစည်းမည် (Zone Group တစ်ခုတွင် ID အများကြီးပါနိုင်သည်)
    const allZoneIds = selectedZones.flatMap((zone) => zone.zoneIds || []);

    if (allZoneIds.length === 0) {
      toast.error('No zones selected for update.');
      return;
    }

    try {
      await updateZoneRate({
        zoneIds: allZoneIds,
        shippingFee: shippingFee !== '' ? Number(shippingFee) : undefined,
        estimatedDays: estimatedDays !== '' ? Number(estimatedDays) : undefined,
        status: status !== '' ? status : undefined,
      }).unwrap();
      toast.success('Rates updated successfully for selected zones.');

      onSuccess(); // Selection များကို ရှင်းလင်းရန်
      onClose();
      setShippingFee('');
      setEstimatedDays('');
      setStatus('');
    } catch (err: any) {
      toast.error(
        err?.data?.message || 'Failed to update rates. Please try again.'
      );
    }
  };

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Bulk Update Rates ({selectedZones.length} Zones Selected)</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.infoBanner} style={{ marginBottom: '16px' }}>
            <span className={styles.infoIcon}>⚠️</span>
            The new shipping fee and estimated days will be applied to all{' '}
            {selectedZones.length} selected zones.
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>New Shipping Fee (MMK)</label>
              <input
                type="number"
                value={shippingFee}
                onChange={(e) =>
                  setShippingFee(
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                min={0}
                placeholder="Leave blank for no change"
              />
            </div>
            <div className={styles.formGroup}>
              <label>New Estimated Days</label>
              <input
                type="number"
                value={estimatedDays}
                onChange={(e) =>
                  setEstimatedDays(
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                min={1}
                placeholder="Leave blank for no change"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Update Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                outline: 'none',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
              }}
            >
              <option value="">-- No Change --</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.submitBtn}
            >
              {isSubmitting ? 'Updating...' : 'Apply Bulk Update'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
