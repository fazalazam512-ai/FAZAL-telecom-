import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Activity, 
  FileSpreadsheet, 
  Filter, 
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import { Transaction, AppSettings, NetworkName } from '../types';
import { formatPKR, paisaToRupees, formatDateOnly, getTodayDateString } from '../utils/financial';
import { exportTelecomExcelBackup } from '../services/excelExport';

interface ReportsViewProps {
  transactions: Transaction[];
  settings: AppSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions, settings }) => {
  const isUrdu = settings.language === 'ur';

  // Active Tab
  const [reportTab, setReportTab] = useState<'daily' | 'monthly' | 'yearly'>('daily');

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedMonth, setSelectedMonth] = useState<string>(getTodayDateString().substring(0, 7)); // 'YYYY-MM'
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [selectedNetwork, setSelectedNetwork] = useState<string>('ALL');

  // Filter transactions based on active tab and network
  const filteredTxns = transactions.filter((t) => {
    if (t.status === 'VOIDED') return false;

    // Network filter
    if (selectedNetwork !== 'ALL' && t.network !== selectedNetwork) {
      return false;
    }

    // Timeframe filter
    const txnDateOnly = t.date.split('T')[0];
    if (reportTab === 'daily') {
      return txnDateOnly === selectedDate;
    } else if (reportTab === 'monthly') {
      return txnDateOnly.substring(0, 7) === selectedMonth;
    } else if (reportTab === 'yearly') {
      return txnDateOnly.substring(0, 4) === selectedYear;
    }
    return true;
  });

  // Calculate Metrics
  const totalSalesPaisa = filteredTxns.reduce((sum, t) => sum + t.salePricePaisa, 0);
  const totalCostPaisa = filteredTxns.reduce((sum, t) => sum + t.costPricePaisa, 0);
  const totalProfitPaisa = filteredTxns.reduce((sum, t) => sum + t.profitPaisa, 0);
  const totalLossPaisa = filteredTxns.reduce((sum, t) => sum + t.lossPaisa, 0);
  const netProfitPaisa = totalProfitPaisa - totalLossPaisa;
  const totalEntries = filteredTxns.length;

  // Chart data generation
  const getChartData = () => {
    if (reportTab === 'daily') {
      // Group by hour or network for the selected day
      const networks = ['Zong', 'Jazz', 'Ufone', 'Telenor', 'Other'];
      return networks.map((net) => {
        const netTxns = filteredTxns.filter((t) => t.network === net);
        return {
          name: net,
          sales: paisaToRupees(netTxns.reduce((s, t) => s + t.salePricePaisa, 0)),
          cost: paisaToRupees(netTxns.reduce((s, t) => s + t.costPricePaisa, 0)),
          profit: paisaToRupees(netTxns.reduce((s, t) => s + t.profitPaisa, 0)),
        };
      });
    } else if (reportTab === 'monthly') {
      // Group by days of the selected month
      const daysInMonth: Record<string, { name: string; day: string; sales: number; cost: number; profit: number }> = {};
      const [year, month] = selectedMonth.split('-').map(Number);
      const totalDays = new Date(year, month, 0).getDate();

      for (let d = 1; d <= totalDays; d++) {
        const dStr = String(d).padStart(2, '0');
        daysInMonth[dStr] = { name: `${d}`, day: `${d}`, sales: 0, cost: 0, profit: 0 };
      }

      filteredTxns.forEach((t) => {
        const day = t.date.substring(8, 10);
        if (daysInMonth[day]) {
          daysInMonth[day].sales += paisaToRupees(t.salePricePaisa);
          daysInMonth[day].cost += paisaToRupees(t.costPricePaisa);
          daysInMonth[day].profit += paisaToRupees(t.profitPaisa);
        }
      });

      return Object.values(daysInMonth);
    } else {
      // Group by 12 months for the selected year
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.map((m, idx) => {
        const mStr = String(idx + 1).padStart(2, '0');
        const mTxns = filteredTxns.filter((t) => t.date.substring(5, 7) === mStr);
        return {
          name: m,
          sales: paisaToRupees(mTxns.reduce((s, t) => s + t.salePricePaisa, 0)),
          cost: paisaToRupees(mTxns.reduce((s, t) => s + t.costPricePaisa, 0)),
          profit: paisaToRupees(mTxns.reduce((s, t) => s + t.profitPaisa, 0)),
        };
      });
    }
  };

  const chartData = getChartData();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            {isUrdu ? 'نفع و نقصان رپورٹ (Profit & Loss Report)' : 'Profit & Loss Financial Report'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {isUrdu
              ? 'روزانہ، ماہانہ اور سالانہ آمدن، لاگت اور خالص منافع کا تفصیلی جائزہ'
              : 'Detailed breakdown of revenue, direct costs, net profits, and network margins'}
          </p>
        </div>

        <button
          onClick={() => exportTelecomExcelBackup()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-900/40 transition active:scale-95 self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{isUrdu ? 'رپورٹ ایکسل میں ڈاؤن لوڈ کریں' : 'Export Excel Report'}</span>
        </button>
      </div>

      {/* Tabs (DAILY, MONTHLY, YEARLY) & Filters */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Main 3 Tabs */}
          <div className="flex items-center bg-slate-800 p-1.5 rounded-2xl border border-slate-700 self-start">
            {(['daily', 'monthly', 'yearly'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setReportTab(tab)}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition ${
                  reportTab === tab
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isUrdu
                  ? tab === 'daily'
                    ? 'روزانہ (Daily)'
                    : tab === 'monthly'
                    ? 'ماہانہ (Monthly)'
                    : 'سالانہ (Yearly)'
                  : tab}
              </button>
            ))}
          </div>

          {/* Network Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-400" />
              {isUrdu ? 'نیٹ ورک:' : 'Network:'}
            </span>
            <select
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Networks (تمام)</option>
              <option value="Zong">Zong</option>
              <option value="Jazz">Jazz</option>
              <option value="Ufone">Ufone</option>
              <option value="Telenor">Telenor</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Date / Month / Year Dynamic Pickers */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3">
          <Calendar className="w-4 h-4 text-slate-400" />
          {reportTab === 'daily' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-300 font-semibold">{isUrdu ? 'تاریخ:' : 'Select Date:'}</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {reportTab === 'monthly' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-300 font-semibold">{isUrdu ? 'مہینہ:' : 'Select Month:'}</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {reportTab === 'yearly' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-300 font-semibold">{isUrdu ? 'سال:' : 'Select Year:'}</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 6 Core Report Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Cost */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            {isUrdu ? 'کل لاگت' : 'Total Cost'}
          </span>
          <div className="text-base sm:text-lg font-black font-mono text-slate-300">
            {formatPKR(totalCostPaisa, settings.currencySymbol)}
          </div>
        </div>

        {/* Total Sales */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            {isUrdu ? 'کل فروخت' : 'Total Sales'}
          </span>
          <div className="text-base sm:text-lg font-black font-mono text-white">
            {formatPKR(totalSalesPaisa, settings.currencySymbol)}
          </div>
        </div>

        {/* Total Profit */}
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
            {isUrdu ? 'کل منافع' : 'Total Profit'}
          </span>
          <div className="text-base sm:text-lg font-black font-mono text-emerald-400">
            {formatPKR(totalProfitPaisa, settings.currencySymbol)}
          </div>
        </div>

        {/* Total Loss */}
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 shadow">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
            {isUrdu ? 'کل نقصان' : 'Total Loss'}
          </span>
          <div className="text-base sm:text-lg font-black font-mono text-rose-400">
            {formatPKR(totalLossPaisa, settings.currencySymbol)}
          </div>
        </div>

        {/* Net Profit */}
        <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/40 shadow">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block mb-1">
            {isUrdu ? 'خالص منافع' : 'Net Profit'}
          </span>
          <div className={`text-base sm:text-lg font-black font-mono ${netProfitPaisa >= 0 ? 'text-blue-300' : 'text-rose-400'}`}>
            {formatPKR(netProfitPaisa, settings.currencySymbol)}
          </div>
        </div>

        {/* Total Entries */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            {isUrdu ? 'کل سودے' : 'Total Entries'}
          </span>
          <div className="text-base sm:text-lg font-black font-mono text-white">
            {totalEntries}
          </div>
        </div>
      </div>

      {/* Interactive Report Charts */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          {reportTab === 'daily'
            ? 'Network Breakdown for Selected Date'
            : reportTab === 'monthly'
            ? 'Daily Sales & Margin for Month'
            : 'Monthly Performance Comparison'}
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Comparing Sales vs Cost vs Net Profit
        </p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `Rs ${val}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                formatter={(val: any) => [`Rs ${Number(val).toLocaleString()}`, '']}
              />
              <Legend />
              <Bar dataKey="sales" name="Sales (Rs)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" name="Cost (Rs)" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit (Rs)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction Breakdown Table for Selected Report Filter */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <h3 className="text-base font-bold text-white mb-3">
          {isUrdu ? 'فلٹر شدہ اندراجات کی فہرست' : `Detailed Records (${filteredTxns.length} entries)`}
        </h3>

        {filteredTxns.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No transactions recorded for the chosen filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Network</th>
                  <th className="p-3">Package</th>
                  <th className="p-3">Cost Price</th>
                  <th className="p-3">Sale Price</th>
                  <th className="p-3">Profit / Loss</th>
                  <th className="p-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTxns.slice(0, 15).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white">{t.customerName}</td>
                    <td className="p-3 font-semibold">{t.network}</td>
                    <td className="p-3 text-slate-400">{t.packageName}</td>
                    <td className="p-3 font-mono">{formatPKR(t.costPricePaisa, settings.currencySymbol)}</td>
                    <td className="p-3 font-mono font-bold text-white">{formatPKR(t.salePricePaisa, settings.currencySymbol)}</td>
                    <td className="p-3 font-mono font-bold">
                      {t.profitPaisa > 0 && <span className="text-emerald-400">+{formatPKR(t.profitPaisa, settings.currencySymbol)}</span>}
                      {t.lossPaisa > 0 && <span className="text-rose-400">-{formatPKR(t.lossPaisa, settings.currencySymbol)}</span>}
                      {t.profitPaisa === 0 && t.lossPaisa === 0 && <span className="text-slate-400">Rs 0</span>}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.paymentStatus === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : t.paymentStatus === 'PARTIAL'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {t.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
