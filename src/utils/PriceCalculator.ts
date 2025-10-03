/**
 * Utility functions for price calculations including GST
 */

export interface PriceCalculation {
  basePrice: number;
  gstAmount: number;
  finalPrice: number;
  gstPercentage: number;
}

/**
 * Calculate the final price including GST
 * @param price - Original price of the product
 * @param discountPrice - Discounted price (optional)
 * @param gstPercentage - GST percentage (0-100)
 * @returns PriceCalculation object with base price, GST amount, and final price
 */
export function calculateFinalPrice(
  price: number,
  discountPrice?: number,
  gstPercentage: number = 0
): PriceCalculation {
  // Use discount price if available, otherwise use original price
  const basePrice = discountPrice || price;

  // Calculate GST amount
  const gstAmount = basePrice * (gstPercentage / 100);

  // Calculate final price (base price + GST)
  const finalPrice = basePrice + gstAmount;

  return {
    basePrice,
    gstAmount,
    finalPrice,
    gstPercentage
  };
}

/**
 * Format price for display with currency symbol
 * @param price - Price to format
 * @param currency - Currency symbol (default: ₹)
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = '₹'): string {
  return `${currency}${price.toFixed(2)}`;
}

/**
 * Calculate discount percentage
 * @param originalPrice - Original price
 * @param discountPrice - Discounted price
 * @returns Discount percentage (0-100)
 */
export function calculateDiscountPercentage(originalPrice: number, discountPrice: number): number {
  if (!discountPrice || discountPrice >= originalPrice) {
    return 0;
  }
  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
}
