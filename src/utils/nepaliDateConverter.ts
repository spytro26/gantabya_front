/**
 * Nepali Date Converter Utility
 * Converts between English (AD - Anno Domini) and Nepali (BS - Bikram Sambat) calendars
 *
 * BS calendar is ~56 years and 8 months ahead of AD
 * Valid conversion range: 1944 AD to 2033 AD (2000 BS to 2090 BS)
 */

// Nepali months data - days in each month for each year
// Format: [year][month] = days in that month
const BS_CALENDAR_DATA: Record<number, number[]> = {
  2000: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2001: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2002: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2003: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2004: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2005: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2006: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2007: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2008: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2009: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2010: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2011: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2012: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2013: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2014: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2015: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2016: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2017: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2018: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2019: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2020: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2021: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2022: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2023: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2024: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2025: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2026: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2027: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2028: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2029: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2030: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2031: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2032: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2033: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2034: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2035: [30, 32, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2036: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2037: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2038: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2039: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2040: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2041: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2042: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2043: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2044: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2045: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2046: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2047: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2048: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2049: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2050: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2051: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2052: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2053: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2054: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2055: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2056: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2057: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2058: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2059: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2060: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2061: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2062: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2063: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2064: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2065: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2066: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2067: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2068: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2069: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2070: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2072: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2074: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2082: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2083: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2084: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2086: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2087: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
  2088: [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2089: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2090: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
};

// Nepali month names
export const NEPALI_MONTHS = [
  "बैशाख", // Baishakh
  "जेठ", // Jestha
  "असार", // Ashar
  "श्रावण", // Shrawan
  "भदौ", // Bhadra
  "आश्विन", // Ashwin
  "कार्तिक", // Kartik
  "मंसिर", // Mangsir
  "पौष", // Poush
  "माघ", // Magh
  "फाल्गुन", // Falgun
  "चैत्र", // Chaitra
];

export const NEPALI_MONTHS_ENGLISH = [
  "Baishakh",
  "Jestha",
  "Ashar",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

// Nepali day names
export const NEPALI_DAYS = [
  "आइतबार", // Sunday
  "सोमबार", // Monday
  "मंगलबार", // Tuesday
  "बुधबार", // Wednesday
  "बिहीबार", // Thursday
  "शुक्रबार", // Friday
  "शनिबार", // Saturday
];

// Convert English digits to Nepali digits
export function toNepaliDigits(num: number | string): string {
  const nepaliDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(num).replace(
    /[0-9]/g,
    (digit) => nepaliDigits[parseInt(digit)]
  );
}

// Convert Nepali digits to English digits
export function toEnglishDigits(str: string): string {
  const nepaliDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return str.replace(/[०-९]/g, (digit) => String(nepaliDigits.indexOf(digit)));
}

// Reference date: 1944-01-01 AD = 2000-09-18 BS
const BS_REFERENCE = { year: 2000, month: 9, day: 18 };
const AD_REFERENCE = new Date(1944, 0, 1); // January 1, 1944

// Calculate total days in a BS year
function getTotalDaysInBSYear(year: number): number {
  const months = BS_CALENDAR_DATA[year];
  if (!months) return 0;
  return months.reduce((sum, days) => sum + days, 0);
}

// Get days in a specific BS month
export function getDaysInBSMonth(year: number, month: number): number {
  const months = BS_CALENDAR_DATA[year];
  if (!months || month < 1 || month > 12) return 30;
  return months[month - 1];
}

// BS Date interface
export interface BSDate {
  year: number;
  month: number;
  day: number;
}

/**
 * Convert AD (English) date to BS (Nepali) date
 */
export function adToBS(adDate: Date): BSDate {
  // Calculate difference in days from reference
  const diffTime = adDate.getTime() - AD_REFERENCE.getTime();
  let totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Start from reference BS date
  let bsYear = BS_REFERENCE.year;
  let bsMonth = BS_REFERENCE.month;
  let bsDay = BS_REFERENCE.day;

  // Add the days
  while (totalDays > 0) {
    const daysInCurrentMonth = getDaysInBSMonth(bsYear, bsMonth);
    const remainingDaysInMonth = daysInCurrentMonth - bsDay;

    if (totalDays <= remainingDaysInMonth) {
      bsDay += totalDays;
      totalDays = 0;
    } else {
      totalDays -= remainingDaysInMonth + 1;
      bsMonth++;
      bsDay = 1;

      if (bsMonth > 12) {
        bsMonth = 1;
        bsYear++;
      }
    }
  }

  // Handle negative days (dates before reference)
  while (totalDays < 0) {
    bsDay--;
    if (bsDay < 1) {
      bsMonth--;
      if (bsMonth < 1) {
        bsMonth = 12;
        bsYear--;
      }
      bsDay = getDaysInBSMonth(bsYear, bsMonth);
    }
    totalDays++;
  }

  return { year: bsYear, month: bsMonth, day: bsDay };
}

/**
 * Convert BS (Nepali) date to AD (English) date
 */
export function bsToAD(bsDate: BSDate): Date {
  // Calculate days from BS reference to given BS date
  let totalDays = 0;

  // Add years
  for (let y = BS_REFERENCE.year; y < bsDate.year; y++) {
    totalDays += getTotalDaysInBSYear(y);
  }

  // Add months of current year
  for (let m = 1; m < bsDate.month; m++) {
    totalDays += getDaysInBSMonth(bsDate.year, m);
  }

  // Add days
  totalDays += bsDate.day;

  // Subtract reference offset
  let refDays = 0;
  for (let m = 1; m < BS_REFERENCE.month; m++) {
    refDays += getDaysInBSMonth(BS_REFERENCE.year, m);
  }
  refDays += BS_REFERENCE.day;
  totalDays -= refDays;

  // Add to AD reference
  const result = new Date(AD_REFERENCE);
  result.setDate(result.getDate() + totalDays);
  return result;
}

/**
 * Format BS date in Nepali
 */
export function formatBSDateNepali(bsDate: BSDate): string {
  return `${toNepaliDigits(bsDate.day)} ${
    NEPALI_MONTHS[bsDate.month - 1]
  }, ${toNepaliDigits(bsDate.year)}`;
}

/**
 * Format BS date in English
 */
export function formatBSDateEnglish(bsDate: BSDate): string {
  return `${bsDate.day} ${NEPALI_MONTHS_ENGLISH[bsDate.month - 1]}, ${
    bsDate.year
  }`;
}

/**
 * Format AD date for display
 */
export function formatADDate(adDate: Date): string {
  return adDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Get both AD and BS formatted dates from an AD date string or Date object
 */
export function getDualDateDisplay(dateInput: string | Date): {
  ad: string;
  bs: string;
  bsNepali: string;
} {
  const adDate =
    typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const bsDate = adToBS(adDate);

  return {
    ad: formatADDate(adDate),
    bs: formatBSDateEnglish(bsDate),
    bsNepali: formatBSDateNepali(bsDate),
  };
}

/**
 * Get dual date as a single formatted string: "Dec 15, 2024 (Poush 1, 2081)"
 */
export function getDualDate(dateInput: string | Date): string {
  if (!dateInput) return "";
  try {
    const adDate =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(adDate.getTime())) return "";
    const bsDate = adToBS(adDate);
    return `${formatADDate(adDate)} (${formatBSDateEnglish(bsDate)})`;
  } catch {
    return "";
  }
}

/**
 * Format dual date for shorter display: "Dec 15 (Poush 1)"
 */
export function formatDualDate(dateInput: string | Date): string {
  if (!dateInput) return "";
  try {
    const adDate =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(adDate.getTime())) return "";
    const bsDate = adToBS(adDate);
    const adShort = adDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${adShort} (${NEPALI_MONTHS_ENGLISH[bsDate.month - 1]} ${
      bsDate.day
    })`;
  } catch {
    return "";
  }
}

/**
 * Convert YYYY-MM-DD string to BS date
 */
export function isoToBS(isoDate: string): BSDate {
  const [year, month, day] = isoDate.split("-").map(Number);
  const adDate = new Date(year, month - 1, day);
  return adToBS(adDate);
}

/**
 * Convert BS date to YYYY-MM-DD string (AD)
 */
export function bsToISO(bsDate: BSDate): string {
  const adDate = bsToAD(bsDate);
  return adDate.toISOString().split("T")[0];
}

/**
 * Get current BS date
 */
export function getCurrentBSDate(): BSDate {
  return adToBS(new Date());
}

/**
 * Get BS year range for date picker
 */
export function getBSYearRange(): number[] {
  const years: number[] = [];
  for (let y = 2070; y <= 2090; y++) {
    years.push(y);
  }
  return years;
}

/**
 * Validate BS date
 */
export function isValidBSDate(
  year: number,
  month: number,
  day: number
): boolean {
  if (!BS_CALENDAR_DATA[year]) return false;
  if (month < 1 || month > 12) return false;
  const daysInMonth = getDaysInBSMonth(year, month);
  return day >= 1 && day <= daysInMonth;
}
