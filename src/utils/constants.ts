import { NetworkConfig, PackagePreset, Customer, Transaction, Payment, AppSettings } from '../types';

export const DEFAULT_NETWORKS: NetworkConfig[] = [
  {
    id: 'NET-ZONG',
    name: 'Zong',
    code: 'ZNG',
    color: '#e11d48', // Magenta/Rose
    textColor: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderLight: 'border-rose-200',
    badgeBg: 'bg-rose-100 text-rose-800',
    isActive: true,
    prefixes: ['0310', '0311', '0312', '0313', '0314', '0315', '0316', '0317', '0318'],
  },
  {
    id: 'NET-JAZZ',
    name: 'Jazz',
    code: 'JAZ',
    color: '#dc2626', // Red
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderLight: 'border-red-200',
    badgeBg: 'bg-red-100 text-red-800',
    isActive: true,
    prefixes: ['0300', '0301', '0302', '0303', '0304', '0305', '0306', '0307', '0308', '0309', '0320', '0321', '0322', '0323', '0324'],
  },
  {
    id: 'NET-UFONE',
    name: 'Ufone',
    code: 'UFN',
    color: '#ea580c', // Orange
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderLight: 'border-orange-200',
    badgeBg: 'bg-orange-100 text-orange-800',
    isActive: true,
    prefixes: ['0330', '0331', '0332', '0333', '0334', '0335', '0336', '0337'],
  },
  {
    id: 'NET-TELENOR',
    name: 'Telenor',
    code: 'TEL',
    color: '#0284c7', // Sky Blue
    textColor: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderLight: 'border-sky-200',
    badgeBg: 'bg-sky-100 text-sky-800',
    isActive: true,
    prefixes: ['0340', '0341', '0342', '0343', '0344', '0345', '0346', '0347', '0348', '0349'],
  },
  {
    id: 'NET-OTHER',
    name: 'Other',
    code: 'OTH',
    color: '#4f46e5', // Indigo
    textColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderLight: 'border-indigo-200',
    badgeBg: 'bg-indigo-100 text-indigo-800',
    isActive: true,
    prefixes: ['0355'],
  },
];

