import * as Localization from 'expo-localization';

/**
 * Returns the current device locale (BCP-47), e.g. 'fr-FR', 'en-GB'.
 * Falls back to 'en' when unavailable.
 */
const getLocale = (): string => Localization.locale ?? 'en';

/**
 * Formats a date value using the device locale and the given Intl.DateTimeFormat options.
 *
 * @param date    - A Date object, ISO string, or timestamp.
 * @param options - Optional Intl.DateTimeFormat options (defaults to date-only medium style).
 * @param locale  - Override the locale; defaults to the device locale.
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  locale?: string,
): string {
  const resolvedLocale = locale ?? getLocale();
  const resolvedOptions: Intl.DateTimeFormatOptions = options ?? {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return new Intl.DateTimeFormat(resolvedLocale, resolvedOptions).format(
    new Date(date),
  );
}

/**
 * Formats a date + time value using the device locale.
 *
 * @param date   - A Date object, ISO string, or timestamp.
 * @param locale - Override the locale; defaults to the device locale.
 */
export function formatDateTime(
  date: Date | string | number,
  locale?: string,
): string {
  return formatDate(
    date,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    locale,
  );
}
