import React, { useState, useEffect, useRef } from 'react';
import {
  useGetLocationsQuery,
  useCreateZoneGroupMutation,
  useGetZoneGroupsQuery,
} from './shippingApi';
import styles from './AddNewZoneModal.module.css';

interface AddNewZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddNewZoneModal: React.FC<AddNewZoneModalProps> = ({
  isOpen,
  onClose,
}) => {
  // ၁။ Master Data ဆွဲထုတ်ရန် Hook
  const { data: locations = [], isLoading: isLocationsLoading } =
    useGetLocationsQuery();

  // ၂။ Zone အသစ်ဆောက်ရန် Mutation Hook
  const [createZoneGroup, { isLoading: isSubmitting }] =
    useCreateZoneGroupMutation();

  const { data: existingZones = [] } = useGetZoneGroupsQuery();

  // Form State များ
  const [zoneName, setZoneName] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [selectedRegionOrState, setSelectedRegionOrState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedTownships, setSelectedTownships] = useState<string[]>([]);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [estimatedDays, setEstimatedDays] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [enableDefaultRate, setEnableDefaultRate] = useState(false);
  const [defaultShippingFee, setDefaultShippingFee] = useState<number>(0);
  const [defaultEstimatedDays, setDefaultEstimatedDays] = useState<number>(1);

  //အသစ်ထပ်ထည့်ရန် - ရွေးချယ်ထားသော မြို့အတွက် Default Zone (isCityDefault = true) ရှိပြီးသားလား စစ်ဆေးမည်
  const isDefaultAlreadyExists = existingZones.some(
    (zone) => zone.city === selectedCity && zone.isCityDefault
  );

  // Dropdown အပြင်ဘက်ကို နှိပ်လိုက်ပါက ပိတ်သွားစေရန်
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Region ရွေးလိုက်လျှင် City ကို အလိုအလျောက် သတ်မှတ်ရန်
  const currentRegionData = locations.find(
    (loc) => loc.regionOrState === selectedRegionOrState
  );
  const availableTownships = currentRegionData
    ? currentRegionData.townships
    : [];

  // Search လုပ်ထားသော မြို့နယ်စာရင်း
  const filteredTownships = availableTownships.filter(
    (t) =>
      !selectedTownships.includes(t) &&
      t.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Region ပြောင်းသွားပါက City ကိုပါ တစ်ပါတည်း ချိန်ညှိပေးရန်
  useEffect(() => {
    if (currentRegionData) {
      setSelectedCity(currentRegionData.city);
    } else {
      setSelectedCity('');
    }
    setSelectedTownships([]); // မြို့နယ် ရွေးချယ်မှုများကို Reset ချရန်
  }, [selectedRegionOrState, currentRegionData]);

  // City ပြောင်းသွားတိုင်း Zone Code (Base Code) ကို အလိုအလျောက် ထုတ်ပေးမည်
  useEffect(() => {
    if (selectedCity) {
      const prefix = selectedCity.substring(0, 3).toUpperCase();
      const timestamp = Date.now() % 1000;
      setZoneCode(`${prefix}-${timestamp}`);
    } else {
      setZoneCode('');
    }
  }, [selectedCity]);

  if (!isOpen) return null;

  // Form Submit လုပ်သည့်အခါ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!zoneName || !selectedRegionOrState || !shippingFee) {
      setErrorMessage('ကျေးဇူးပြု၍ လိုအပ်သော အချက်အလက်များကို ဖြည့်စွက်ပါ။');
      return;
    }

    try {
      await createZoneGroup({
        zoneName,
        zoneCode: zoneCode,
        regionOrState: selectedRegionOrState,
        city: selectedCity,
        townships: selectedTownships,
        shippingFee: Number(shippingFee),
        estimatedDays: Number(estimatedDays),
        hasDefaultRate: !isDefaultAlreadyExists && enableDefaultRate,
        defaultShippingFee: enableDefaultRate
          ? Number(defaultShippingFee)
          : undefined,
        defaultEstimatedDays: enableDefaultRate
          ? Number(defaultEstimatedDays)
          : undefined,
      }).unwrap();

      // အောင်မြင်ပါက Modal ပိတ်ပြီး Form ကို ရှင်းလင်းမည်
      onClose();
      setZoneName('');
      setSelectedRegionOrState('');
      setSelectedTownships([]);
      setShippingFee(0);
      setEstimatedDays(1);
    } catch (err: any) {
      setErrorMessage(
        err?.data?.message || 'Zone အသစ် ဖန်တီးရာတွင် အမှားအယွင်း ရှိ နေပါသည်။'
      );
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Add New Delivery Zone</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            &times;
          </button>
        </div>

        {errorMessage && (
          <div className={styles.errorBanner}>{errorMessage}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Zone Name (example - Yangon Downtown)</label>
            <input
              value={zoneName}
              type="text"
              onChange={(e) => setZoneName(e.target.value)}
              placeholder="Enter zone name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Zone Code</label>
            <input
              type="text"
              value={zoneCode}
              disabled
              className={styles.disabledInput}
              placeholder="Auto-generated"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Region / State</label>
              <select
                value={selectedRegionOrState}
                onChange={(e) => setSelectedRegionOrState(e.target.value)}
                required
              >
                <option value="">-- Select Region --</option>
                {isLocationsLoading ? (
                  <option disabled>Loading regions...</option>
                ) : (
                  locations.map((loc) => (
                    <option key={loc.regionOrState} value={loc.regionOrState}>
                      {loc.regionOrState} ({loc.city})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>City</label>
              <input
                type="text"
                value={selectedCity}
                disabled
                className={styles.disabledInput}
              />
            </div>
          </div>

          {selectedRegionOrState && (
            <div className={styles.formGroup}>
              <label>
                Select Townships ({selectedTownships.length} selected)
              </label>

              <div
                className={styles.dropdownContainerWrapper}
                ref={dropdownRef}
              >
                {/* Search Input Field */}
                <div className={styles.searchInputWrapper}>
                  <input
                    type="text"
                    placeholder="Type to search township..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className={styles.dropdownSelect}
                  />
                </div>

                {/* Dropdown List Box */}
                {isDropdownOpen && (
                  <ul className={styles.dropdownList}>
                    {filteredTownships.length === 0 ? (
                      <li className={styles.dropdownItemEmpty}>
                        No townships found
                      </li>
                    ) : (
                      filteredTownships.map((township) => (
                        <li
                          key={township}
                          onClick={() => {
                            setSelectedTownships([
                              ...selectedTownships,
                              township,
                            ]);
                            setSearchTerm(''); // ရွေးပြီးပါက Search Input ကို ရှင်းမည်
                            // မပိတ်ဘဲ ဆက်ရွေးချင်ပါက setIsDropdownOpen(true) ကို ဆက်ထားနိုင်သည်
                          }}
                          className={styles.dropdownItem}
                        >
                          {township}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
              {/* Selected Townships Tags (Chips) */}
              <div className={styles.selectedTagsContainer}>
                {selectedTownships.length === 0 ? (
                  <span className={styles.noTownshipText}>
                    No townships selected yet
                  </span>
                ) : (
                  selectedTownships.map((township) => (
                    <span key={township} className={styles.townshipTagChip}>
                      {township}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedTownships(
                            selectedTownships.filter((t) => t !== township)
                          )
                        }
                        className={styles.removeTagBtn}
                      >
                        &times;
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Shipping Fee For Selected Townships (Ks)</label>
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

          <hr className={styles.divider} />

          {/* ၃။ ကျန်သော မြို့နယ်အားလုံးအတွက် Default Rate (Checkbox + Inputs) */}

          {/* Default Rate သတ်မှတ်ပြီးသား ဖြစ်နေပါက Info Banner ပြမည် */}
          {isDefaultAlreadyExists && selectedCity && (
            <div className={styles.infoBanner}>
              <span className={styles.infoIcon}>💡</span>A default shipping rate
              is already configured for {selectedCity}. You only need to set the
              specific rate for the selected townships.
            </div>
          )}

          {/* Default Rate မရှိသေးမှသာ Checkbox နှင့် Input များ ပြမည် */}
          {!isDefaultAlreadyExists && selectedRegionOrState && (
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={enableDefaultRate}
                  onChange={(e) => setEnableDefaultRate(e.target.checked)}
                />
                <span>
                  Also set a Default Rate for all other unselected townships in
                  this city
                </span>
              </label>
            </div>
          )}

          {/* Checkbox ခြစ်ထားပါက ပေါ်လာမည့် Form */}
          {/* formRow နဲ့ defaultRateWrapper Class (၂) ခုကို ပေါင်းရေးမည် */}
          {!isDefaultAlreadyExists && enableDefaultRate && (
            <div className={`${styles.formRow} ${styles.defaultRateWrapper}`}>
              <div className={styles.formGroup}>
                <label>Default Shipping Fee (Ks)</label>
                <input
                  type="number"
                  value={defaultShippingFee}
                  onChange={(e) =>
                    setDefaultShippingFee(Number(e.target.value))
                  }
                  min={0}
                  required={enableDefaultRate}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Default Estimated Days</label>
                <input
                  type="number"
                  value={defaultEstimatedDays}
                  onChange={(e) =>
                    setDefaultEstimatedDays(Number(e.target.value))
                  }
                  min={1}
                  required={enableDefaultRate}
                />
              </div>
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
              disabled={isSubmitting}
              className={styles.submitBtn}
            >
              {isSubmitting ? 'Saving...' : 'Save Zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