export const DEFAULT_PACKAGES: PackagePreset[] = [
  {
    id: 'PKG-1',
    network: 'Zong',
    name: 'Slot',
    category: 'Load / Slot',
    defaultCostPaisa: 8500, // Rs 85
    defaultSalePaisa: 10000, // Rs 100
    description: 'Instant load slot with 15 Rs margin',
  },
  {
    id: 'PKG-2',
    network: 'Zong',
    name: 'My5',
    category: 'Bundle',
    defaultCostPaisa: 43000, // Rs 430
    defaultSalePaisa: 50000, // Rs 500
    description: 'Monthly My5 Super Bundle',
  },
  {
    id: 'PKG-3',
    network: 'Jazz',
    name: 'Weekly Package',
    category: 'Weekly',
    defaultCostPaisa: 32000, // Rs 320
    defaultSalePaisa: 38000, // Rs 380
    description: 'Weekly All Network Super Duper',
  },
  {
    id: 'PKG-4',
    network: 'Jazz',
    name: 'Monthly Package',
    category: 'Monthly',
    defaultCostPaisa: 95000, // Rs 950
    defaultSalePaisa: 110000, // Rs 1100
    description: 'Monthly Mahana Bachat Offer',
  },
  {
    id: 'PKG-5',
    network: 'Ufone',
    name: 'Daily Package',
    category: 'Daily',
    defaultCostPaisa: 2800, // Rs 28
    defaultSalePaisa: 3500, // Rs 35
    description: 'Daily Power Hour & 500MB',
  },
  {
    id: 'PKG-6',
    network: 'Telenor',
    name: 'Weekly Package',
    category: 'Weekly',
    defaultCostPaisa: 27000, // Rs 270
    defaultSalePaisa: 33000, // Rs 330
    description: 'EasyCard Weekly Plus',
  },
  {
    id: 'PKG-7',
    network: 'Telenor',
    name: 'Monthly Package',
    category: 'Monthly',
    defaultCostPaisa: 88000, // Rs 880
    defaultSalePaisa: 105000, // Rs 1050
    description: 'EasyCard Monthly Mega',
  },
  {
    id: 'PKG-8',
    network: 'Other',
    name: 'Custom Package',
    category: 'Custom',
    defaultCostPaisa: 0,
    defaultSalePaisa: 0,
    description: 'Flexible custom retail package or device',
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'APP_SETTINGS_V1',
  businessName: 'FAZAL AZAM TELECOM',
  tagline: 'Complete Telecom Financial Management System',
  phone: '0300-1234567',
  address: 'Main Bazar, Telecom Market',
  currency: 'PKR',
  currencySymbol: 'Rs',
  language: 'en',
  timezone: 'Asia/Karachi',
  autoPrintReceipt: true,
  lowBalanceAlertThresholdPaisa: 500000, // Rs 5,000
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-101',
    name: 'Muhammad Imran',
    phone: '0300-9876543',
    address: 'Shop # 12, Main Bazar',
    registrationDate: '2026-10-01',
    notes: 'Regular retail customer. Clear on week-ends.',
    totalOutstandingPaisa: 120000, // Rs 1,200
    totalSalesPaisa: 1450000,     // Rs 14,500
    totalPaidPaisa: 1330000,      // Rs 13,300
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-11-02T16:30:00Z',
  },
  {
    id: 'CUST-102',
    name: 'Tariq Mahmood',
    phone: '0312-3456789',
    address: 'Near Jamia Masjid',
    registrationDate: '2026-10-05',
    notes: 'Zong My5 and Slot packages',
    totalOutstandingPaisa: 45000, // Rs 450
    totalSalesPaisa: 820000,     // Rs 8,200
    totalPaidPaisa: 775000,      // Rs 7,750
    createdAt: '2026-10-05T11:15:00Z',
    updatedAt: '2026-11-01T18:20:00Z',
  },
  {
    id: 'CUST-103',
    name: 'Bilal Ahmed',
    phone: '0345-1122334',
    address: 'Railway Road',
    registrationDate: '2026-10-10',
    notes: 'Telenor retailer friend',
    totalOutstandingPaisa: 0,     // Rs 0
    totalSalesPaisa: 2150000,     // Rs 21,500
    totalPaidPaisa: 2150000,      // Rs 21,500
    createdAt: '2026-10-10T14:00:00Z',
    updatedAt: '2026-11-02T19:40:00Z',
  },
  {
    id: 'CUST-104',
    name: 'Kamran Khan',
    phone: '0333-8899001',
    address: 'Post Office Chowk',
    registrationDate: '2026-10-15',
    notes: 'Ufone and Jazz bundles',
    totalOutstandingPaisa: 240000, // Rs 2,400
    totalSalesPaisa: 980000,      // Rs 9,800
    totalPaidPaisa: 740000,       // Rs 7,400
    createdAt: '2026-10-15T09:30:00Z',
    updatedAt: '2026-11-03T11:10:00Z',
  },
  {
    id: 'CUST-105',
    name: 'Usman Ali',
    phone: '0321-7788990',
    address: 'College Road',
    registrationDate: '2026-10-20',
    notes: 'Cash customer, reliable',
    totalOutstandingPaisa: 0,
    totalSalesPaisa: 670000,
    totalPaidPaisa: 670000,
    createdAt: '2026-10-20T12:00:00Z',
    updatedAt: '2026-11-03T14:00:00Z',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-001',
    date: '2026-11-03T09:15:00Z',
    customerId: 'CUST-101',
    customerName: 'Muhammad Imran',
    customerPhone: '0300-9876543',
    network: 'Jazz',
    packageName: 'Monthly Package',
    costPricePaisa: 95000, // Rs 950
    salePricePaisa: 110000, // Rs 1100
    profitPaisa: 15000, // Rs 150
    lossPaisa: 0,
    paymentStatus: 'PARTIAL',
    amountReceivedPaisa: 50000, // Rs 500
    remainingBalancePaisa: 60000, // Rs 600 Udhaar
    notes: 'Rs 500 paid in cash, Rs 600 balance',
    status: 'ACTIVE',
    createdAt: '2026-11-03T09:15:00Z',
    updatedAt: '2026-11-03T09:15:00Z',
  },
  {
    id: 'TXN-002',
    date: '2026-11-03T10:30:00Z',
    customerId: 'CUST-102',
    customerName: 'Tariq Mahmood',
    customerPhone: '0312-3456789',
    network: 'Zong',
    packageName: 'My5',
    costPricePaisa: 43000, // Rs 430
    salePricePaisa: 50000, // Rs 500
    profitPaisa: 7000, // Rs 70
    lossPaisa: 0,
    paymentStatus: 'PAID',
    amountReceivedPaisa: 50000, // Rs 500
    remainingBalancePaisa: 0,
    notes: 'Paid via JazzCash',
    status: 'ACTIVE',
    createdAt: '2026-11-03T10:30:00Z',
    updatedAt: '2026-11-03T10:30:00Z',
  },
  {
    id: 'TXN-003',
    date: '2026-11-03T11:45:00Z',
    customerId: 'CUST-104',
    customerName: 'Kamran Khan',
    customerPhone: '0333-8899001',
    network: 'Ufone',
    packageName: 'Weekly Package',
    costPricePaisa: 28000, // Rs 280
    salePricePaisa: 33000, // Rs 330
    profitPaisa: 5000, // Rs 50
    lossPaisa: 0,
    paymentStatus: 'UDHAAR',
    amountReceivedPaisa: 0,
    remainingBalancePaisa: 33000, // Rs 330
    notes: 'Full udhaar, will pay tomorrow evening',
    status: 'ACTIVE',
    createdAt: '2026-11-03T11:45:00Z',
    updatedAt: '2026-11-03T11:45:00Z',
  },
  {
    id: 'TXN-004',
    date: '2026-11-03T13:20:00Z',
    customerId: 'CUST-103',
    customerName: 'Bilal Ahmed',
    customerPhone: '0345-1122334',
    network: 'Telenor',
    packageName: 'Monthly Package',
    costPricePaisa: 88000, // Rs 880
    salePricePaisa: 105000, // Rs 1050
    profitPaisa: 17000, // Rs 170
    lossPaisa: 0,
    paymentStatus: 'PAID',
    amountReceivedPaisa: 105000,
    remainingBalancePaisa: 0,
    notes: 'Paid cash on counter',
    status: 'ACTIVE',
    createdAt: '2026-11-03T13:20:00Z',
    updatedAt: '2026-11-03T13:20:00Z',
  },
  {
    id: 'TXN-005',
    date: '2026-11-02T15:10:00Z',
    customerId: 'CUST-101',
    customerName: 'Muhammad Imran',
    customerPhone: '0300-9876543',
    network: 'Zong',
    packageName: 'Slot',
    costPricePaisa: 8500, // Rs 85
    salePricePaisa: 10000, // Rs 100
    profitPaisa: 1500, // Rs 15
    lossPaisa: 0,
    paymentStatus: 'PAID',
    amountReceivedPaisa: 10000,
    remainingBalancePaisa: 0,
    notes: 'Slot top-up',
    status: 'ACTIVE',
    createdAt: '2026-11-02T15:10:00Z',
    updatedAt: '2026-11-02T15:10:00Z',
  },
  {
    id: 'TXN-006',
    date: '2026-11-02T17:40:00Z',
    customerId: 'CUST-104',
    customerName: 'Kamran Khan',
    customerPhone: '0333-8899001',
    network: 'Jazz',
    packageName: 'Weekly Package',
    costPricePaisa: 32000, // Rs 320
    salePricePaisa: 38000, // Rs 380
    profitPaisa: 6000, // Rs 60
    lossPaisa: 0,
    paymentStatus: 'UDHAAR',
    amountReceivedPaisa: 0,
    remainingBalancePaisa: 38000, // Rs 380
    notes: 'Added to Udhaar khata',
    status: 'ACTIVE',
    createdAt: '2026-11-02T17:40:00Z',
    updatedAt: '2026-11-02T17:40:00Z',
  },
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'PAY-001',
    date: '2026-11-02T18:00:00Z',
    customerId: 'CUST-101',
    customerName: 'Muhammad Imran',
    amountPaisa: 50000, // Rs 500
    paymentMethod: 'CASH',
    notes: 'Received partial Udhaar payment',
    previousBalancePaisa: 170000, // Rs 1700
    newBalancePaisa: 120000,      // Rs 1200
    createdAt: '2026-11-02T18:00:00Z',
  },
  {
    id: 'PAY-002',
    date: '2026-11-01T16:30:00Z',
    customerId: 'CUST-102',
    customerName: 'Tariq Mahmood',
    amountPaisa: 30000, // Rs 300
    paymentMethod: 'EASYPAISA',
    notes: 'Easypaisa transfer for previous balance',
    previousBalancePaisa: 75000,
    newBalancePaisa: 45000,
    createdAt: '2026-11-01T16:30:00Z',
  },
];
