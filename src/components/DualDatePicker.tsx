import React, { useState, useEffect, useRef } from 'react';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaExchangeAlt } from 'react-icons/fa';
import {
  adToBS,
  bsToAD,
  getDaysInBSMonth,
  NEPALI_MONTHS,
  NEPALI_MONTHS_ENGLISH,
  NEPALI_DAYS,
  toNepaliDigits,
  getCurrentBSDate,
  formatBSDateEnglish,
  formatADDate,
} from '../utils/nepaliDateConverter';
import type { BSDate } from '../utils/nepaliDateConverter';

interface DualDatePickerProps {
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (isoDate: string) => void;
  label?: string;
  minDate?: string;
  maxDate?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

type CalendarMode = 'AD' | 'BS';

const DualDatePicker: React.FC<DualDatePickerProps> = ({
  value,
  onChange,
  label,
  minDate,
  maxDate,
  className = '',
  disabled = false,
  placeholder = 'Select date',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<CalendarMode>('AD');
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [viewBSDate, setViewBSDate] = useState<BSDate>(getCurrentBSDate());
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync viewDate when value changes
  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      setViewDate(date);
      setViewBSDate(adToBS(date));
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMode = () => {
    setMode((prev) => (prev === 'AD' ? 'BS' : 'AD'));
  };

  // Get display value
  const getDisplayValue = (): string => {
    if (!value) return '';
    const [year, month, day] = value.split('-').map(Number);
    const adDate = new Date(year, month - 1, day);
    const bsDate = adToBS(adDate);

    if (mode === 'AD') {
      return adDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } else {
      return `${bsDate.day} ${NEPALI_MONTHS_ENGLISH[bsDate.month - 1]} ${bsDate.year}`;
    }
  };

  // AD Calendar Navigation
  const goToPrevMonth = () => {
    if (mode === 'AD') {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    } else {
      let newMonth = viewBSDate.month - 1;
      let newYear = viewBSDate.year;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
      setViewBSDate({ year: newYear, month: newMonth, day: 1 });
    }
  };

  const goToNextMonth = () => {
    if (mode === 'AD') {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    } else {
      let newMonth = viewBSDate.month + 1;
      let newYear = viewBSDate.year;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
      setViewBSDate({ year: newYear, month: newMonth, day: 1 });
    }
  };

  // Select AD date
  const selectADDate = (day: number) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1; // Convert to 1-indexed
    // Format as YYYY-MM-DD without timezone conversion
    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(isoDate);
    setIsOpen(false);
  };

  // Select BS date
  const selectBSDate = (day: number) => {
    const bsDate: BSDate = { year: viewBSDate.year, month: viewBSDate.month, day };
    const adDate = bsToAD(bsDate);
    // Format as YYYY-MM-DD without timezone conversion
    const year = adDate.getFullYear();
    const month = adDate.getMonth() + 1; // Convert to 1-indexed
    const dayOfMonth = adDate.getDate();
    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
    onChange(isoDate);
    setIsOpen(false);
  };

  // Generate AD calendar days
  const generateADCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }

