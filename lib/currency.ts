/**
 * Country code → Currency code mapping.
 * Maps ISO 3166-1 alpha-2 country codes to ISO 4217 currency codes.
 */
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // South Asia
  BD: "BDT", IN: "INR", PK: "PKR", LK: "LKR", NP: "NPR",
  // North America
  US: "USD", CA: "CAD", MX: "MXN",
  // Europe
  GB: "GBP", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR",
  PT: "EUR", BE: "EUR", AT: "EUR", IE: "EUR", FI: "EUR", GR: "EUR",
  SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN", CH: "CHF", CZ: "CZK",
  RO: "RON", HU: "HUF", HR: "EUR", BG: "BGN",
  // Asia Pacific
  JP: "JPY", CN: "CNY", KR: "KRW", AU: "AUD", NZ: "NZD",
  SG: "SGD", HK: "HKD", TW: "TWD", TH: "THB", MY: "MYR",
  ID: "IDR", PH: "PHP", VN: "VND",
  // Middle East
  AE: "AED", SA: "SAR", QA: "QAR", KW: "KWD", BH: "BHD",
  // Africa
  ZA: "ZAR", NG: "NGN", EG: "EGP", KE: "KES",
  // South America
  BR: "BRL", AR: "ARS", CL: "CLP", CO: "COP", PE: "PEN",
  // Others
  IL: "ILS", TR: "TRY", RU: "RUB", UA: "UAH",
};

/**
 * Currency display configuration.
 * Currencies not listed here use Intl.NumberFormat defaults.
 */
const ZERO_DECIMAL_CURRENCIES = new Set([
  "JPY", "KRW", "VND", "CLP", "IDR", "HUF",
]);

/**
 * Get the currency code for a given country code.
 * Falls back to USD if country is not mapped.
 */
export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || "USD";
}

/**
 * Format a price in cents (USD base) to a localized currency string.
 * 
 * @param cents - Price in USD cents (the stored format)
 * @param currency - Target currency code (e.g. "BDT", "EUR")
 * @param rate - Exchange rate from USD to target currency (e.g. 119.5 for BDT)
 * @param locale - Optional locale for formatting (auto-detected if not provided)
 * @returns Formatted price string (e.g. "৳1,822.50", "$15.00", "€12.50")
 */
export function formatPrice(
  cents: number,
  currency: string = "USD",
  rate: number = 1,
  locale?: string,
): string {
  // Convert cents to dollars first, then apply exchange rate
  const usdAmount = cents / 100;
  const convertedAmount = usdAmount * rate;

  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency);

  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(isZeroDecimal ? Math.round(convertedAmount) : convertedAmount);
  } catch {
    // Fallback if currency code is invalid
    return `$${usdAmount.toFixed(2)}`;
  }
}

/**
 * Format a dollar amount (already divided by 100) to a localized currency string.
 * Use this when the value is already in dollars, not cents.
 * 
 * @param dollars - Price in USD dollars
 * @param currency - Target currency code
 * @param rate - Exchange rate from USD to target currency
 * @param locale - Optional locale
 */
export function formatDollarPrice(
  dollars: number,
  currency: string = "USD",
  rate: number = 1,
  locale?: string,
): string {
  const convertedAmount = dollars * rate;
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency);

  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(isZeroDecimal ? Math.round(convertedAmount) : convertedAmount);
  } catch {
    return `$${dollars.toFixed(2)}`;
  }
}
