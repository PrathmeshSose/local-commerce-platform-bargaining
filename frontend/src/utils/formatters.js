/**
 * Utility functions for India localization (INR currency, dates, numbers)
 */

/**
 * Format a numeric amount as Indian Rupees (e.g. ₹1,499, ₹1,25,000)
 * Uses Intl.NumberFormat with 'en-IN' locale and 'INR' currency.
 * If includeDecimals is false or amount is an integer, trailing decimals are omitted for clean display.
 */
export const formatINR = (amount, includeDecimals = false) => {
  const numericValue = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(numericValue)) return '₹0';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : (numericValue % 1 === 0 ? 0 : 2),
    maximumFractionDigits: 2
  }).format(numericValue);
};

/**
 * Format date string (YYYY-MM-DD or Date) into Indian standard DD/MM/YYYY
 */
export const formatDateIN = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Format distance in kilometers (e.g. "1.2 km").
 * A listing without a resolvable position has no distance to show — say so
 * instead of printing "NaN km".
 */
export const formatDistance = (km) => {
  const value = Number(km);
  if (!Number.isFinite(value)) return 'Distance unavailable';
  return `${value.toFixed(1)} km`;
};