    return days;
  };

  // Generate BS calendar days
  const generateBSCalendarDays = () => {
    const bsDate = viewBSDate;
    const adDateOfFirst = bsToAD({ year: bsDate.year, month: bsDate.month, day: 1 });
    const firstDay = adDateOfFirst.getDay();
    const daysInMonth = getDaysInBSMonth(bsDate.year, bsDate.month);

    const days: (number | null)[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }

    return days;
  };

  // Check if a day is selected
  const isSelectedAD = (day: number): boolean => {
    if (!value) return false;
    const [y, m, d] = value.split('-').map(Number);
    return (
      viewDate.getFullYear() === y &&
      viewDate.getMonth() === m - 1 &&
      day === d
    );
  };

  const isSelectedBS = (day: number): boolean => {
    if (!value) return false;
    const [y, m, d] = value.split('-').map(Number);
    const selectedBS = adToBS(new Date(y, m - 1, d));
    return (
      viewBSDate.year === selectedBS.year &&
      viewBSDate.month === selectedBS.month &&
      day === selectedBS.day
    );
  };

  // Check if date is today
  const isTodayAD = (day: number): boolean => {
    const today = new Date();
    return (
      viewDate.getFullYear() === today.getFullYear() &&
      viewDate.getMonth() === today.getMonth() &&
      day === today.getDate()
    );
  };

  const isTodayBS = (day: number): boolean => {
    const todayBS = getCurrentBSDate();
    return (
      viewBSDate.year === todayBS.year &&
      viewBSDate.month === todayBS.month &&
      day === todayBS.day
    );
  };

  // Year/Month selectors for AD
  const renderADSelectors = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const years = [];
    for (let y = 2020; y <= 2035; y++) years.push(y);

    return (
      <div className="flex items-center justify-between mb-3">
        <select
          value={viewDate.getMonth()}
          onChange={(e) => setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value), 1))}
          className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
        >
          {months.map((m, i) => (
            <option key={m} value={i}>{m}</option>
          ))}
        </select>
        <select
          value={viewDate.getFullYear()}
          onChange={(e) => setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth(), 1))}
          className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    );
  };

  // Year/Month selectors for BS
  const renderBSSelectors = () => {
    const years = [];
    for (let y = 2070; y <= 2090; y++) years.push(y);

    return (
      <div className="flex items-center justify-between mb-3">
        <select
          value={viewBSDate.month}
          onChange={(e) => setViewBSDate({ ...viewBSDate, month: parseInt(e.target.value) })}
          className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
        >
          {NEPALI_MONTHS_ENGLISH.map((m, i) => (
            <option key={m} value={i + 1}>{m} ({NEPALI_MONTHS[i]})</option>
          ))}
        </select>
        <select
          value={viewBSDate.year}
          onChange={(e) => setViewBSDate({ ...viewBSDate, year: parseInt(e.target.value) })}
          className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y} ({toNepaliDigits(y)})</option>
          ))}
        </select>
      </div>
    );
  };

  const adDays = generateADCalendarDays();
  const bsDays = generateBSCalendarDays();

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}

      {/* Input Field */}
      <div
        className={`flex items-center border rounded-lg px-3 py-2 cursor-pointer transition ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed'
            : 'bg-white hover:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-500 dark:bg-gray-700 dark:border-gray-600'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <FaCalendarAlt className="text-gray-400 mr-2" />
        <span className={`flex-1 ${!value ? 'text-gray-400' : 'text-gray-800 dark:text-white'}`}>
          {value ? getDisplayValue() : placeholder}
        </span>
        <span className="text-xs text-gray-500 ml-2 bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded">
          {mode}
        </span>
      </div>

      {/* Dual date display when value is set */}
      {value && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {(() => {
            const [y, m, d] = value.split('-').map(Number);
            const adDate = new Date(y, m - 1, d);
            const bsDate = adToBS(adDate);
            return (
              <>
                <span className="mr-2">AD: {formatADDate(adDate)}</span>
                <span>BS: {formatBSDateEnglish(bsDate)}</span>
              </>
            );
          })()}
        </div>
      )}

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl p-4 w-80">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b dark:border-gray-700">
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {mode === 'AD' ? 'English Calendar' : 'नेपाली पात्रो (Bikram Sambat)'}
            </span>
            <button
              type="button"
              onClick={toggleMode}
              className="flex items-center px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200 transition"
            >
              <FaExchangeAlt className="mr-1" />
              {mode === 'AD' ? 'नेपाली' : 'English'}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            >
              <FaChevronLeft className="text-gray-600 dark:text-gray-400" />
            </button>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {mode === 'AD'
                ? viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : `${NEPALI_MONTHS_ENGLISH[viewBSDate.month - 1]} ${viewBSDate.year}`}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            >
              <FaChevronRight className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Year/Month Selectors */}
          {mode === 'AD' ? renderADSelectors() : renderBSSelectors()}

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {(mode === 'AD'
              ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
              : ['आ', 'सो', 'मं', 'बु', 'बि', 'शु', 'श']
            ).map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {mode === 'AD'
              ? adDays.map((day, idx) => (
                  <div key={idx} className="aspect-square">
                    {day !== null && (
                      <button
                        type="button"
                        onClick={() => selectADDate(day)}
                        className={`w-full h-full flex items-center justify-center rounded-full text-sm transition ${
                          isSelectedAD(day)
                            ? 'bg-yellow-500 text-white font-bold'
                            : isTodayAD(day)
                            ? 'bg-yellow-100 text-yellow-800 font-medium'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {day}
                      </button>
                    )}
                  </div>
                ))
              : bsDays.map((day, idx) => (
                  <div key={idx} className="aspect-square">
                    {day !== null && (
                      <button
                        type="button"
                        onClick={() => selectBSDate(day)}
                        className={`w-full h-full flex flex-col items-center justify-center rounded-full text-sm transition ${
                          isSelectedBS(day)
                            ? 'bg-yellow-500 text-white font-bold'
                            : isTodayBS(day)
                            ? 'bg-yellow-100 text-yellow-800 font-medium'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="text-xs">{toNepaliDigits(day)}</span>
                      </button>
                    )}
                  </div>
                ))}
          </div>

          {/* Today Button */}
          <div className="mt-3 pt-3 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                onChange(today.toISOString().split('T')[0]);
                setIsOpen(false);
              }}
              className="w-full py-2 text-sm text-yellow-600 hover:bg-yellow-50 dark:hover:bg-gray-700 rounded-lg transition"
            >
              Today / आज
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DualDatePicker;
