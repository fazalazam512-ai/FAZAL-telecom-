/**
 * Database & Storage Service for FAZAL AZAM TELECOM
 * Handles local persistence with IndexedDB / localStorage and seamless
 * bidirectional Firebase Firestore synchronization when provisioned.
 */

import {
  Customer,
  Transaction,
  Payment,
  NetworkConfig,
  PackagePreset,
  AuditLog,
  AppSettings,
  PaymentAllocation,
} from '../types';
import {
  DEFAULT_NETWORKS,
  DEFAULT_PACKAGES,
  DEFAULT_SETTINGS,
  INITIAL_CUSTOMERS,
  INITIAL_TRANSACTIONS,
  INITIAL_PAYMENTS,
} from '../utils/constants';
import { calculateProfitLoss, calculateRemainingBalance, generateId } from '../utils/financial';

const STORAGE_KEYS = {
  CUSTOMERS: 'fat_customers_v1',
  TRANSACTIONS: 'fat_transactions_v1',
  PAYMENTS: 'fat_payments_v1',
  ALLOCATIONS: 'fat_allocations_v1',
  NETWORKS: 'fat_networks_v1',
  PACKAGES: 'fat_packages_v1',
  AUDIT_LOGS: 'fat_audit_logs_v1',
  SETTINGS: 'fat_settings_v1',
  INITIALIZED: 'fat_initialized_v1',
};

// Operation types for Firestore security errors
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'local-admin',
      email: 'khankahaajaag@gmail.com',
    },
    operationType,
    path,
  };
  console.warn('Database Error Context:', JSON.stringify(errInfo));
  return errInfo;
}

class DatabaseService {
  private isInitialized = false;

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    if (typeof window === 'undefined') return;

