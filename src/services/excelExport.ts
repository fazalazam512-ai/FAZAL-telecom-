/**
 * Excel & File Backup Service for FAZAL AZAM TELECOM
 * Uses 'xlsx' to generate multi-sheet Excel workbooks and manages JSON export/import.
 */

import * as XLSX from 'xlsx';
import { Customer, Transaction, Payment, AppSettings } from '../types';
import { paisaToRupees, formatDateOnly, formatDateTime } from '../utils/financial';
import { dbService } from './db';

export function exportTelecomExcelBackup(filename = `FAZAL_AZAM_TELECOM_BACKUP_${formatDateOnly(new Date().toISOString()).replace(/\s+/g, '_')}.xlsx`) {
  const customers = dbService.getCustomers();
  const transactions = dbService.getTransactions();
  const payments = dbService.getPayments();
  const settings = dbService.getSettings();

  // 1. Calculate Summary Metrics
  const activeTxns = transactions.filter((t) => t.status === 'ACTIVE');
  const totalSalesPaisa = activeTxns.reduce((sum, t) => sum + t.salePricePaisa, 0);
  const totalCostPaisa = activeTxns.reduce((sum, t) => sum + t.costPricePaisa, 0);
  const totalProfitPaisa = activeTxns.reduce((sum, t) => sum + t.profitPaisa, 0);
  const totalLossPaisa = activeTxns.reduce((sum, t) => sum + t.lossPaisa, 0);
  const netProfitPaisa = totalProfitPaisa - totalLossPaisa;
  const totalOutstandingPaisa = customers.reduce((sum, c) => sum + c.totalOutstandingPaisa, 0);
  const totalPaymentsReceivedPaisa = payments.reduce((sum, p) => sum + p.amountPaisa, 0);

  // Network Breakdown
  const networks = ['Zong', 'Jazz', 'Ufone', 'Telenor', 'Other'] as const;
  const networkBreakdown = networks.map((net) => {
    const netTxns = activeTxns.filter((t) => t.network === net);
    const sales = netTxns.reduce((sum, t) => sum + t.salePricePaisa, 0);
    const cost = netTxns.reduce((sum, t) => sum + t.costPricePaisa, 0);
    const profit = netTxns.reduce((sum, t) => sum + t.profitPaisa, 0);
    const loss = netTxns.reduce((sum, t) => sum + t.lossPaisa, 0);
    return {
      Network: net,
      Transactions: netTxns.length,
      'Total Sales (Rs)': paisaToRupees(sales),
      'Total Cost (Rs)': paisaToRupees(cost),
      'Total Profit (Rs)': paisaToRupees(profit),
      'Total Loss (Rs)': paisaToRupees(loss),
      'Net Profit (Rs)': paisaToRupees(profit - loss),
    };
  });

  // Create Workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: Dashboard Summary
  const summaryData = [
    { Field: 'Business Name', Value: settings.businessName },
    { Field: 'Phone', Value: settings.phone },
    { Field: 'Report Generated At', Value: formatDateTime(new Date().toISOString()) },
    { Field: 'Default Currency', Value: settings.currency || 'PKR' },
    { Field: '---', Value: '---' },
    { Field: 'Total Sales (Rs)', Value: paisaToRupees(totalSalesPaisa) },
    { Field: 'Total Cost (Rs)', Value: paisaToRupees(totalCostPaisa) },
    { Field: 'Total Profit (Rs)', Value: paisaToRupees(totalProfitPaisa) },
    { Field: 'Total Loss (Rs)', Value: paisaToRupees(totalLossPaisa) },
    { Field: 'Net Profit (Rs)', Value: paisaToRupees(netProfitPaisa) },
    { Field: 'Total Entries', Value: transactions.length },
    { Field: 'Total Active Sales', Value: activeTxns.length },
    { Field: 'Total Customers', Value: customers.length },
    { Field: 'Total Outstanding Udhaar (Rs)', Value: paisaToRupees(totalOutstandingPaisa) },
    { Field: 'Total Payments Received (Rs)', Value: paisaToRupees(totalPaymentsReceivedPaisa) },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Network Performance Sheet
  const wsNetwork = XLSX.utils.json_to_sheet(networkBreakdown);
  XLSX.utils.book_append_sheet(wb, wsNetwork, 'Network Performance');

  // Sheet 2: Transactions
  const txnRows = transactions.map((t) => ({
    'Txn ID': t.id,
    'Date & Time': formatDateTime(t.date),
    Customer: t.customerName,
    Phone: t.customerPhone || '-',
    Network: t.network,
    Package: t.packageName === 'Custom Package' ? (t.customPackageTitle || 'Custom') : t.packageName,
    'Cost Price (Rs)': paisaToRupees(t.costPricePaisa),
    'Sale Price (Rs)': paisaToRupees(t.salePricePaisa),
    'Profit (Rs)': paisaToRupees(t.profitPaisa),
    'Loss (Rs)': paisaToRupees(t.lossPaisa),
    'Payment Status': t.paymentStatus,
    'Amount Received (Rs)': paisaToRupees(t.amountReceivedPaisa),
    'Remaining Udhaar (Rs)': paisaToRupees(t.remainingBalancePaisa),
    Status: t.status,
    'Void Reason': t.voidReason || '',
    Notes: t.notes || '',
  }));
  const wsTxn = XLSX.utils.json_to_sheet(txnRows);
  XLSX.utils.book_append_sheet(wb, wsTxn, 'All Transactions');

  // Sheet 3: Customers & Udhaar Ledger
  const customerRows = customers.map((c) => ({
    'Customer ID': c.id,
    Name: c.name,
    Phone: c.phone,
    Address: c.address || '',
    'Registration Date': c.registrationDate,
    'Total Sales (Rs)': paisaToRupees(c.totalSalesPaisa),
    'Total Paid (Rs)': paisaToRupees(c.totalPaidPaisa),
    'Current Outstanding Udhaar (Rs)': paisaToRupees(c.totalOutstandingPaisa),
    Notes: c.notes || '',
  }));
  const wsCustomers = XLSX.utils.json_to_sheet(customerRows);
  XLSX.utils.book_append_sheet(wb, wsCustomers, 'Customer Udhaar Ledger');

  // Sheet 4: Payments Received
  const paymentRows = payments.map((p) => ({
    'Payment ID': p.id,
    'Date & Time': formatDateTime(p.date),
    Customer: p.customerName,
    'Amount Received (Rs)': paisaToRupees(p.amountPaisa),
    'Payment Method': p.paymentMethod,
    'Previous Balance (Rs)': paisaToRupees(p.previousBalancePaisa),
    'New Balance (Rs)': paisaToRupees(p.newBalancePaisa),
    Notes: p.notes || '',
  }));
  const wsPayments = XLSX.utils.json_to_sheet(paymentRows);
  XLSX.utils.book_append_sheet(wb, wsPayments, 'Udhaar Payments Received');

  // Trigger browser download
  XLSX.writeFile(wb, filename);
}

export function downloadJSONFile(content: string, filename = `FAZAL_AZAM_TELECOM_BACKUP_${formatDateOnly(new Date().toISOString()).replace(/\s+/g, '_')}.json`) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
