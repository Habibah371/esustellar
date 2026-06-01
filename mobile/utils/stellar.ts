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
 * Trims trailing zeros, supports up to 7 decimal places (Stellar stroops precision),
 * and appends an ' XLM' suffix.
 *
 * @param amount The numeric amount to format
 * @param maxDecimals Maximum decimal places shown (default 7, Stellar's max precision)
 * @param locale Optional locale override (defaults to device locale)
 * @returns A formatted string e.g., "1,234.5 XLM"
 */
export function formatXLM(amount: number | string, maxDecimals = 7, locale?: string): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  const raw = typeof numeric === 'number' && Number.isFinite(numeric) ? numeric : 0;
  const value = Object.is(raw, -0) ? 0 : raw;
  const formatter = new Intl.NumberFormat(locale ?? getLocale(), {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
  return `${formatter.format(value)} XLM`;
}
