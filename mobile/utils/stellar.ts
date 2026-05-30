import * as Localization from 'expo-localization';

const getLocale = (): string => Localization.locale ?? 'en';

/**
 * Truncates a Stellar address to the format GXXX...XXXX.
 * Returns the original string if it is too short to truncate.
 */
export function truncateAddress(address: string, leading = 4, trailing = 4): string {
  if (address.length <= leading + trailing) return address;
  return `${address.slice(0, leading)}...${address.slice(-trailing)}`;
}

/**
 * Formats a numeric amount into a consistent XLM display format.
 * Includes thousand separators, a fixed number of decimals, and an ' XLM' suffix.
 * 
 * @param amount The numeric amount to format
 * @param decimals The number of decimal places (default 2)
 * @param locale Optional locale override (defaults to device locale)
 * @returns A formatted string e.g., "1,234.50 XLM"
 */
export function formatXLM(amount: number, decimals = 2, locale?: string): string {
  const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  const formatter = new Intl.NumberFormat(locale ?? getLocale(), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formatter.format(value)} XLM`;
}
