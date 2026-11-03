/**
 * Financial Calculation Utilities
 * Enforces Module 12 Financial Accuracy:
 * - Integer Paisa storage (1 PKR = 100 paisa)
 * - Profit = max(Sale - Cost, 0)
 * - Loss = max(Cost - Sale, 0)
 * - Net Profit = Total Profit - Total Loss
 * - Outstanding = Sale Price - Amount Received
 * - Payments reduce outstanding balance without creating new sales
 */

/**
 * Converts Pakistani Rupees (float/number/string) to Integer Paisa.
 * E.g., 150.50 -> 15050 paisa, 200 -> 20000 paisa
 */
export function rupeesToPaisa(rupees: number | string | undefined | null): number {
  if (rupees === undefined || rupees === null || rupees === '') return 0;
  const num = typeof rupees === 'string' ? parseFloat(rupees.replace(/[^0-9.-]/g, '')) : rupees;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts Integer Paisa to decimal Rupees.
 * E.g., 15050 paisa -> 150.5
 */
export function paisaToRupees(paisa: number | undefined | null): number {
  if (!paisa || isNaN(paisa)) return 0;
  return paisa / 100;
}

/**
 * Formats paisa into clean currency string with thousands separators.
 * E.g., 1505000 paisa -> "Rs 15,050" or "Rs 15,050.50"
 */
export function formatPKR(paisa: number | undefined | null, symbol = 'Rs'): string {
  if (paisa === undefined || paisa === null || isNaN(paisa)) {
    return `${symbol} 0`;
  }
  const isNegative = paisa < 0;
  const absPaisa = Math.abs(paisa);
  const rupees = absPaisa / 100;
  
  const hasDecimals = absPaisa % 100 !== 0;
  const formattedNumber = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rupees);

  return `${isNegative ? '-' : ''}${symbol} ${formattedNumber}`;
}

/**
 * Computes exact Profit and Loss for a telecom transaction.
 */
export function calculateProfitLoss(salePricePaisa: number, costPricePaisa: number) {
  const diff = salePricePaisa - costPricePaisa;
  const profitPaisa = Math.max(diff, 0);
  const lossPaisa = Math.max(-diff, 0);
  const netProfitPaisa = profitPaisa - lossPaisa;

  return {
    profitPaisa,
    lossPaisa,
    netProfitPaisa,
    isProfit: profitPaisa > 0,
    isLoss: lossPaisa > 0,
    isBreakEven: diff === 0,
  };
}

/**
 * Computes remaining Udhaar balance for a transaction.
 */
export function calculateRemainingBalance(salePricePaisa: number, amountReceivedPaisa: number) {
  const remaining = salePricePaisa - amountReceivedPaisa;
  return Math.max(remaining, 0);
}

/**
 * Format ISO date string into readable Pakistan time.
 */
export function formatDateTime(isoString?: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-PK', {
      timeZone: 'Asia/Karachi',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatDateOnly(isoString?: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-PK', {
      timeZone: 'Asia/Karachi',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateId(prefix = 'TXN'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
