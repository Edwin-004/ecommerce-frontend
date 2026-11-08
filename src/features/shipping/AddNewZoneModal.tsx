import { createPortal } from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  useGetLocationsQuery,
  useCreateZoneGroupMutation,
  useGetZoneGroupsQuery,
  useGetAssignedTownshipsQuery,
  useGetTownshipsByCityQuery,
  useGetCitiesByRegionQuery,
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
  // ⭐️ Dropdown State ၃ ဆင့်
  const [selectedRegionOrState, setSelectedRegionOrState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // ၁။ Master Data ဆွဲထုတ်ရန် Hooks
  const { data: locations = [], isLoading: isLocationsLoading } =
    useGetLocationsQuery();

  const { data: cities = [] } = useGetCitiesByRegionQuery(
    selectedRegionOrState,
    {
      skip: !selectedRegionOrState,
    }
  );

  // ⭐️ City အောက်ရှိ Townships များကို တိုက်ရိုက်ယူမည်
  const { data: availableTownships = [] } = useGetTownshipsByCityQuery(
    selectedCity,
    {
      skip: !selectedCity,
    }
  );

  // ၂။ Zone အသစ်ဆောက်ရန် Mutation Hook
  const [createZoneGroup, { isLoading: isSubmitting }] =
    useCreateZoneGroupMutation();

  const { data: zoneGroupsResponse } = useGetZoneGroupsQuery();
  const existingZones = zoneGroupsResponse?.content || [];

  // Form State များ
  const [zoneName, setZoneName] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [selectedTownships, setSelectedTownships] = useState<string[]>([]);
  const [shippingFee, setShippingFee] = useState<number | string>('');
  const [estimatedDays, setEstimatedDays] = useState<number | string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [enableDefaultRate, setEnableDefaultRate] = useState(false);
  const [defaultShippingFee, setDefaultShippingFee] = useState<number | string>(
    ''
  );
  const [defaultEstimatedDays, setDefaultEstimatedDays] = useState<
    number | string
  >('');

  // ရွေးချယ်ထားသော မြို့အတွက် Default Zone ရှိပြီးသားလား စစ်ဆေးမည်
  const isDefaultAlreadyExists = existingZones.some((zone: any) => {
    const isDefault = zone.isCityDefault === true || zone.cityDefault === true;

    const savedCity = (zone.city || '').replace(/\s+/g, '').toLowerCase();
    const currentCity = (selectedCity || '').replace(/\s+/g, '').toLowerCase();

    return savedCity === currentCity && isDefault;
  });

  // ⭐️ Region ပြောင်းသွားတိုင်း City နှင့် Township များကို Reset ချမည်
  useEffect(() => {
    setSelectedCity('');
    setSelectedTownships([]);
  }, [selectedRegionOrState]);

  // ⭐️ City ပြောင်းသွားတိုင်း Township များကို Reset ချမည်
  useEffect(() => {
    setSelectedTownships([]);
  }, [selectedCity]);

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

  const { data: assignedTownships = [] } = useGetAssignedTownshipsQuery(
    selectedCity,
    {
      skip: !selectedCity,
    }
  );

  // Search လုပ်ထားသော မြို့နယ်စာရင်း (availableTownships မှ တိုက်ရိုက်ယူသည်)
  const filteredTownships = availableTownships.filter(
    (t: string) =>
      !selectedTownships.includes(t) &&
      !assignedTownships.includes(t) &&
      t.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    setFormError(null);

    // ⭐️ မြို့နယ် မရွေးရသေးလျှင် Form ထဲတွင် Error ပြရန် ⭐️
    if (
      !zoneName ||
      !selectedRegionOrState ||
      !selectedCity ||
      !shippingFee ||
      !selectedTownships ||
      selectedTownships.length === 0
    ) {
      setFormError(
        'Please fill in all required fields and select at least one township.'
      );
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
      onClose();
      setZoneName('');
      setSelectedRegionOrState('');
      setSelectedCity('');
      setSelectedTownships([]);
      setShippingFee(0);
      setEstimatedDays(1);
    } catch (err: any) {
      const backendMessage =
        err?.data?.message ||
        err?.data?.error ||
        err?.message ||
        'There was an error while creating the zone. Please try again.';

      toast.error(backendMessage);
      setFormError(backendMessage);
    }
  };

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Add New Delivery Zone</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Zone Name (example - Yangon Downtown)</label>
            <input
              value={zoneName}
              type="text"
              onChange={(e) => {
                setZoneName(e.target.value);
                if (formError) setFormError(null);
              }}
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
            {/* ၁။ Region Dropdown */}
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
                      {loc.regionOrState}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* ၂။ City Dropdown */}
            <div className={styles.formGroup}>
              <label>City / District</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedRegionOrState}
                required
              >
                <option value="">-- Select City --</option>
                {cities.map((city: string) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ၃။ Township Dropdown (City ရွေးပြီးမှ ပေါ်မည်) */}
          {selectedCity && (
            <div className={styles.formGroup}>
              <label>
                Select Townships ({selectedTownships.length} selected)
              </label>

              <div
                className={styles.dropdownContainerWrapper}
                ref={dropdownRef}
              >
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

                {isDropdownOpen && (
                  <ul className={styles.dropdownList}>
                    {filteredTownships.length === 0 ? (
                      <li className={styles.dropdownItemEmpty}>
                        No townships found
                      </li>
                    ) : (
                      filteredTownships.map((township: string) => (
                        <li
                          key={township}
                          onClick={() => {
                            setSelectedTownships([
                              ...selectedTownships,
                              township,
                            ]);
                            setSearchTerm('');
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

              <div className={styles.selectedTagsContainer}>
                {selectedTownships.length === 0 ? (
                  <span className={styles.noTownshipText}>
                    No townships selected yet
                  </span>
                ) : (
                  selectedTownships.map((township: string) => (
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
              <label>Shipping Fee For Selected Townships.</label>
              <input
                type="number"
                value={shippingFee}
                onChange={(e) =>
                  setShippingFee(
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                min={0}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Estimated Days</label>
              <input
                type="number"
                value={estimatedDays}
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

          {formError && <div className={styles.formError}>⚠️ {formError}</div>}

          <hr className={styles.divider} />

          {isDefaultAlreadyExists && selectedCity && (
            <div className={styles.infoBanner}>
              <span className={styles.infoIcon}>💡</span>A default shipping rate
              is already configured for {selectedCity}.
            </div>
          )}

          {!isDefaultAlreadyExists && selectedCity && (
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

          {!isDefaultAlreadyExists && enableDefaultRate && selectedCity && (
            <div className={`${styles.formRow} ${styles.defaultRateWrapper}`}>
              <div className={styles.formGroup}>
                <label>Default Shipping Fee.</label>
                <input
                  type="number"
                  value={defaultShippingFee}
                  onChange={(e) =>
                    setDefaultShippingFee(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
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
                    setDefaultEstimatedDays(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
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
    </div>,
    document.body
  );
};