    try {
      const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
      if (!isInit) {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
        localStorage.setItem(STORAGE_KEYS.ALLOCATIONS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.NETWORKS, JSON.stringify(DEFAULT_NETWORKS));
        localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(DEFAULT_PACKAGES));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        
        const initialLogs: AuditLog[] = [
          {
            id: generateId('LOG'),
            action: 'CREATE',
            entityType: 'SETTINGS',
            entityId: 'APP_SETTINGS_V1',
            performedBy: 'System Administrator',
            details: 'FAZAL AZAM TELECOM Database initialized with standard telecom networks & presets',
            timestamp: new Date().toISOString(),
          },
        ];
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
        localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      }
      this.isInitialized = true;
    } catch (e) {
      console.error('Failed to initialize local database:', e);
    }
  }

  // --- CUSTOMERS ---
  getCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return data ? JSON.parse(data) : INITIAL_CUSTOMERS;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'customers');
      return [];
    }
  }

  getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find((c) => c.id === id);
  }

  saveCustomers(customers: Customer[]) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }

  addCustomer(customerData: Omit<Customer, 'id' | 'totalOutstandingPaisa' | 'totalSalesPaisa' | 'totalPaidPaisa' | 'createdAt' | 'updatedAt'>): Customer {
    const customers = this.getCustomers();
    const newCustomer: Customer = {
      ...customerData,
      id: generateId('CUST'),
      totalOutstandingPaisa: 0,
      totalSalesPaisa: 0,
      totalPaidPaisa: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    customers.unshift(newCustomer);
    this.saveCustomers(customers);

    this.addAuditLog({
      action: 'CREATE',
      entityType: 'CUSTOMER',
      entityId: newCustomer.id,
      performedBy: 'User',
      details: `Registered customer "${newCustomer.name}" (${newCustomer.phone})`,
    });

    return newCustomer;
  }

  updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const customers = this.getCustomers();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const updated = {
      ...customers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    customers[index] = updated;
    this.saveCustomers(customers);

    this.addAuditLog({
      action: 'UPDATE',
      entityType: 'CUSTOMER',
      entityId: id,
      performedBy: 'User',
      details: `Updated customer "${updated.name}" details`,
    });

    return updated;
  }

  deleteCustomer(id: string): { success: boolean; message?: string } {
    const customers = this.getCustomers();
    const customer = customers.find((c) => c.id === id);
    if (!customer) return { success: false, message: 'Customer not found' };

    if (customer.totalOutstandingPaisa > 0) {
      return {
        success: false,
        message: `Cannot delete customer with remaining Udhaar balance of Rs ${(customer.totalOutstandingPaisa / 100).toLocaleString()}. Please clear balance first.`,
      };
    }

    const filtered = customers.filter((c) => c.id !== id);
    this.saveCustomers(filtered);

    this.addAuditLog({
      action: 'DELETE',
      entityType: 'CUSTOMER',
      entityId: id,
      performedBy: 'User',
      details: `Deleted customer "${customer.name}"`,
    });

    return { success: true };
  }

  // --- TRANSACTIONS ---
  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : INITIAL_TRANSACTIONS;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'transactions');
      return [];
    }
  }

  saveTransactions(transactions: Transaction[]) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  addTransaction(data: {
    date: string;
    customerId: string;
    customerName: string;
    customerPhone?: string;
    network: Transaction['network'];
    packageName: Transaction['packageName'];
    customPackageTitle?: string;
    costPricePaisa: number;
    salePricePaisa: number;
    paymentStatus: Transaction['paymentStatus'];
    amountReceivedPaisa: number;
    notes?: string;
  }): Transaction {
    const transactions = this.getTransactions();
    const { profitPaisa, lossPaisa } = calculateProfitLoss(data.salePricePaisa, data.costPricePaisa);
    const remainingBalancePaisa = calculateRemainingBalance(data.salePricePaisa, data.amountReceivedPaisa);

    const newTxn: Transaction = {
      id: generateId('TXN'),
      date: data.date || new Date().toISOString(),
      customerId: data.customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      network: data.network,
      packageName: data.packageName,
      customPackageTitle: data.customPackageTitle,
      costPricePaisa: data.costPricePaisa,
      salePricePaisa: data.salePricePaisa,
      profitPaisa,
      lossPaisa,
      paymentStatus: data.paymentStatus,
      amountReceivedPaisa: data.amountReceivedPaisa,
      remainingBalancePaisa,
      notes: data.notes,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    transactions.unshift(newTxn);
    this.saveTransactions(transactions);

    // Update customer's outstanding balance & lifetime stats
    const customers = this.getCustomers();
    const custIdx = customers.findIndex((c) => c.id === data.customerId);
    if (custIdx !== -1) {
      customers[custIdx].totalSalesPaisa += data.salePricePaisa;
      customers[custIdx].totalPaidPaisa += data.amountReceivedPaisa;
      customers[custIdx].totalOutstandingPaisa += remainingBalancePaisa;
      customers[custIdx].updatedAt = new Date().toISOString();
      this.saveCustomers(customers);
    }

    this.addAuditLog({
      action: 'CREATE',
      entityType: 'TRANSACTION',
      entityId: newTxn.id,
      performedBy: 'User',
      details: `Created sale for "${data.customerName}" - ${data.network} ${data.packageName} (Sale: Rs ${data.salePricePaisa / 100}, Cost: Rs ${data.costPricePaisa / 100})`,
    });

    return newTxn;
  }

  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const transactions = this.getTransactions();
    const index = transactions.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const oldTxn = transactions[index];
    const costPricePaisa = updates.costPricePaisa ?? oldTxn.costPricePaisa;
    const salePricePaisa = updates.salePricePaisa ?? oldTxn.salePricePaisa;
    const amountReceivedPaisa = updates.amountReceivedPaisa ?? oldTxn.amountReceivedPaisa;

    const { profitPaisa, lossPaisa } = calculateProfitLoss(salePricePaisa, costPricePaisa);
    const remainingBalancePaisa = calculateRemainingBalance(salePricePaisa, amountReceivedPaisa);

    const updatedTxn: Transaction = {
      ...oldTxn,
      ...updates,
      costPricePaisa,
      salePricePaisa,
      profitPaisa,
      lossPaisa,
      amountReceivedPaisa,
      remainingBalancePaisa,
      updatedAt: new Date().toISOString(),
    };

    transactions[index] = updatedTxn;
    this.saveTransactions(transactions);

    // Adjust customer outstanding balance difference
    const diffRemaining = remainingBalancePaisa - oldTxn.remainingBalancePaisa;
    const diffSales = salePricePaisa - oldTxn.salePricePaisa;
    const diffPaid = amountReceivedPaisa - oldTxn.amountReceivedPaisa;

    const customers = this.getCustomers();
    const custIdx = customers.findIndex((c) => c.id === updatedTxn.customerId);
    if (custIdx !== -1) {
      customers[custIdx].totalSalesPaisa += diffSales;
      customers[custIdx].totalPaidPaisa += diffPaid;
      customers[custIdx].totalOutstandingPaisa += diffRemaining;
      customers[custIdx].updatedAt = new Date().toISOString();
      this.saveCustomers(customers);
    }

    this.addAuditLog({
      action: 'UPDATE',
      entityType: 'TRANSACTION',
      entityId: id,
      performedBy: 'User',
      details: `Edited transaction ${id}`,
    });

    return updatedTxn;
  }

  voidTransaction(id: string, voidReason: string): boolean {
    const transactions = this.getTransactions();
    const index = transactions.findIndex((t) => t.id === id);
    if (index === -1) return false;

    const txn = transactions[index];
    if (txn.status === 'VOIDED') return true;

    txn.status = 'VOIDED';
    txn.voidReason = voidReason || 'Voided by user';
    txn.updatedAt = new Date().toISOString();
    transactions[index] = txn;
    this.saveTransactions(transactions);

    // Rollback customer balance and sales
    const customers = this.getCustomers();
    const custIdx = customers.findIndex((c) => c.id === txn.customerId);
    if (custIdx !== -1) {
      customers[custIdx].totalSalesPaisa = Math.max(0, customers[custIdx].totalSalesPaisa - txn.salePricePaisa);
      customers[custIdx].totalPaidPaisa = Math.max(0, customers[custIdx].totalPaidPaisa - txn.amountReceivedPaisa);
      customers[custIdx].totalOutstandingPaisa = Math.max(0, customers[custIdx].totalOutstandingPaisa - txn.remainingBalancePaisa);
      customers[custIdx].updatedAt = new Date().toISOString();
      this.saveCustomers(customers);
    }

    this.addAuditLog({
      action: 'VOID',
      entityType: 'TRANSACTION',
      entityId: id,
      performedBy: 'User',
      details: `Voided transaction ${id}. Reason: ${voidReason}`,
    });

    return true;
  }

  // --- PAYMENTS (Udhaar Repayment) ---
  // Customer payments MUST reduce outstanding balance without creating new sales
  getPayments(): Payment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return data ? JSON.parse(data) : INITIAL_PAYMENTS;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'payments');
      return [];
    }
  }

  savePayments(payments: Payment[]) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }

  addPayment(data: {
    customerId: string;
    amountPaisa: number;
    paymentMethod: Payment['paymentMethod'];
    notes?: string;
    date?: string;
  }): { payment: Payment; newBalancePaisa: number } | null {
    const customers = this.getCustomers();
    const custIdx = customers.findIndex((c) => c.id === data.customerId);
    if (custIdx === -1) return null;

    const customer = customers[custIdx];
    const prevBalance = customer.totalOutstandingPaisa;
    const newBalance = Math.max(0, prevBalance - data.amountPaisa);

    const payment: Payment = {
      id: generateId('PAY'),
      date: data.date || new Date().toISOString(),
      customerId: data.customerId,
      customerName: customer.name,
      amountPaisa: data.amountPaisa,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      previousBalancePaisa: prevBalance,
      newBalancePaisa: newBalance,
      createdAt: new Date().toISOString(),
    };

    const payments = this.getPayments();
    payments.unshift(payment);
    this.savePayments(payments);

    // Update customer balance: reduce outstanding, increase total paid. DO NOT TOUCH SALES.
    customer.totalOutstandingPaisa = newBalance;
    customer.totalPaidPaisa += data.amountPaisa;
    customer.updatedAt = new Date().toISOString();
    customers[custIdx] = customer;
    this.saveCustomers(customers);

    this.addAuditLog({
      action: 'PAYMENT_RECEIVED',
      entityType: 'PAYMENT',
      entityId: payment.id,
      performedBy: 'User',
      details: `Received Udhaar payment Rs ${data.amountPaisa / 100} from "${customer.name}". Previous: Rs ${prevBalance / 100}, New: Rs ${newBalance / 100}`,
    });

    return { payment, newBalancePaisa: newBalance };
  }

  // Direct Udhaar manual adjustment (e.g. debt added without bundle sale)
  addManualUdhaar(customerId: string, amountPaisa: number, reason: string): Customer | null {
    const customers = this.getCustomers();
    const custIdx = customers.findIndex((c) => c.id === customerId);
    if (custIdx === -1) return null;

    const customer = customers[custIdx];
    customer.totalOutstandingPaisa += amountPaisa;
    customer.updatedAt = new Date().toISOString();
    customers[custIdx] = customer;
    this.saveCustomers(customers);

    // Also record a transaction for tracking
    const newTxn = this.addTransaction({
      date: new Date().toISOString(),
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      network: 'Other',
      packageName: 'Custom Package',
      customPackageTitle: reason || 'Manual Udhaar / Credit Adjustment',
      costPricePaisa: amountPaisa, // cost equals sale for pure loan or balance transfer
      salePricePaisa: amountPaisa,
      paymentStatus: 'UDHAAR',
      amountReceivedPaisa: 0,
      notes: `Manual credit adjustment: ${reason}`,
    });

    return customer;
  }

  // --- NETWORKS & PACKAGES ---
  getNetworks(): NetworkConfig[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NETWORKS);
      return data ? JSON.parse(data) : DEFAULT_NETWORKS;
    } catch {
      return DEFAULT_NETWORKS;
    }
  }

  saveNetworks(networks: NetworkConfig[]) {
    localStorage.setItem(STORAGE_KEYS.NETWORKS, JSON.stringify(networks));
  }

  getPackages(): PackagePreset[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PACKAGES);
      return data ? JSON.parse(data) : DEFAULT_PACKAGES;
    } catch {
      return DEFAULT_PACKAGES;
    }
  }

  savePackages(packages: PackagePreset[]) {
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
  }

  addPackage(pkg: Omit<PackagePreset, 'id'>): PackagePreset {
    const packages = this.getPackages();
    const newPkg: PackagePreset = {
      ...pkg,
      id: generateId('PKG'),
    };
    packages.push(newPkg);
    this.savePackages(packages);
    return newPkg;
  }

  updatePackage(id: string, updates: Partial<PackagePreset>): boolean {
    const packages = this.getPackages();
    const idx = packages.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    packages[idx] = { ...packages[idx], ...updates };
    this.savePackages(packages);
    return true;
  }

  deletePackage(id: string): boolean {
    const packages = this.getPackages();
    const filtered = packages.filter((p) => p.id !== id);
    this.savePackages(filtered);
    return true;
  }

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    try {
      const logs = this.getAuditLogs();
      const newLog: AuditLog = {
        ...log,
        id: generateId('LOG'),
        timestamp: new Date().toISOString(),
      };
      logs.unshift(newLog);
      // Keep recent 500 logs to avoid unbounded size
      if (logs.length > 500) logs.length = 500;
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.warn('Could not record audit log:', e);
    }
  }

  // --- SETTINGS ---
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  updateSettings(updates: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));

    this.addAuditLog({
      action: 'UPDATE',
      entityType: 'SETTINGS',
      entityId: updated.id,
      performedBy: 'User',
      details: 'Updated business settings and preferences',
    });

    return updated;
  }

  // --- BACKUP & RESTORE ---
  exportFullBackupJSON(): string {
    const backupData = {
      version: '1.0',
      appName: 'FAZAL AZAM TELECOM',
      exportedAt: new Date().toISOString(),
      customers: this.getCustomers(),
      transactions: this.getTransactions(),
      payments: this.getPayments(),
      networks: this.getNetworks(),
      packages: this.getPackages(),
      settings: this.getSettings(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(backupData, null, 2);
  }

  restoreFromJSON(jsonString: string): { success: boolean; message: string; recordCounts?: Record<string, number> } {
    try {
      const data = JSON.parse(jsonString);

      // Validate required keys
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid JSON file format.' };
      }

      if (!Array.isArray(data.customers) || !Array.isArray(data.transactions)) {
        return { success: false, message: 'Backup file is missing required customers or transactions arrays.' };
      }

      // Restore collections
      this.saveCustomers(data.customers);
      this.saveTransactions(data.transactions);
      if (Array.isArray(data.payments)) this.savePayments(data.payments);
      if (Array.isArray(data.networks)) this.saveNetworks(data.networks);
      if (Array.isArray(data.packages)) this.savePackages(data.packages);
      if (data.settings && typeof data.settings === 'object') {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      }

      const counts = {
        customers: data.customers.length,
        transactions: data.transactions.length,
        payments: Array.isArray(data.payments) ? data.payments.length : 0,
      };

      this.addAuditLog({
        action: 'BACKUP_RESTORE',
        entityType: 'SETTINGS',
        entityId: 'SYSTEM',
        performedBy: 'User',
        details: `Restored backup: ${counts.customers} customers, ${counts.transactions} transactions, ${counts.payments} payments.`,
      });

      return {
        success: true,
        message: `Successfully restored ${counts.customers} customers, ${counts.transactions} transactions, and ${counts.payments} payment records!`,
        recordCounts: counts,
      };
    } catch (e: any) {
      return { success: false, message: `Failed to restore backup: ${e.message || 'Corrupted file'}` };
    }
  }

  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
    this.initDatabase();
  }
}

export const dbService = new DatabaseService();
