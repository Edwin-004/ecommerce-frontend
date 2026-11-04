import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import styles from './DatePicker.module.css';

export interface DatePickerProps {
  value?: string; // YYYY-MM-DD from parent state/API
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  name?: string;
  id?: string;
  className?: string;
  inputClassName?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  placeholder?: string; // defaults to "dd/mm/yyyy"
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  disabled?: boolean;
  required?: boolean;
  title?: string;
  onBlur?: () => void;
  isInvalid?: boolean;
  align?: 'left' | 'right';
}

// Convert YYYY-MM-DD to DD/MM/YYYY for user-facing UI
function isoToDDMMYYYY(iso?: string): string {
  if (!iso) return '';
  const match = String(iso).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return iso;
  const yyyy = match[1];
  const mm = String(match[2]).padStart(2, '0');
  const dd = String(match[3]).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}`;
}

// Convert DD/MM/YYYY to YYYY-MM-DD for standard parent state / APIs
function ddmmYYYYToISO(text: string): string | null {
  if (!text) return null;
  const clean = text.trim();
  const match = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }

  const yyyy = String(year);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value = '',
  onChange,
  name,
  id,
  className = '',
  inputClassName = '',
  style,
  inputStyle,
  placeholder = 'dd/mm/yyyy',
  min,
  max,
  disabled = false,
  required = false,
  title,
  onBlur,
  isInvalid,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState(isoToDDMMYYYY(value));
  const [effectiveAlign, setEffectiveAlign] = useState<'left' | 'right'>(align);

  useEffect(() => {
    if (align === 'right') {
      setEffectiveAlign('right');
      return;
    }
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverWidth = 280;
      if (rect.left + popoverWidth > window.innerWidth - 16) {
        setEffectiveAlign('right');
      } else {
        setEffectiveAlign(align);
      }
    }
  }, [isOpen, align]);

  // Validate if complete typed string is an invalid date
  const isTypingInvalid = useMemo(() => {
    const t = inputText.trim();
    return t.length >= 10 && !ddmmYYYYToISO(t);
  }, [inputText]);

  // Determine active viewing month/year for the calendar popup
  const initialDate = useMemo(() => {
    if (value) {
      const match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (match) {
        return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
      }
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal display when parent value changes
  useEffect(() => {
    setInputText(isoToDDMMYYYY(value));
    if (value) {
      const match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (match) {
        setViewYear(parseInt(match[1], 10));
        setViewMonth(parseInt(match[2], 10) - 1);
      }
    }
  }, [value]);

  // Close calendar popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle direct text input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);

    if (!text.trim()) {
      if (onChange) {
        onChange({ target: { value: '', name } });
      }
      return;
    }

    const iso = ddmmYYYYToISO(text);
    if (iso) {
      if (onChange) {
        onChange({ target: { value: iso, name } });
      }
    }
  };

  const handleInputBlur = () => {
    if (inputText.trim() && !ddmmYYYYToISO(inputText)) {
      setInputText(isoToDDMMYYYY(value));
    }
    if (onBlur) onBlur();
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Select a specific day from the calendar
  const handleSelectDay = (day: number) => {
    const yyyy = String(viewYear);
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`;

    setInputText(`${dd}/${mm}/${yyyy}`);
    if (onChange) {
      onChange({ target: { value: iso, name } });
    }
    setIsOpen(false);
  };

  const handleTodayClick = () => {
    const today = new Date();
    const yyyy = String(today.getFullYear());
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`;

    if (min && iso < min) return;
    if (max && iso > max) return;

    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setInputText(`${dd}/${mm}/${yyyy}`);
    if (onChange) {
      onChange({ target: { value: iso, name } });
    }
    setIsOpen(false);
  };

  const handleClearClick = () => {
    setInputText('');
    if (onChange) {
      onChange({ target: { value: '', name } });
    }
    setIsOpen(false);
  };

  // Build calendar days matrix
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  // Year options for dropdown (from 1970 to 2050)
  const years = useMemo(() => {
    const list = [];
    const current = new Date().getFullYear();
    for (let y = current - 50; y <= current + 20; y++) {
      list.push(y);
    }
    return list;
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${styles.datePickerContainer} ${isOpen ? styles.isOpen : ''} ${className}`}
      style={style}
    >
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={inputText}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onClick={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          title={title}
          className={`${styles.input} ${isInvalid || isTypingInvalid || className.includes("inputError") ? styles.inputInvalid : ""} ${inputClassName}`}
          style={inputStyle}
          autoComplete="off"
        />
        <span
          className={styles.calendarIcon}
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }
          }}
          title="Choose date (Day/Month/Year)"
        >
          <FiCalendar size={14} />
        </span>
      </div>

      {isOpen && !disabled && (
        <div className={`${styles.popover} ${effectiveAlign === 'right' ? styles.popoverRight : ''}`}>
          {/* Header Controls */}
          <div className={styles.popoverHeader}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={handlePrevMonth}
              title="Previous month"
            >
              <FiChevronLeft size={16} />
            </button>

            <div className={styles.selectorsGroup}>
              <select
                className={styles.selectMonth}
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                className={styles.selectYear}
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className={styles.navBtn}
              onClick={handleNextMonth}
              title="Next month"
            >
              <FiChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Names (Su, Mo, Tu, We, Th, Fr, Sa) */}
          <div className={styles.weekdaysGrid}>
            {WEEKDAY_NAMES.map((w) => (
              <span key={w} className={styles.weekday}>
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className={styles.daysGrid}>
            {/* Previous month filler days */}
            {Array.from({ length: firstDayWeekday }).map((_, idx) => {
              const day = daysInPrevMonth - firstDayWeekday + idx + 1;
              return (
                <button
                  key={`prev-${day}`}
                  type="button"
                  className={`${styles.dayCell} ${styles.otherMonth}`}
                  disabled
                >
                  {day}
                </button>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
              const day = idx + 1;
              const yyyy = String(viewYear);
              const mm = String(viewMonth + 1).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              const dateIso = `${yyyy}-${mm}-${dd}`;

              const isSelected = value === dateIso;
              const isToday =
                todayY === viewYear && todayM === viewMonth && todayD === day;

              let isDisabled = false;
              if (min && dateIso < min) isDisabled = true;
              if (max && dateIso > max) isDisabled = true;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(day)}
                  className={`${styles.dayCell} ${isSelected ? styles.selectedDay : ''} ${
                    isToday ? styles.today : ''
                  } ${isDisabled ? styles.disabledDay : ''}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Controls */}
          <div className={styles.popoverFooter}>
            <button
              type="button"
              className={styles.footerBtn}
              onClick={handleTodayClick}
            >
              Today
            </button>
            <button
              type="button"
              className={`${styles.footerBtn} ${styles.clearBtn}`}
              onClick={handleClearClick}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
