import React, { useState, useEffect } from 'react';
import { useUpdateZoneRateMutation } from './shippingApi';
import styles from './EditZoneModal.module.css';

interface EditZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: any; // displayZoneGroups မှ လာသော zone object
}

export const EditZoneModal: React.FC<EditZoneModalProps> = ({
  isOpen,
  onClose,
  zone,
}) => {
  const [updateZoneRate, { isLoading }] = useUpdateZoneRateMutation();

  // Specific Zone State များ
  const [zoneName, setZoneName] = useState('');
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [estimatedDays, setEstimatedDays] = useState<number>(1);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Default Zone (ရှိခဲ့လျှင်) State များ
  const [isEditingDefault, setIsEditingDefault] = useState(false);
  const [defaultShippingFee, setDefaultShippingFee] = useState<number>(0);
  const [defaultEstimatedDays, setDefaultEstimatedDays] = useState<number>(1);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal ပွင့်လာချိန်တွင် Data များကို Form ထဲသို့ ကြိုထည့်ပေးမည် (Pre-fill)
  useEffect(() => {
    if (zone) {
      setZoneName(zone.zoneName);
      setShippingFee(zone.shippingFee);
      setEstimatedDays(zone.estimatedDays);
      setStatus(zone.status);

      if (zone.hasDefaultRate) {
        setDefaultShippingFee(zone.defaultShippingFee || 0);
        setDefaultEstimatedDays(zone.defaultEstimatedDays || 1);
        setIsEditingDefault(false); // အစပိုင်းတွင် Checkbox မခြစ်ထားပါ
      }
    }
  }, [zone]);

  if (!isOpen || !zone) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      // ၁။ Specific Zone ကို အရင် Update လုပ်မည်
      await updateZoneRate({
        zoneIds: zone.zoneIds,
        zoneName,
        shippingFee: Number(shippingFee),
        estimatedDays: Number(estimatedDays),
        status,
      }).unwrap();

      // ၂။ Default Zone ကိုပါ ပြင်မည်ဟု Checkbox ခြစ်ထားလျှင် ထပ်မံ Update လုပ်မည်
      if (
        zone.hasDefaultRate &&
        isEditingDefault &&
        zone.defaultZoneIds?.length > 0
      ) {
        await updateZoneRate({
          zoneIds: zone.defaultZoneIds,
          // Default အတွက် Zone Name နှင့် Status ကို မပြင်ဘဲ အဟောင်းအတိုင်းထားမည် (သို့မဟုတ် လိုအပ်သလို ပြင်နိုင်သည်)
          shippingFee: Number(defaultShippingFee),
          estimatedDays: Number(defaultEstimatedDays),
        }).unwrap();
      }

      onClose(); // အကုန်အောင်မြင်ပါက Modal ပိတ်မည်
    } catch (err: any) {
      setErrorMessage(
        err?.data?.message ||
          'Zone အချက်အလက်များ ပြင်ဆင်ရာတွင် အမှားအယွင်းရှိနေပါသည်။'
      );
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Edit Zone & Rates</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            &times;
          </button>
        </div>

        {errorMessage && (
          <div className={styles.errorBanner}>{errorMessage}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Read-only Information (Region & Townships) */}
          <div className={styles.formGroup}>
            <label>Region & Assigned Townships</label>
            <div className={styles.disabledBox}>
              <div style={{ fontWeight: 600, color: '#334155' }}>
                {zone.regionOrState} - {zone.city}
              </div>
              <div className={styles.townshipChips}>
                {zone.townships?.map((t: string) => (
                  <span key={t} className={styles.chip}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Zone Name</label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Shipping Fee (Ks)</label>
              <input
                type="number"
                value={shippingFee}
                onChange={(e) => setShippingFee(Number(e.target.value))}
                min={0}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Estimated Days</label>
              <input
                type="number"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(Number(e.target.value))}
                min={1}
                required
              />
            </div>
          </div>

          {/* Default Rate ရှိပါက ပြင်ဆင်ခွင့် ပေးမည့်အပိုင်း */}
          {zone.hasDefaultRate && (
            <div className={styles.defaultRateWrapper}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isEditingDefault}
                  onChange={(e) => setIsEditingDefault(e.target.checked)}
                />
                <span style={{ fontWeight: 500, color: '#0f766e' }}>
                  Also update the Default Rate for {zone.city}
                </span>
              </label>

              {isEditingDefault && (
                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                    <label>Default Fee (Ks)</label>
                    <input
                      type="number"
                      value={defaultShippingFee}
                      onChange={(e) =>
                        setDefaultShippingFee(Number(e.target.value))
                      }
                      min={0}
                      required={isEditingDefault}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                    <label>Default Est. Days</label>
                    <input
                      type="number"
                      value={defaultEstimatedDays}
                      onChange={(e) =>
                        setDefaultEstimatedDays(Number(e.target.value))
                      }
                      min={1}
                      required={isEditingDefault}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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
              disabled={isLoading}
              className={styles.submitBtn}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
