// Currency exchange rates (relative to USD)
// In production, this should be fetched from an API like exchangerate-api.com
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.5,
  JPY: 149.5,
  CAD: 1.36,
  AUD: 1.53,
  SGD: 1.34,
  CHF: 0.88,
  AED: 3.67,
};

// Cache for exchange rates with timestamp
let cachedRates: Record<string, number> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Fetch fresh exchange rates from an API (placeholder for production)
 * In production, integrate with exchangerate-api.com or similar service
 */
async function fetchExchangeRates(): Promise<Record<string, number>> {
  // TODO: Integrate with actual exchange rate API
  // Example: const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
  // const data = await response.json();
  // return data.rates;
  
  // For now, return static rates
  return EXCHANGE_RATES;
}

/**
 * Get exchange rates with caching
 */
async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (cachedRates && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedRates;
  }
  
  // Fetch fresh rates
  cachedRates = await fetchExchangeRates();
  cacheTimestamp = now;
  
  return cachedRates;
}

/**
 * Convert amount from one currency to another
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency code (e.g., 'USD')
 * @param toCurrency - Target currency code (e.g., 'INR')
 * @returns Converted amount
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;
  
  const rates = await getExchangeRates();
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  
  // Convert to USD first, then to target currency
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
}

/**
 * Get exchange rate between two currencies
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Exchange rate
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return 1;
  
  const rates = await getExchangeRates();
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  
  return toRate / fromRate;
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(EXCHANGE_RATES);
}

/**
 * Validate if a currency code is supported
 */
export function isCurrencySupported(currency: string): boolean {
  return currency in EXCHANGE_RATES;
}

/**
 * Clear the exchange rate cache (useful for testing or manual refresh)
 */
export function clearExchangeRateCache(): void {
  cachedRates = null;
  cacheTimestamp = 0;
}
