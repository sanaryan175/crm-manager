// Supported currencies
export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  // Indian numbering uses 2-2-3 grouping — handled by Intl.NumberFormat
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$',     name: 'US Dollar',          locale: 'en-US' },
  { code: 'EUR', symbol: '€',     name: 'Euro',               locale: 'de-DE' },
  { code: 'GBP', symbol: '£',     name: 'British Pound',      locale: 'en-GB' },
  { code: 'INR', symbol: '₹',     name: 'Indian Rupee',       locale: 'en-IN' },
  { code: 'AED', symbol: 'د.إ',   name: 'UAE Dirham',         locale: 'ar-AE' },
  { code: 'JPY', symbol: '¥',     name: 'Japanese Yen',       locale: 'ja-JP' },
  { code: 'CAD', symbol: 'CA$',   name: 'Canadian Dollar',    locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$',    name: 'Australian Dollar',  locale: 'en-AU' },
  { code: 'SGD', symbol: 'S$',    name: 'Singapore Dollar',   locale: 'en-SG' },
  { code: 'CHF', symbol: 'CHF',   name: 'Swiss Franc',        locale: 'de-CH' },
];

// Supported countries
export interface CountryConfig {
  code: string;       // ISO 3166-1 alpha-2
  name: string;
  defaultCurrency: string;
  dateLocale: string;
}

export const COUNTRIES: CountryConfig[] = [
  { code: 'US', name: 'United States',   defaultCurrency: 'USD', dateLocale: 'en-US' },
  { code: 'IN', name: 'India',           defaultCurrency: 'INR', dateLocale: 'en-IN' },
  { code: 'GB', name: 'United Kingdom',  defaultCurrency: 'GBP', dateLocale: 'en-GB' },
  { code: 'DE', name: 'Germany',         defaultCurrency: 'EUR', dateLocale: 'de-DE' },
  { code: 'FR', name: 'France',          defaultCurrency: 'EUR', dateLocale: 'fr-FR' },
  { code: 'AE', name: 'UAE',             defaultCurrency: 'AED', dateLocale: 'ar-AE' },
  { code: 'JP', name: 'Japan',           defaultCurrency: 'JPY', dateLocale: 'ja-JP' },
  { code: 'CA', name: 'Canada',          defaultCurrency: 'CAD', dateLocale: 'en-CA' },
  { code: 'AU', name: 'Australia',       defaultCurrency: 'AUD', dateLocale: 'en-AU' },
  { code: 'SG', name: 'Singapore',       defaultCurrency: 'SGD', dateLocale: 'en-SG' },
  { code: 'CH', name: 'Switzerland',     defaultCurrency: 'CHF', dateLocale: 'de-CH' },
];

export function getCurrencyConfig(code: string): CurrencyConfig {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function getCountryConfig(code: string): CountryConfig {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

/**
 * Format a monetary value using Intl.NumberFormat.
 * Handles INR lakh/crore grouping automatically via 'en-IN' locale.
 */
export function formatCurrency(
  value: number,
  currencyCode: string,
  options: { compact?: boolean } = {}
): string {
  const config = getCurrencyConfig(currencyCode);

  if (options.compact) {
    // Compact: ₹5L, $2K, etc.
    if (currencyCode === 'INR') {
      if (value >= 10_000_000) return `${config.symbol}${(value / 10_000_000).toFixed(2)}Cr`;
      if (value >= 100_000)    return `${config.symbol}${(value / 100_000).toFixed(2)}L`;
      if (value >= 1_000)      return `${config.symbol}${(value / 1_000).toFixed(1)}K`;
      return `${config.symbol}${value}`;
    }
    if (value >= 1_000_000) return `${config.symbol}${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000)     return `${config.symbol}${(value / 1_000).toFixed(1)}K`;
    return new Intl.NumberFormat(config.locale, {
      style: 'currency', currency: currencyCode, maximumFractionDigits: 0,
    }).format(value);
  }

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
  }).format(value);
}

