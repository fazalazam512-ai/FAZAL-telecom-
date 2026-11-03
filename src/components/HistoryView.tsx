import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Calendar, 
  Phone, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Save,
  RotateCcw,
  Tag
} from 'lucide-react';
import { Transaction, AppSettings, NetworkName, PackageType } from '../types';
import { formatPKR, formatDateTime, rupeesToPaisa, paisaToRupees, calculateProfitLoss, calculateRemainingBalance } from '../utils/financial';
import { dbService } from '../services/db';

interface HistoryViewProps {
  transactions: Transaction[];
  settings: AppSettings;
  onRefreshData: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  transactions,
  settings,
  onRefreshData,
}) => {
  const isUrdu = settings.language === 'ur';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [networkFilter, setNetworkFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [voidingTxn, setVoidingTxn] = useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = useState('Mistake in entry');

  // Edit form state
  const [editCostRs, setEditCostRs] = useState('');
  const [editSaleRs, setEditSaleRs] = useState('');
  const [editReceivedRs, setEditReceivedRs] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const filteredTransactions = transactions.filter((t) => {
    // Search
    const matchesSearch =
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.customerPhone && t.customerPhone.includes(searchQuery)) ||
      t.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());

    // Network
    const matchesNetwork = networkFilter === 'ALL' || t.network === networkFilter;

    // Status
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

    // Date
    const matchesDate = !dateFilter || t.date.split('T')[0] === dateFilter;

    return matchesSearch && matchesNetwork && matchesStatus && matchesDate;
  });

  const handleOpenEdit = (t: Transaction) => {
    setEditingTxn(t);
    setEditCostRs(String(paisaToRupees(t.costPricePaisa)));
    setEditSaleRs(String(paisaToRupees(t.salePricePaisa)));
    setEditReceivedRs(String(paisaToRupees(t.amountReceivedPaisa)));
    setEditNotes(t.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTxn) return;

    const costPaisa = rupeesToPaisa(editCostRs);
    const salePaisa = rupeesToPaisa(editSaleRs);
    const receivedPaisa = rupeesToPaisa(editReceivedRs);

    dbService.updateTransaction(editingTxn.id, {
      costPricePaisa: costPaisa,
      salePricePaisa: salePaisa,
      amountReceivedPaisa: receivedPaisa,
      notes: editNotes.trim(),
    });

    setEditingTxn(null);
    onRefreshData();
  };

  const handleConfirmVoid = () => {
    if (!voidingTxn) return;
    dbService.voidTransaction(voidingTxn.id, voidReason);
    setVoidingTxn(null);
    setVoidReason('');
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-500" />
            {isUrdu ? 'تمام محفوظ شدہ اندراجات (Entry History)' : 'Transaction History Ledger'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {isUrdu
              ? 'ہر ٹرانزیکشن کی مکمل تفصیل، ترمیم، منسوخی اور فلٹرز'
              : 'Audit-ready record of all sales, load slots, cost prices, margins, and void statuses'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-300">
            Total: {filteredTransactions.length} records
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={isUrdu ? 'گاہک، فون، پیکج تلاش کریں...' : 'Search customer, phone, package...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Network Filter */}
          <div>
            <select
              value={networkFilter}
              onChange={(e) => setNetworkFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Networks (تمام نیٹ ورک)</option>
              <option value="Zong">Zong</option>
              <option value="Jazz">Jazz</option>
              <option value="Ufone">Ufone</option>
              <option value="Telenor">Telenor</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active (فعال)</option>
              <option value="VOIDED">Voided (منسوخ)</option>
            </select>

            {(searchQuery || networkFilter !== 'ALL' || statusFilter !== 'ALL' || dateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setNetworkFilter('ALL');
                  setStatusFilter('ALL');
                  setDateFilter('');
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                title="Clear Filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-sm text-slate-300">No transactions found</p>
          <p className="text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Network & Package</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Cost Price</th>
                  <th className="p-3.5">Sale Price</th>
                  <th className="p-3.5">Profit or Loss</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5">Remaining</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredTransactions.map((t) => {
                  const isVoided = t.status === 'VOIDED';

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-800/40 transition ${isVoided ? 'opacity-50 line-through' : ''}`}
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-white">{t.customerName}</div>
                        {t.customerPhone && (
                          <div className="text-[11px] text-slate-400 font-mono">{t.customerPhone}</div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            t.network === 'Zong'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : t.network === 'Jazz'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : t.network === 'Ufone'
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              : t.network === 'Telenor'
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                              : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          }`}>
                            {t.network}
                          </span>
                          <span className="font-semibold text-slate-200">
                            {t.packageName === 'Custom Package' ? (t.customPackageTitle || 'Custom') : t.packageName}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-slate-400">
                        {formatDateTime(t.date)}
                      </td>

                      <td className="p-3.5 font-mono text-slate-300">
                        {formatPKR(t.costPricePaisa, settings.currencySymbol)}
                      </td>

                      <td className="p-3.5 font-mono font-bold text-white">
                        {formatPKR(t.salePricePaisa, settings.currencySymbol)}
                      </td>

                      <td className="p-3.5 font-mono font-bold">
                        {t.profitPaisa > 0 ? (
                          <span className="text-emerald-400">+{formatPKR(t.profitPaisa, settings.currencySymbol)}</span>
                        ) : t.lossPaisa > 0 ? (
                          <span className="text-rose-400">-{formatPKR(t.lossPaisa, settings.currencySymbol)}</span>
                        ) : (
                          <span className="text-slate-400">Rs 0</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : t.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {t.paymentStatus}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono font-bold">
                        {t.remainingBalancePaisa > 0 ? (
                          <span className="text-amber-400">{formatPKR(t.remainingBalancePaisa, settings.currencySymbol)}</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        {!isVoided ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(t)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="Edit Entry"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setVoidingTxn(t)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                              title="Void / Delete Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-400/80 uppercase">
                            VOIDED
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTxn && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-400" />
                Edit Transaction #{editingTxn.id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTxn(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-800 text-xs">
                <div className="font-bold text-white">{editingTxn.customerName}</div>
                <div className="text-slate-400">{editingTxn.network} - {editingTxn.packageName}</div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Cost Price (Rs)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={editCostRs}
                  onChange={(e) => setEditCostRs(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Sale Price (Rs)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={editSaleRs}
                  onChange={(e) => setEditSaleRs(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Amount Received (Rs)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={editReceivedRs}
                  onChange={(e) => setEditReceivedRs(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Notes / Reason</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Reason for change..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setEditingTxn(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Void / Delete Confirmation Modal */}
      {voidingTxn && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Void Transaction #{voidingTxn.id}</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Voiding this transaction will reverse its sales, profit calculations, and any associated customer Udhaar balance.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Void Reason *</label>
              <input
                type="text"
                required
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="e.g. Wrong customer, cancelled load..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setVoidingTxn(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
