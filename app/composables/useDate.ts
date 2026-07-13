import type { CalendarEventPayload } from "~/types/calendar";
import { replaceDigitsByLocale } from "~/utils/format";
import { useLocale } from "./useLocale";
import { useI18n } from "vue-i18n";

export interface DateFormatOptions {
  showWeekday?: boolean;
  useRelativeDay?: boolean;
  showTime?: boolean;
  monthFormat?: "short" | "long";
}

export const useDate = () => {
  const { locale } = useI18n();

  const dict = {
    en: {
      today: "Today",
      yesterday: "Yesterday",
      ago: "ago",
      min: "min",
      hr: "h",
      day: "d",
    },
    fa: {
      today: "امروز",
      yesterday: "دیروز",
      ago: "پیش",
      min: "دقیقه",
      hr: "ساعت",
      day: "روز",
    },
    ar: {
      today: "اليوم",
      yesterday: "أمس",
      ago: "مضت",
      min: "دقيقة",
      hr: "ساعة",
      day: "يوم",
    },
  };

  // --- Internal Math Helpers ---

  /**
   * Gregorian (Miladi) to Jalali (Shamsi)
   */
  const g2j = (
    gy: number,
    gm: number,
    gd: number,
  ): [number, number, number] => {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

    let jy = gy <= 1600 ? 0 : 979;
    gy -= gy <= 1600 ? 621 : 1600;

    let gy2 = gm > 2 ? gy + 1 : gy;
    let days =
      365 * gy +
      Math.floor((gy2 + 3) / 4) -
      Math.floor((gy2 + 99) / 100) +
      Math.floor((gy2 + 399) / 400) -
      80 +
      gd +
      g_d_m[gm - 1];

    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    jy += Math.floor((days - 1) / 365);
    if (days > 365) days = (days - 1) % 365;

    let jm =
      days < 186
        ? 1 + Math.floor(days / 31)
        : 7 + Math.floor((days - 186) / 30);
    let jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);

    return [jy, jm, jd];
  };

  /**
   * Jalali (Shamsi) to Gregorian (Miladi)
   */
  const j2g = (
    jy: number,
    jm: number,
    jd: number,
  ): [number, number, number] => {
    let gy = jy <= 979 ? 621 : 1600;
    jy -= jy <= 979 ? 0 : 979;

    let days =
      365 * jy +
      Math.floor(jy / 33) * 8 +
      Math.floor(((jy % 33) + 3) / 4) +
      78 +
      jd +
      (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

    gy += 400 * Math.floor(days / 146097);
    days %= 146097;

    if (days > 36524) {
      gy += 100 * Math.floor(--days / 36524);
      days %= 36524;
      if (days >= 365) days++;
    }

    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    gy += Math.floor((days - 1) / 365);
    if (days > 365) days = (days - 1) % 365;

    let gd = days + 1;
    let sal_a = [
      0,
      31,
      (gy % 4 == 0 && gy % 100 != 0) || gy % 400 == 0 ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];
    let gm;
    for (gm = 0; gm < 13; gm++) {
      let v = sal_a[gm];
      if (gd <= v) break;
      gd -= v;
    }
    return [gy, gm, gd];
  };

  // --- Formatting Helpers ---

  const getLang = (): "en" | "fa" | "ar" => {
    const current = locale.value as string;
    if (current.includes("fa")) return "fa";
    if (current.includes("ar")) return "ar";
    return "en";
  };

  const localizeDigits = (
    str: string | number,
    lang: "en" | "fa" | "ar",
  ): string => {
    if (lang === "fa")
      return String(str).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
    if (lang === "ar")
      return String(str).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
    return String(str);
  };

  const parseDate = (dateInput: string | Date): Date => {
    return typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  };

  const getJalaaliMonthName = (monthIndex: number): string => {
    const months = [
      "فروردین",
      "اردیبهشت",
      "خرداد",
      "تیر",
      "مرداد",
      "شهریور",
      "مهر",
      "آبان",
      "آذر",
      "دی",
      "بهمن",
      "اسفند",
    ];
    return months[monthIndex - 1] || "";
  };

  const getJalaaliDayOfWeekName = (date: Date): string => {
    const days = [
      "یکشنبه",
      "دوشنبه",
      "سه‌شنبه",
      "چهارشنبه",
      "پنج‌شنبه",
      "جمعه",
      "شنبه",
    ];
    return days[date.getDay()];
  };

  const formatTime = (dateInput: string | Date): string => {
    const date = parseDate(dateInput);
    const lang = getLang();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return localizeDigits(`${hours}:${minutes}`, lang);
  };

  // --- Main Exported Methods ---

  const formatDate = (
    dateInput: string | Date,
    options: DateFormatOptions = {},
  ): string => {
    const opts = {
      showWeekday: true,
      useRelativeDay: true,
      showTime: false,
      monthFormat: "long",
      ...options,
    };
    const date = parseDate(dateInput);
    const lang = getLang();
    const separator = lang === "fa" || lang === "ar" ? "، " : ", ";

    let prefix = "";
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (opts.useRelativeDay && isToday) prefix = dict[lang].today;
    else if (opts.useRelativeDay && isYesterday) prefix = dict[lang].yesterday;
    else if (opts.showWeekday) {
      prefix =
        lang === "fa"
          ? getJalaaliDayOfWeekName(date)
          : new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
              weekday: "long",
            }).format(date);
    }

    let body = "";
    if (lang === "fa") {
      const [jy, jm, jd] = g2j(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      );
      body = `${localizeDigits(jd, lang)} ${getJalaaliMonthName(jm)} ${localizeDigits(jy, lang)}`;
    } else {
      body = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
        day: "numeric",
        month: opts.monthFormat as any,
        year: "numeric",
      }).format(date);
    }

    let result = prefix ? `${prefix}${separator}${body}` : body;
    if (opts.showTime) result += ` - ${formatTime(date)}`;
    return result;
  };

  const formatNumericDate = (dateInput: string | Date): string => {
    const date = parseDate(dateInput);
    const lang = getLang();
    let y, m, d;
    if (lang === "fa") {
      const [jy, jm, jd] = g2j(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      );
      [y, m, d] = [
        jy,
        String(jm).padStart(2, "0"),
        String(jd).padStart(2, "0"),
      ];
    } else {
      [y, m, d] = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ];
    }
    return localizeDigits(`${y}/${m}/${d}`, lang);
  };

  const formatDateTime = (dateInput: string | Date): string => {
    // 1. Get direction from your locale composable
    const { dir } = useLocale();

    const date = parseDate(dateInput);
    const lang = getLang();
    let body = "";

    if (lang === "fa") {
      const [jy, jm, jd] = g2j(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      );
      body = `${jd} ${getJalaaliMonthName(jm)} ${jy}`;
    } else {
      body = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    }

    const timeStr = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

    // 2. Condition the return string based on direction
    const combinedStr =
      dir.value === "rtl"
        ? `${timeStr}  ${body}` // Time + Date for RTL
        : `${body}  ${timeStr}`; // Date + Time for LTR

    return localizeDigits(combinedStr, lang);
  };

  /**
   * Returns a numeric date string: YYYY/MM/DD
   * Example: ۱۴۰۵/۱/۱۲ or 2026/04/20
   */
  const getAbsoluteDate = (dateInput: string | Date): string => {
    const date = parseDate(dateInput);
    const lang = getLang();
    let result = "";

    if (lang === "fa") {
      const [jy, jm, jd] = g2j(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      );
      result = `${jy}/${jm}/${jd}`;
    } else {
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, "0");
      const d = date.getDate().toString().padStart(2, "0");
      result = `${y}/${m}/${d}`;
    }

    return localizeDigits(result, lang);
  };

  /**
   * Returns numeric date and time: YYYY/MM/DD HH:mm
   * Example: ۱۴۰۵/۱/۱۲ ۰۹:۳۴
   */
  const getAbsoluteDateTime = (dateInput: string | Date): string => {
    const { dir } = useLocale();
    const lang = getLang();

    // 1. Get the formatted numeric date part
    const datePart = getAbsoluteDate(dateInput);

    // 2. Format the time part
    const date = parseDate(dateInput);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const timePart = `${hours}:${minutes}`;

    // 3. Place segments based on text direction
    const combined =
      dir.value === "rtl"
        ? `${timePart}  ${datePart}` // Time first for RTL flow
        : `${datePart}  ${timePart}`; // Date first for LTR flow

    return localizeDigits(combined, lang);
  };

  const formatRelativeDate = (dateInput: string | Date): string => {
    const date = parseDate(dateInput);
    const now = new Date();
    const lang = getLang();

    // Difference in seconds
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // 1. Relative Minutes (less than 1 hour)
    if (diffInSeconds < 3600 && diffInSeconds >= 0) {
      const mins = Math.max(Math.floor(diffInSeconds / 60), 1);
      return localizeDigits(
        `${mins} ${dict[lang].min} ${dict[lang].ago}`,
        lang,
      );
    }

    // 2. Relative Hours (less than 24 hours AND same calendar day)
    if (diffInSeconds < 86400 && date.toDateString() === now.toDateString()) {
      const hrs = Math.floor(diffInSeconds / 3600);
      return localizeDigits(`${hrs} ${dict[lang].hr} ${dict[lang].ago}`, lang);
    }

    // 3. Yesterday
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return dict[lang].yesterday;
    }

    // 4. Absolute Date (Current Year vs Previous Year)
    let isCurrentYear = false;
    let y, m, d;

    if (lang === "fa") {
      const [nowJy] = g2j(now.getFullYear(), now.getMonth() + 1, now.getDate());
      const [jy, jm, jd] = g2j(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      );

      isCurrentYear = jy === nowJy;
      [y, m, d] = [
        jy,
        String(jm).padStart(2, "0"),
        String(jd).padStart(2, "0"),
      ];
    } else {
      isCurrentYear = date.getFullYear() === now.getFullYear();
      [y, m, d] = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ];
    }

    const result = isCurrentYear ? `${m}/${d}` : `${y}/${m}/${d}`;
    return localizeDigits(result, lang);
  };

  /**
   * Calculates the number of full years passed since the given date (e.g., age).
   * @param date - The starting date to calculate from.
   * @returns The number of full years passed.
   */
  const getYearsPassed = (date: Date): number => {
    const today = new Date();
    let years = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    // Adjust if the anniversary hasn't occurred yet in the current year
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < date.getDate())
    ) {
      years--;
    }

    return years;
  };

  const formatDateShort = (dateInput: string | Date): string => {
    const date = parseDate(dateInput);
    const now = new Date();
    const lang = getLang();

    if (lang === "fa") {
      const [nowJy] = g2j(now.getFullYear(), now.getMonth() + 1, now.getDate());
      const [jy, jm, jd] = g2j(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      );

      // Format: "Day Month"
      let result = `${jd} ${getJalaaliMonthName(jm)}`;

      // Append " Year" if it's not the current Jalaali year
      if (jy !== nowJy) {
        result += ` ${jy}`;
      }

      return localizeDigits(result, lang);
    } else {
      const isSameYear = date.getFullYear() === now.getFullYear();

      // Use Intl for standard locales
      return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
        day: "numeric",
        month: "long",
        year: isSameYear ? undefined : "numeric",
      }).format(date);
    }
  };

  const formatEventFullDateTime = (event: CalendarEventPayload) => {
    const date = new Date(event.date);
    const lang = getLang();
    const intlLocale = lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-EG" : "en-US";

    // 1. Format the Date part (e.g., ۲۶ اردیبهشت ۱۴۰۵)
    const datePart = new Intl.DateTimeFormat(intlLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);

    // 2. Prepare Start Time
    const startTime = event.time;
    let timePart = startTime;

    // 3. Calculate and Add End Time if duration or endDate exists
    if (event.duration || event.endDate) {
      let endH: string = "";
      let endM: string = "";

      if (event.duration) {
        const [h, m] = startTime.split(":").map(Number);
        const endDateObj = new Date();
        endDateObj.setHours(h, m, 0);
        endDateObj.setMinutes(endDateObj.getMinutes() + event.duration);
        endH = String(endDateObj.getHours()).padStart(2, "0");
        endM = String(endDateObj.getMinutes()).padStart(2, "0");
      } else if (event.endDate) {
        const endObj = new Date(event.endDate);
        endH = String(endObj.getHours()).padStart(2, "0");
        endM = String(endObj.getMinutes()).padStart(2, "0");
      }

      const separator = lang === "fa" ? " تا " : " to ";
      timePart += `${separator}${endH}:${endM}`;
    }

    // 4. Combine with localized labels
    const hourLabel = lang === "fa" ? " ساعت " : " at ";
    const finalString = `${datePart}${hourLabel}${timePart}`;

    // Use your existing utility to ensure Persian digits if needed
    return replaceDigitsByLocale(finalString, locale.value);
  };

  return {
    getYearsPassed,
    parseDate,
    formatDate,
    formatNumericDate,
    getAbsoluteDateTime,
    getAbsoluteDate,
    formatDateShort,
    formatDateTime,
    formatTime,
    g2j,
    j2g,
    getRelativeTime: (d: string | Date) => formatDate(d, { useRelativeDay: true }),
    formatRelativeDate,
    formatEventFullDateTime,
  };
};
