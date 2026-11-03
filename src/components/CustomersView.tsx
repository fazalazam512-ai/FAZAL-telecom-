import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit, 
  Trash2, 
  Wallet, 
  History, 
  DollarSign, 
  FileText,
  AlertTriangle,
  ArrowDownLeft,
  X,
  ExternalLink
} from 'lucide-react';
import { Customer, Transaction, Payment, AppSettings } from '../types';
import { formatPKR, formatDateOnly, formatDateTime, getTodayDateString } from '../utils/financial';
import { dbService } from '../services/db';

interface CustomersViewProps {
  customers: Customer[];
  transactions: Transaction[];
  payments: Payment[];
  settings: AppSettings;
  onRefreshData: () => void;
  onOpenReceivePayment: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  transactions,
  payments,
  settings,
  onRefreshData,
  onOpenReceivePayment,
}) => {
  const isUrdu = settings.language === 'ur';
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showStatementCustomer, setShowStatementCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDate, setFormDate] = useState(getTodayDateString());
  const [formNotes, setFormNotes] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setFormDate(getTodayDateString());
    setFormNotes('');
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormAddress(c.address || '');
    setFormDate(c.registrationDate || getTodayDateString());
    setFormNotes(c.notes || '');
    setShowAddEditModal(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    if (editingCustomer) {
      dbService.updateCustomer(editingCustomer.id, {
        name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
        registrationDate: formDate,
        notes: formNotes.trim(),
      });
    } else {
      dbService.addCustomer({
        name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
        registrationDate: formDate,
        notes: formNotes.trim(),
      });
    }

    setShowAddEditModal(false);
    onRefreshData();
  };

  const handleDeleteConfirm = () => {
    if (!deletingCustomer) return;
    const res = dbService.deleteCustomer(deletingCustomer.id);
    if (!res.success) {
      setDeleteErrorMessage(res.message || 'Cannot delete customer.');
    } else {
      setDeletingCustomer(null);
      setDeleteErrorMessage('');
      onRefreshData();
    }
  };

  // Get customer specific transactions and payments for ledger statement
  const getCustomerTransactions = (customerId: string) => {
    return transactions.filter((t) => t.customerId === customerId);
  };

  const getCustomerPayments = (customerId: string) => {
    return payments.filter((p) => p.customerId === customerId);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            {isUrdu ? 'کسٹمر مینجمنٹ و کھاتہ' : 'Customer Ledger Management'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {isUrdu
              ? 'گاہکوں کا اندراج، ادھار کی تفصیل، خریداری اور ادائیگیوں کی مکمل ہسٹری'
              : 'Add customers, view credit balance, purchase history, and repayment records'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-600/30 transition transform active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isUrdu ? 'نیا کسٹمر بنائیں' : '+ Add Customer'}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder={isUrdu ? 'کسٹمر کا نام، موبائل نمبر یا پتہ تلاش کریں...' : 'Search by customer name, mobile number, or address...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500 shadow-inner transition"
        />
      </div>

      {/* Customers Cards / Table Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 text-sm">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="font-semibold">{isUrdu ? 'کوئی کسٹمر نہیں ملا' : 'No customers found matching your search'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                {/* Top Name & Udhaar Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-base text-white">{c.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-blue-400" />
                      <span>{c.phone}</span>
                    </div>
                  </div>

                  {c.totalOutstandingPaisa > 0 ? (
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-xl text-xs font-black font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {formatPKR(c.totalOutstandingPaisa, settings.currencySymbol)}
                      </span>
                      <span className="block text-[10px] text-amber-500/80 font-semibold mt-0.5">
                        {isUrdu ? 'ادھار باقی' : 'Pending Udhaar'}
                      </span>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {isUrdu ? 'بے باق' : 'Clear'}
                    </span>
                  )}
                </div>

                {/* Address & Date */}
                {c.address && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{c.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                  <Calendar className="w-3 h-3 text-slate-600" />
                  <span>Reg: {c.registrationDate || '-'}</span>
                </div>

                {/* Summary Counters */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Total Purchases</span>
                    <span className="font-bold font-mono text-slate-200">
                      {formatPKR(c.totalSalesPaisa, settings.currencySymbol)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Total Paid</span>
                    <span className="font-bold font-mono text-teal-400">
                      {formatPKR(c.totalPaidPaisa, settings.currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-1.5">
                <button
                  onClick={() => setShowStatementCustomer(c)}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition"
                  title="View Purchase & Payment History"
                >
                  <History className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isUrdu ? 'ہسٹری' : 'History'}</span>
                </button>

                {c.totalOutstandingPaisa > 0 && (
                  <button
                    onClick={() => onOpenReceivePayment(c)}
                    className="py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow transition active:scale-95"
                  >
                    {isUrdu ? 'وصولی' : 'Receive'}
                  </button>
                )}

                <button
                  onClick={() => handleOpenEdit(c)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                  title="Edit Customer"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setDeleteErrorMessage('');
                    setDeletingCustomer(c);
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                  title="Delete Customer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCustomer}
            className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                {editingCustomer
                  ? (isUrdu ? 'کسٹمر میں ترمیم کریں' : 'Edit Customer Profile')
                  : (isUrdu ? 'نیا کسٹمر رجسٹریشن' : 'New Customer Registration')}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddEditModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {isUrdu ? 'کسٹمر کا مکمل نام' : 'Customer Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Muhammad Imran"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {isUrdu ? 'موبائل نمبر' : 'Mobile Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {isUrdu ? 'پتہ / دکان' : 'Address / Location'}
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. Shop # 14, Main Bazar"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {isUrdu ? 'رجسٹریشن کی تاریخ' : 'Registration Date'}
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {isUrdu ? 'نوٹ / تفصیل' : 'Notes / Remarks'}
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Regular customer, pays weekly..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddEditModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30"
              >
                {editingCustomer ? 'Update Profile' : 'Register Customer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Statement & Ledger Modal (Module 3 requirement) */}
      {showStatementCustomer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  {showStatementCustomer.name} - {isUrdu ? 'کھاتہ اسٹیٹمنٹ' : 'Customer Account Statement'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">{showStatementCustomer.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowStatementCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Balances Banner */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Purchases</span>
                <span className="text-sm sm:text-base font-black font-mono text-white">
                  {formatPKR(showStatementCustomer.totalSalesPaisa, settings.currencySymbol)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Repaid</span>
                <span className="text-sm sm:text-base font-black font-mono text-teal-400">
                  {formatPKR(showStatementCustomer.totalPaidPaisa, settings.currencySymbol)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block">Current Balance</span>
                <span className="text-sm sm:text-base font-black font-mono text-amber-400">
                  {formatPKR(showStatementCustomer.totalOutstandingPaisa, settings.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Purchase History */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-400" />
                {isUrdu ? 'خریداری کی تفصیل (Sales History)' : 'Purchase & Package Transactions'}
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {getCustomerTransactions(showStatementCustomer.id).length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">No recorded sales for this customer yet.</p>
                ) : (
                  getCustomerTransactions(showStatementCustomer.id).map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">
                          {t.network} - {t.packageName}
                        </div>
                        <div className="text-[10px] text-slate-400">{formatDateTime(t.date)}</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-white">
                          {formatPKR(t.salePricePaisa, settings.currencySymbol)}
                        </div>
                        {t.remainingBalancePaisa > 0 && (
                          <div className="text-[10px] text-amber-400 font-bold">
                            Udhaar: {formatPKR(t.remainingBalancePaisa, settings.currencySymbol)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment History */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-teal-400" />
                {isUrdu ? 'ادھار وصولی کی تفصیل (Payment History)' : 'Udhaar Repayment Receipts'}
              </h4>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {getCustomerPayments(showStatementCustomer.id).length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">No repayment records yet.</p>
                ) : (
                  getCustomerPayments(showStatementCustomer.id).map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-teal-950/20 border border-teal-800/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-teal-300">
                          Received via {p.paymentMethod}
                        </div>
                        <div className="text-[10px] text-slate-400">{formatDateTime(p.date)}</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-teal-400">
                          +{formatPKR(p.amountPaisa, settings.currencySymbol)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Bal: {formatPKR(p.newBalancePaisa, settings.currencySymbol)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStatementCustomer(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Delete Customer Confirmation</h3>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to delete customer <strong className="text-white">"{deletingCustomer.name}"</strong>?
            </p>

            {deleteErrorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-400 text-xs">
                {deleteErrorMessage}
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow"
              >
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
