import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import { useUpdateZoneRateMutation } from './shippingApi';
import styles from './EditZoneModal.module.css';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

interface EditZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: any; // displayZoneGroups မှ လာသော zone object
}

interface TownshipPair {
  id: number;
  name: string;
}

export const EditZoneModal: React.FC<EditZoneModalProps> = ({
  isOpen,
  onClose,
  zone,
}) => {
  const [updateZoneRate, { isLoading }] = useUpdateZoneRateMutation();

  // Specific Zone State များ
  const [zoneName, setZoneName] = useState('');
  const [shippingFee, setShippingFee] = useState<number | string>('');
  const [estimatedDays, setEstimatedDays] = useState<number | string>('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [activeTownships, setActiveTownships] = useState<TownshipPair[]>([]);
  const [removedZoneIds, setRemovedZoneIds] = useState<number[]>([]);

  // Default Zone (ရှိခဲ့လျှင်) State များ
  const [isEditingDefault, setIsEditingDefault] = useState(false);
  const [defaultShippingFee, setDefaultShippingFee] = useState<number | string>(
    ''
  );
  const [defaultEstimatedDays, setDefaultEstimatedDays] = useState<
    number | string
  >('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal ပွင့်လာချိန်တွင် Data များကို Form ထဲသို့ ကြိုထည့်ပေးမည် (Pre-fill)
  useEffect(() => {
    if (zone) {
      setZoneName(zone.zoneName);
      setShippingFee(zone.shippingFee ?? '');
      setEstimatedDays(zone.estimatedDays ?? '');
      setStatus(zone.status);

      if (
        zone.townships &&
        zone.zoneIds &&
        zone.townships.length === zone.zoneIds.length
      ) {
        const pairedTownships = zone.townships.map(
          (tName: string, index: number) => ({
            id: zone.zoneIds[index],
            name: tName,
          })
        );
        setActiveTownships(pairedTownships);
        setRemovedZoneIds([]);
      } else {
        // Fallback: အကယ်၍ zoneIds မပါလာပါက အလွတ်ထားမည် သို့မဟုတ် Error ပြမည်
        setActiveTownships([]);
        setRemovedZoneIds([]);
      }

      if (zone.hasDefaultRate) {
        setDefaultShippingFee(zone.defaultShippingFee ?? '');
        setDefaultEstimatedDays(zone.defaultEstimatedDays ?? '');
        setIsEditingDefault(false); // အစပိုင်းတွင် Checkbox မခြစ်ထားပါ
      }
    }
  }, [zone]);

  if (!isOpen || !zone) return null;

  const handleRemoveTownship = (idToRemove: number) => {
    setActiveTownships((prev) => prev.filter((t) => t.id !== idToRemove));
    setRemovedZoneIds((prev) => {
      if (!prev.includes(idToRemove)) {
        return [...prev, idToRemove];
      }
      return prev;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const remainingZoneIds = activeTownships.map((t) => t.id);

    if (remainingZoneIds.length === 0) {
      setErrorMessage('At least one township must remain in the zone.');
      return;
    }

    try {
      // ၁။ Specific Zone ကို အရင် Update လုပ်မည်
      await updateZoneRate({
        zoneIds: remainingZoneIds,
        removedZoneIds: removedZoneIds,
        zoneName,
        shippingFee: Number(shippingFee),
        estimatedDays: Number(estimatedDays),
        status,
      }).unwrap();
      toast.success('Zone updated successfully.');

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
        toast.success('Default zone rates updated successfully.');
      }

      onClose(); // အကုန်အောင်မြင်ပါက Modal ပိတ်မည်
    } catch (err: any) {
      setErrorMessage(
        err?.data?.message || 'Failed to update zone. Please try again.'
      );
    }
  };

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
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
                {activeTownships.map((t) => (
                  <span key={t.id} className={styles.chip}>
                    {t.name}
                    <button
                      type="button"
                      className={styles.removeChipBtn}
                      onClick={() => handleRemoveTownship(t.id)}
                      aria-label={`Remove ${t.name}`}
                    >
                      <FiX size={12} />
                    </button>
                  </span>
                ))}

                {activeTownships.length === 0 && (
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                    No townships left.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Zone Name</label>
              <input
                type="text"
                maxLength={20}
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
              <label>Shipping Fee.</label>
              <input
                type="number"
                maxLength={50}
                value={shippingFee}
                onInput={(e) => {
                  if (e.currentTarget.value.length > 5) {
                    e.currentTarget.value = e.currentTarget.value.slice(0, 5);
                  }
                }}
                onChange={(e) =>
                  setShippingFee(
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                min={1000}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Estimated Days</label>
              <input
                type="number"
                value={estimatedDays}
                onInput={(e) => {
                  if (e.currentTarget.value.length > 2) {
                    e.currentTarget.value = e.currentTarget.value.slice(0, 2);
                  }
                }}
                onChange={(e) =>
                  setEstimatedDays(
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
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
                    <label>Default Fee.</label>
                    <input
                      type="number"
                      maxLength={50}
                      onInput={(e) => {
                        if (e.currentTarget.value.length > 5) {
                          e.currentTarget.value = e.currentTarget.value.slice(
                            0,
                            5
                          );
                        }
                      }}
                      value={defaultShippingFee}
                      onChange={(e) =>
                        setDefaultShippingFee(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      min={1000}
                      required={isEditingDefault}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                    <label>Default Est. Days</label>
                    <input
                      type="number"
                      value={defaultEstimatedDays}
                      onInput={(e) => {
                        if (e.currentTarget.value.length > 2) {
                          e.currentTarget.value = e.currentTarget.value.slice(
                            0,
                            2
                          );
                        }
                      }}
                      onChange={(e) =>
                        setDefaultEstimatedDays(
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
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
    </div>,
    document.body
  );
};
