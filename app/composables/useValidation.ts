import { useI18n, useDate } from "~/nuxt-shims";

export const useValidation = () => {
  const { t, locale } = useI18n();
  const { j2g } = useDate();

  // --- Regex Definitions ---
  // Note: These now allow numbers for address/postal but validateName handles the "No Numbers" rule
  const persianRegex = /^[\u0600-\u06FF\s0-9]+$/;
  const latinRegex = /^[a-zA-Z\s0-9.,-]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^09\d{9}$/;
  const urlRegex =
    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  const whatsappRegex =
    /^(https?:\/\/)?(www\.)?(wa\.me|whatsapp\.com|api\.whatsapp\.com)\/.+$/;
  const usernameRegex = /^[a-zA-Z0-9_.-]+$/;

  // --- Helper: Convert Persian Numbers to English ---
  const toEnglishNumbers = (str: string): string => {
    if (!str) return "";
    return str
      .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 1632));
  };

  const checkIsPersian = (text: string) => persianRegex.test(text);
  const checkIsLatin = (text: string) => latinRegex.test(text);
  const checkIsEmail = (text: string) => emailRegex.test(text);

  // --- Validators ---

  const validateName = (text: string, fieldTitle: string): string | null => {
    if (!text || text.trim().length === 0)
      return t("validation.required", { field: fieldTitle });

    // Forcefully reject any digits for name fields
    const hasDigits = /\d|[\u06F0-\u06F9]|[\u0660-\u0669]/.test(text);
    if (hasDigits) return t("validation.only_letters", { field: fieldTitle });

    if (locale.value === "fa") {
      if (!checkIsPersian(text))
        return t("validation.must_be_persian_letters", { field: fieldTitle });
    } else {
      if (!checkIsLatin(text))
        return t("validation.must_be_english_letters", { field: fieldTitle });
    }

    if (text.trim().length < 2)
      return t("validation.min_length", { field: fieldTitle, min: 2 });
    return null;
  };

  const validateBirthDate = (
    y: string | Date,
    m?: string,
    d?: string,
  ): Record<string, string> | null => {
    const errors: Record<string, string> = {};

    if (y instanceof Date) {
      const date = y as Date;

      const now = new Date();
      const minDate = new Date();
      minDate.setFullYear(now.getFullYear() - 100);

      const errors: Record<string, string> = {};

      if (date > now) {
        errors.year = t("validation.future_date");
      } else if (date < minDate) {
        errors.year = t("validation.too_old_date");
      }
      return Object.keys(errors).length > 0 ? errors : null;
    }
    const yearStr = toEnglishNumbers(y);
    const monthStr = toEnglishNumbers(m);
    const dayStr = toEnglishNumbers(d);

    // 1. Check Required Fields
    if (!yearStr)
      errors.year = t("validation.required", {
        field: t("auth.profile.personalDetails.birthDate.year"),
      });
    if (!monthStr)
      errors.month = t("validation.required", {
        field: t("auth.profile.personalDetails.birthDate.month"),
      });
    if (!dayStr)
      errors.day = t("validation.required", {
        field: t("auth.profile.personalDetails.birthDate.day"),
      });

    if (Object.keys(errors).length > 0) return errors;

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    // 2. Range Checks
    if (month < 1 || month > 12) {
      errors.month = t("validation.invalid_month");
      return errors;
    }
    if (day < 1 || day > 31) {
      errors.day = t("validation.invalid_day");
      return errors;
    }

    let gYear, gMonth, gDay;

    if (locale.value === "fa") {
      // Shamsi Specific Logic
      if (month <= 6 && day > 31) {
        errors.day = t("validation.invalid_day");
        return errors;
      }
      if (month > 6 && day > 30) {
        errors.day = t("validation.invalid_day");
        return errors;
      }

      if (month === 12) {
        // FIXED: Explicitly defined the array to prevent type errors
        const leapRemainders = [1, 5, 9, 13, 17, 22, 26, 30];
        const isLeap = leapRemainders.includes(year % 33);

        if (day > 30 || (day === 30 && !isLeap)) {
          errors.day = t("validation.invalid_day");
          return errors;
        }
      }

      [gYear, gMonth, gDay] = j2g(year, month, day);
    } else {
      // Gregorian Specific Logic
      gYear = year;
      gMonth = month;
      gDay = day;

      const isLeap =
        (gYear % 4 === 0 && gYear % 100 !== 0) || gYear % 400 === 0;
      const daysInMonth = [
        31,
        isLeap ? 29 : 28,
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

      if (day > daysInMonth[month - 1]) {
        errors.day = t("validation.invalid_day");
        return errors;
      }
    }

    // 3. Age & Future Checks
    const parsedDate = new Date(gYear, gMonth - 1, gDay);
    const now = new Date();
    const minDate = new Date();
    minDate.setFullYear(now.getFullYear() - 100);

    if (parsedDate > now) {
      errors.year = t("validation.future_date");
    } else if (parsedDate < minDate) {
      errors.year = t("validation.too_old_date");
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  const checkIsNationalCode = (code: string): boolean => {
    const clean = toEnglishNumbers(code);
    if (!/^\d{10}$/.test(clean)) return false;
    if (/^(\d)\1{9}$/.test(clean)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(clean.charAt(i)) * (10 - i);
    const remainder = sum % 11;
    const checkDigit = parseInt(clean.charAt(9));
    return remainder < 2
      ? checkDigit === remainder
      : checkDigit === 11 - remainder;
  };

  const validateAuthIdentifier = (val: string): string | null => {
    const cleanVal = toEnglishNumbers(val.trim());
    const fieldTitle = t("auth.login.username");
    if (!cleanVal) return t("validation.required", { field: fieldTitle });

    if (cleanVal.startsWith("09")) {
      if (!phoneRegex.test(cleanVal)) return t("validation.phone_invalid");
      return null;
    }

    if (cleanVal.length === 10) {
      if (checkIsNationalCode(cleanVal)) return null;
      return cleanVal.startsWith("9")
        ? t("validation.foreign_id_invalid")
        : t("validation.national_id_invalid");
    }
    return t("validation.identifier_invalid");
  };

  // --- Remaining Auth/Profile Validators ---

  const validatePassword = (password: string): string | null => {
    if (!password)
      return t("auth.password.validation.required", {
        field: t("auth.password.title"),
      });
    if (password.length < 8) return t("auth.password.validation.tooShort");
    if (!/[a-z]/.test(password))
      return t("auth.password.validation.missingLowercase");
    if (!/[A-Z]/.test(password))
      return t("auth.password.validation.missingUppercase");
    if (!/\d/.test(password))
      return t("auth.password.validation.missingNumber");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      return t("auth.password.validation.missingSpecial");
    if (/\s/.test(password)) return t("auth.password.validation.hasSpaces");
    return null;
  };

  const validateEmail = (text: string, fieldTitle?: string): string | null => {
    const title = fieldTitle || t("auth.register.email");
    if (!text || text.trim().length === 0)
      return t("validation.required", { field: title });
    if (!checkIsEmail(text))
      return t("validation.invalid_format", { field: title });
    return null;
  };

  const validateForeignCode = (code: string): string | null => {
    const clean = toEnglishNumbers(code);
    if (!clean)
      return t("validation.required", {
        field: t("auth.profile.personalDetails.foreignCode"),
      });
    if (!/^\d+$/.test(clean) || clean.length < 5)
      return t("validation.foreign_id_invalid");
    return null;
  };

  const validateAddress = (text: string, title: string): string | null => {
    if (!text || text.trim().length === 0)
      return t("validation.required", { field: title });
    if (text.length < 10)
      return t("validation.min_length", { field: title, min: 10 });
    return null;
  };

  const validateSlug = (text: string, title: string) => {
    const slugRegex = /^[a-z0-9-]+$/;
    if (!text) return t("validation.required", { field: title });
    return slugRegex.test(text)
      ? null
      : t("business.fields.errors.onlyLatinNumbers");
  };

  const checkRules = (password: string) => {
    const val = password;
    return [
      { label: t("login.passwordRules.eightCharacters"), met: val.length >= 8 },
      { label: t("login.passwordRules.oneLowercase"), met: /[a-z]/.test(val) },
      { label: t("login.passwordRules.oneUppercase"), met: /[A-Z]/.test(val) },
      { label: t("login.passwordRules.oneNumber"), met: /\d/.test(val) },
      {
        label: t("login.passwordRules.specialCharacter"),
        met: /[!@#$%^&*(),.?":{}|<>]/.test(val),
      },
      {
        label: t("login.passwordRules.noWhiteSpace"),
        met: val.length > 0 && !/\s/.test(val),
      },
    ];
  };

  const passwordSecurityRate = (pass: string) => {
    return checkRules(pass).filter((r) => r.met).length;
  };

  const validatePhoneNumber = (val: string): string | null => {
    // 0. Cleanup and check required
    const cleanVal = toEnglishNumbers(val?.trim() || "");
    const fieldTitle = t("validation.phoneNumber");

    if (!cleanVal) {
      return t("validation.required", { field: fieldTitle });
    }

    // 1. If the phone didn't start with 09 its invalid
    if (!cleanVal.startsWith("09")) {
      return t("validation.phone_invalid");
    }

    // 2. if the phone had less than 11 characters length we throw the error which it must have 11 digits
    if (cleanVal.length !== 11) {
      return t("validation.phone_length_invalid");
    }

    // Ensure it's all digits (extra safety)
    if (!/^\d+$/.test(cleanVal)) {
      return t("validation.phone_invalid");
    }

    return null;
  };

  const validateNationalCode = (code: string): string | null => {
    const clean = toEnglishNumbers(code?.trim() || "");
    if (!clean)
      return t("validation.required", {
        field: t("profile.profile.fields.nationalCode"),
      });
    if (!/^\d{10}$/.test(clean)) return t("validation.national_code_length");
    return null;
  };

  const validateRequired = (value: any, fieldTitle: string): string | null => {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    )
      return t("validation.required", { field: fieldTitle });
    return null;
  };

  return {
    validatePhoneNumber,
    validateNationalCode,
    validateName,
    validateSlug,
    passwordSecurityRate,
    checkIsNationalCode,
    validatePassword,
    validateAuthIdentifier,
    validateAddress,
    validateEmail,
    validateForeignCode,
    validateRequired,
    validateBirthDate,
    toEnglishNumbers,
    // Add other socials as needed
    validateUrl: (val: string) =>
      urlRegex.test(val) ? null : t("validation.url_invalid"),
    validateWhatsappUrl: (val: string) =>
      whatsappRegex.test(val) ? null : t("validation.whatsapp_invalid"),
    validateSocialUsername: (val: string) =>
      usernameRegex.test(val) ? null : t("validation.username_invalid"),
  };
};
