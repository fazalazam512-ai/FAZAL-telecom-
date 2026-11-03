/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * FAZAL AZAM TELECOM
 * Complete Telecom Business & Financial Management Application
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Customer, 
  Transaction, 
  Payment, 
  NetworkConfig, 
  PackagePreset, 
  AppSettings, 
  ViewTab 
} from './types';
import { dbService } from './services/db';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { NewSaleView } from './components/NewSaleView';
import { CustomersView } from './components/CustomersView';
import { UdhaarView } from './components/UdhaarView';
import { HistoryView } from './components/HistoryView';
import { ReportsView } from './components/ReportsView';
import { NetworksView } from './components/NetworksView';
import { BackupView } from './components/BackupView';
import { SettingsView } from './components/SettingsView';
import { PaymentModal } from './components/PaymentModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  
  // Core Application State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [networks, setNetworks] = useState<NetworkConfig[]>([]);
  const [packages, setPackages] = useState<PackagePreset[]>([]);
  const [settings, setSettings] = useState<AppSettings>(dbService.getSettings());

  // Interactive Modals
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Load latest state from persistent database
  const refreshAllData = useCallback(() => {
    setCustomers(dbService.getCustomers());
    setTransactions(dbService.getTransactions());
    setPayments(dbService.getPayments());
    setNetworks(dbService.getNetworks());
    setPackages(dbService.getPackages());
    setSettings(dbService.getSettings());
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Financial aggregates for global header
  const activeTxns = transactions.filter((t) => t.status === 'ACTIVE');
  const totalProfitPaisa = activeTxns.reduce((sum, t) => sum + t.profitPaisa, 0);
  const totalLossPaisa = activeTxns.reduce((sum, t) => sum + t.lossPaisa, 0);
  const totalNetProfitPaisa = totalProfitPaisa - totalLossPaisa;
  const totalUdhaarPaisa = customers.reduce((sum, c) => sum + c.totalOutstandingPaisa, 0);
  const pendingUdhaarCount = customers.filter((c) => c.totalOutstandingPaisa > 0).length;

  const handleToggleLanguage = () => {
    const nextLang = settings.language === 'en' ? 'ur' : 'en';
    const updated = dbService.updateSettings({ language: nextLang });
    setSettings(updated);
    showToast(nextLang === 'ur' ? 'اردو زبان منتخب کی گئی' : 'Switched to English');
  };

  return (
    <div 
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white ${
        settings.language === 'ur' ? 'font-urdu' : ''
      }`}
      dir={settings.language === 'ur' ? 'rtl' : 'ltr'}
    >
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-2xl bg-blue-600 text-white font-bold text-xs sm:text-sm shadow-2xl animate-fade-in flex items-center gap-2 border border-blue-400">
          <span>{toast}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        settings={settings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalNetProfitPaisa={totalNetProfitPaisa}
        totalUdhaarPaisa={totalUdhaarPaisa}
        onOpenNewSale={() => setActiveTab('newsale')}
        onToggleLanguage={handleToggleLanguage}
      />

      {/* Body Area with Desktop Sidebar & Main Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation */}
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingUdhaarCount={pendingUdhaarCount}
          isUrdu={settings.language === 'ur'}
        />

        {/* Content View Container */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 pb-24 lg:pb-12">
          {activeTab === 'dashboard' && (
            <DashboardView
              customers={customers}
              transactions={transactions}
              payments={payments}
              settings={settings}
              setActiveTab={setActiveTab}
              onOpenReceivePayment={(cust) => setPaymentCustomer(cust)}
            />
          )}

          {activeTab === 'newsale' && (
            <NewSaleView
              customers={customers}
              packages={packages}
              settings={settings}
              onSaleSaved={(newTxn) => {
                refreshAllData();
                showToast(`Sale #${newTxn.id} saved successfully!`);
              }}
              onCustomerAdded={(newCust) => {
                refreshAllData();
                showToast(`Customer "${newCust.name}" registered!`);
              }}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={customers}
              transactions={transactions}
              payments={payments}
              settings={settings}
              onRefreshData={refreshAllData}
              onOpenReceivePayment={(cust) => setPaymentCustomer(cust)}
            />
          )}

          {activeTab === 'udhaar' && (
            <UdhaarView
              customers={customers}
              payments={payments}
              settings={settings}
              onRefreshData={refreshAllData}
              onOpenReceivePayment={(cust) => setPaymentCustomer(cust)}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              transactions={transactions}
              settings={settings}
              onRefreshData={refreshAllData}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              transactions={transactions}
              settings={settings}
            />
          )}

          {activeTab === 'networks' && (
            <NetworksView
              networks={networks}
              transactions={transactions}
              settings={settings}
            />
          )}

          {activeTab === 'backup' && (
            <BackupView
              settings={settings}
              onRefreshData={refreshAllData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              networks={networks}
              packages={packages}
              onRefreshData={refreshAllData}
            />
          )}
        </main>
      </div>

      {/* Global Udhaar Payment Modal */}
      {paymentCustomer && (
        <PaymentModal
          customer={paymentCustomer}
          settings={settings}
          onClose={() => setPaymentCustomer(null)}
          onPaymentSuccess={() => {
            refreshAllData();
            showToast(`Udhaar payment received from ${paymentCustomer.name}!`);
          }}
        />
      )}
    </div>
  );
}
