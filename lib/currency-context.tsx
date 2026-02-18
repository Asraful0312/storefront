"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  getCurrencyForCountry,
  formatPrice as formatPriceUtil,
  formatDollarPrice as formatDollarPriceUtil,
} from "@/lib/currency";

interface CurrencyContextValue {
  /** Current display currency code (e.g. "BDT", "USD") */
  currency: string;
  /** Exchange rate from USD to current currency */
  rate: number;
  /** User's detected country code */
  countryCode: string;
  /** Whether rates are loaded */
  isLoaded: boolean;
  /** Format price from cents (stored format) */
  formatPrice: (cents: number) => string;
  /** Format price from dollars (already / 100) */
  formatDollarPrice: (dollars: number) => string;
  /** Manually set currency */
  setCurrency: (currencyCode: string) => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  rate: 1,
  countryCode: "US",
  isLoaded: false,
  formatPrice: (cents: number) => `$${(cents / 100).toFixed(2)}`,
  formatDollarPrice: (dollars: number) => `$${dollars.toFixed(2)}`,
  setCurrency: () => {},
});

export function useCurrency() {
  return useContext(CurrencyContext);
}

// Storage key for manual currency override
const CURRENCY_STORAGE_KEY = "storefront_currency";
const COUNTRY_STORAGE_KEY = "storefront_country";

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [countryCode, setCountryCode] = useState("US");
  const [currency, setCurrencyState] = useState("USD");
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch rates from Convex
  const ratesData = useQuery(api.exchangeRates.getRates);
  const refreshRates = useAction(api.exchangeRates.refreshRatesIfStale);

  // Get rate for current currency
  const rate =
    ratesData?.rates && currency !== "USD"
      ? (ratesData.rates[currency] as number) || 1
      : 1;

  // Detect user's country on mount
  useEffect(() => {
    const detectCountry = async () => {
      // Check for manual override first
      const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
      const savedCountry = localStorage.getItem(COUNTRY_STORAGE_KEY);

      if (savedCurrency && savedCountry) {
        setCurrencyState(savedCurrency);
        setCountryCode(savedCountry);
        setIsLoaded(true);
        return;
      }

      try {
        // Use our own API route (server-side, no CORS issues)
        const response = await fetch("/api/geo", {
          signal: AbortSignal.timeout(3000),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.country_code) {
            const detectedCountry = data.country_code;
            const detectedCurrency = getCurrencyForCountry(detectedCountry);

            setCountryCode(detectedCountry);
            setCurrencyState(detectedCurrency);

            localStorage.setItem(COUNTRY_STORAGE_KEY, detectedCountry);
            localStorage.setItem(CURRENCY_STORAGE_KEY, detectedCurrency);
          }
        }
      } catch {
        console.log("Geolocation detection failed, defaulting to USD");
      }

      setIsLoaded(true);
    };

    detectCountry();
  }, []);

  // Trigger rate refresh if stale
  useEffect(() => {
    if (currency !== "USD") {
      refreshRates().catch(() => {
        // Silent fail - stale rates are better than no rates
      });
    }
  }, [currency, refreshRates]);

  // Format price from cents
  const formatPrice = useCallback(
    (cents: number) => formatPriceUtil(cents, currency, rate),
    [currency, rate]
  );

  // Format price from dollars
  const formatDollarPrice = useCallback(
    (dollars: number) => formatDollarPriceUtil(dollars, currency, rate),
    [currency, rate]
  );

  // Allow manual currency switch
  const setCurrency = useCallback((newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
  }, []);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        rate,
        countryCode,
        isLoaded,
        formatPrice,
        formatDollarPrice,
        setCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}
