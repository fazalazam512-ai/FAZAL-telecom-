import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowDownLeft, 
  Plus, 
  Search, 
  Phone, 
  Calendar, 
  CheckCircle, 
  History, 
  Clock, 
  DollarSign, 
  UserCheck, 
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { Customer, Payment, AppSettings } from '../types';
import { formatPKR, formatDateOnly, formatDateTime, rupeesToPaisa, getTodayDateString } from '../utils/financial';
import { dbService } from '../services/db';

interface UdhaarViewProps {
  customers: Customer[];
  payments: Payment[];
  settings: AppSettings;
  onRefreshData: () => void;
  onOpenReceivePayment: (customer: Customer) => void;
}

export const UdhaarView: React.FC<UdhaarViewProps> = ({
  customers,
  payments,
  settings,
  onRefreshData,
  onOpenReceivePayment,
}) => {
  const isUrdu = settings.language === 'ur';
  const [activeTab, setActiveTab] = useState<'debtors' | 'paymentsHistory'>('debtors');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Manual Add Udhaar modal
  const [showAddUdhaarModal, setShowAddUdhaarModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [manualAmountRs, setManualAmountRs] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [manualError, setManualError] = useState('');

  // 1. Calculations
  const totalUdhaarPaisa = customers.reduce((sum, c) => sum + c.totalOutstandingPaisa, 0);
  const totalPaymentsReceivedPaisa = payments.reduce((sum, p) => sum + p.amountPaisa, 0);
  
  // Customers with pending Udhaar
  const debtors = customers
    .filter((c) => c.totalOutstandingPaisa > 0)
    .sort((a, b) => b.totalOutstandingPaisa - a.totalOutstandingPaisa);

  const filteredDebtors = debtors.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const filteredPayments = payments.filter(
    (p) =>
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSaveManualUdhaar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setManualError('Please select a customer.');
      return;
    }
    const amountPaisa = rupeesToPaisa(manualAmountRs);
    if (amountPaisa <= 0) {
      setManualError('Amount must be greater than 0.');
      return;
    }

    dbService.addManualUdhaar(selectedCustomerId, amountPaisa, manualReason);
    setShowAddUdhaarModal(false);
    setSelectedCustomerId('');
    setManualAmountRs('');
    setManualReason('');
    setManualError('');
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Total Outstanding KPI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border border-amber-500/40 shadow-xl text-white">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {isUrdu ? 'ادھار کھاتہ و قرضہ مینجمنٹ' : 'Udhaar Credit Ledger Management'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            {isUrdu
              ? 'صحیح حساب کے ساتھ ادھار درج کریں اور وصولی کریں۔ وصولی سے نئی سیل درج نہیں ہوتی۔'
              : 'Record customer credits & debt repayments. Payments reduce debt without adding fake sales.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddUdhaarModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isUrdu ? 'نیا ادھار درج کریں' : '+ Add Udhaar'}</span>
          </button>
        </div>
      </div>

      {/* Dual Big Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {isUrdu ? 'کل بقایا ادھار رقم' : 'Total Outstanding Udhaar'}
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-1">
              {formatPKR(totalUdhaarPaisa, settings.currencySymbol)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {debtors.length} {isUrdu ? 'گاہکوں کے ذمے ہے' : 'customers with pending balance'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-teal-500/30 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              {isUrdu ? 'کل وصول شدہ ادھار' : 'Total Payments Recovered'}
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-teal-400 mt-1">
              {formatPKR(totalPaymentsReceivedPaisa, settings.currencySymbol)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {payments.length} {isUrdu ? 'وصولیاں ریکارڈ ہوئیں' : 'total recovery receipts'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('debtors')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'debtors'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{isUrdu ? 'ادھار دار گاہک' : 'Active Debtors'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-white">
              {debtors.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('paymentsHistory')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'paymentsHistory'
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{isUrdu ? 'ادائیگیوں کی ہسٹری' : 'Payment History'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-white">
              {payments.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={isUrdu ? 'تلاش کریں...' : 'Search by name or note...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Tab 1: Active Debtors List */}
      {activeTab === 'debtors' && (
        <div className="space-y-3">
          {filteredDebtors.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-sm text-slate-300">
                {isUrdu ? 'کوئی بقایا ادھار نہیں ہے!' : 'All Udhaar cleared! No active debtors.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDebtors.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-lg hover:border-amber-500/60 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-base text-white">{c.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-blue-400" />
                          <span>{c.phone}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black font-mono text-amber-400">
                          {formatPKR(c.totalOutstandingPaisa, settings.currencySymbol)}
                        </div>
                        <span className="text-[10px] text-amber-500/80 font-bold uppercase">
                          {isUrdu ? 'بقایا واجب الادا' : 'Remaining'}
                        </span>
                      </div>
                    </div>

                    {c.address && (
                      <p className="text-xs text-slate-400 truncate mb-2">{c.address}</p>
                    )}

                    <div className="p-2.5 rounded-xl bg-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between mb-4">
                      <span>Total Sales: {formatPKR(c.totalSalesPaisa, settings.currencySymbol)}</span>
                      <span>Paid: {formatPKR(c.totalPaidPaisa, settings.currencySymbol)}</span>
                    </div>
                  </div>

                  {/* Receive Payment Action Trigger */}
                  <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => onOpenReceivePayment(c)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>{isUrdu ? 'ادھار وصول کریں (Receive)' : 'Receive Payment (Full / Partial)'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Payments History Ledger */}
      {activeTab === 'paymentsHistory' && (
        <div className="space-y-3">
          {filteredPayments.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
              <History className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p>{isUrdu ? 'کوئی ادائیگی ریکارڈ نہیں ملی' : 'No payments found matching criteria.'}</p>
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="p-3.5">Payment ID</th>
                      <th className="p-3.5">Date & Time</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Amount Received</th>
                      <th className="p-3.5">Method</th>
                      <th className="p-3.5">Previous Balance</th>
                      <th className="p-3.5">New Balance</th>
                      <th className="p-3.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-mono text-slate-400">{p.id}</td>
                        <td className="p-3.5 whitespace-nowrap">{formatDateTime(p.date)}</td>
                        <td className="p-3.5 font-bold text-white">{p.customerName}</td>
                        <td className="p-3.5 font-mono font-bold text-teal-400 text-sm">
                          +{formatPKR(p.amountPaisa, settings.currencySymbol)}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">
                          {formatPKR(p.previousBalancePaisa, settings.currencySymbol)}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-amber-400">
                          {formatPKR(p.newBalancePaisa, settings.currencySymbol)}
                        </td>
                        <td className="p-3.5 text-slate-400 max-w-xs truncate">{p.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Add Udhaar Modal */}
      {showAddUdhaarModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveManualUdhaar}
            className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                {isUrdu ? 'نیا ادھار درج کریں' : 'Add Manual Udhaar / Credit Entry'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddUdhaarModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {manualError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-400 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {isUrdu ? 'کسٹمر منتخب کریں' : 'Select Customer *'}
                </label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - Current Udhaar: {formatPKR(c.totalOutstandingPaisa, settings.currencySymbol)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {isUrdu ? 'ادھار کی رقم (Rs)' : 'Udhaar Amount (Rs) *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-xs">Rs</span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={manualAmountRs}
                    onChange={(e) => setManualAmountRs(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {isUrdu ? 'ادھار کی وجہ / تفصیل' : 'Reason / Notes'}
                </label>
                <input
                  type="text"
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="e.g. Emergency load, cash borrowed..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAddUdhaarModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow"
              >
                Save Udhaar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
