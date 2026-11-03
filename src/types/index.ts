/**
 * Core Type Definitions for FAZAL AZAM TELECOM
 * Financial software with exact paisa integer precision.
 */

export type NetworkName = 'Zong' | 'Jazz' | 'Ufone' | 'Telenor' | 'Other';

export type PackageType = 
  | 'Slot' 
  | 'My5' 
  | 'Daily Package' 
  | 'Weekly Package' 
  | 'Monthly Package' 
  | 'Custom Package';

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UDHAAR';

export type TransactionStatus = 'ACTIVE' | 'VOIDED';

export type PaymentMethod = 'CASH' | 'EASYPAISA' | 'JAZZCASH' | 'BANK_TRANSFER' | 'OTHER';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  registrationDate: string;
  notes?: string;
  totalOutstandingPaisa: number; // Integer paisa (Rs 1 = 100 paisa)
  totalSalesPaisa: number;
  totalPaidPaisa: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO 8601 string
  customerId: string;
  customerName: string;
  customerPhone?: string;
  network: NetworkName;
  packageName: PackageType;
  customPackageTitle?: string;
  costPricePaisa: number; // Integer paisa
  salePricePaisa: number; // Integer paisa
  profitPaisa: number;    // max(Sale - Cost, 0)
  lossPaisa: number;      // max(Cost - Sale, 0)
  paymentStatus: PaymentStatus;
  amountReceivedPaisa: number; // Paisa
  remainingBalancePaisa: number; // SalePrice - AmountReceived
  notes?: string;
  status: TransactionStatus;
  voidReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  amountPaisa: number; // Integer paisa
  paymentMethod: PaymentMethod;
  notes?: string;
  previousBalancePaisa: number;
  newBalancePaisa: number;
  createdAt: string;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  transactionId: string;
  allocatedPaisa: number;
  createdAt: string;
}

export interface NetworkConfig {
  id: string;
  name: NetworkName;
  code: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderLight: string;
  badgeBg: string;
  isActive: boolean;
  prefixes: string[];
}

export interface PackagePreset {
  id: string;
  network: NetworkName;
  name: PackageType | string;
  category: string;
  defaultCostPaisa: number;
  defaultSalePaisa: number;
  description?: string;
}

export interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'VOID' | 'DELETE' | 'BACKUP_RESTORE' | 'PAYMENT_RECEIVED';
  entityType: 'TRANSACTION' | 'CUSTOMER' | 'PAYMENT' | 'SETTINGS';
  entityId: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

export interface AppSettings {
  id: string;
  businessName: string;
  tagline?: string;
  phone: string;
  address: string;
  currency: string;
  currencySymbol: string;
  language: 'en' | 'ur';
  timezone: string;
  securityPin?: string;
  autoPrintReceipt?: boolean;
  lowBalanceAlertThresholdPaisa: number;
  firebaseConfig?: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    firestoreDatabaseId?: string;
  };
}

export type ViewTab = 
  | 'dashboard' 
  | 'newsale' 
  | 'customers' 
  | 'udhaar' 
  | 'history' 
  | 'reports' 
  | 'networks' 
  | 'backup' 
  | 'settings';
