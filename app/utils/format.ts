export const replaceDigitsByLocale = (
  value: string | number,
  locale: string = "fa",
): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (locale !== "fa") return str;
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.replace(/\d/g, (digit) => {
    return persianDigits[parseInt(digit)];
  });
};

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 KB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const padded = (val: number) => val.toString().padStart(2, "0");

  if (hours > 0) {
    return `${padded(hours)}:${padded(minutes)}:${padded(seconds)}`;
  }

  return `${padded(minutes)}:${padded(seconds)}`;
};
