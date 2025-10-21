/**
 * Formatting utilities for financial data display
 */

export const formatCurrency = (value: number, currency = 'USD') => {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatLargeNumber = (value: number) => {
  if (!value) return 'N/A';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
};

export const formatNumber = (value: number) => {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('en-US').format(value);
};

export const formatPercent = (value: number) => {
  if (!value) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
};

