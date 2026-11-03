import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Wallet, 
  ArrowDownLeft, 
  Activity, 
  Calendar, 
  BarChart, 
  PlusCircle,
  Eye,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { Customer, Transaction, Payment, AppSettings, ViewTab } from '../types';
import { formatPKR, paisaToRupees, formatDateOnly } from '../utils/financial';

interface DashboardViewProps {
  customers: Customer[];
  transactions: Transaction[];
  payments: Payment[];
  settings: AppSettings;
  setActiveTab: (tab: ViewTab) => void;
  onOpenReceivePayment: (customer: Customer) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  customers,
  transactions,
  payments,
  settings,
  setActiveTab,
  onOpenReceivePayment,
}) => {
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const isUrdu = settings.language === 'ur';

  // 1. Metric Calculations
  const activeTxns = transactions.filter((t) => t.status === 'ACTIVE');
  
  const totalSalesPaisa = activeTxns.reduce((sum, t) => sum + t.salePricePaisa, 0);
  const totalCostPaisa = activeTxns.reduce((sum, t) => sum + t.costPricePaisa, 0);
  const totalProfitPaisa = activeTxns.reduce((sum, t) => sum + t.profitPaisa, 0);
  const totalLossPaisa = activeTxns.reduce((sum, t) => sum + t.lossPaisa, 0);
  const netBalancePaisa = totalProfitPaisa - totalLossPaisa;
  const totalEntries = transactions.length;
  const totalCustomers = customers.length;
  const totalUdhaarPaisa = customers.reduce((sum, c) => sum + c.totalOutstandingPaisa, 0);
  const totalPaymentsReceivedPaisa = payments.reduce((sum, p) => sum + p.amountPaisa, 0);

  // 2. Network Distribution
  const networkColors: Record<string, string> = {
    Zong: '#e11d48',
    Jazz: '#dc2626',
    Ufone: '#ea580c',
    Telenor: '#0284c7',
    Other: '#6366f1',
  };

  const networkPerformance = ['Zong', 'Jazz', 'Ufone', 'Telenor', 'Other'].map((net) => {
    const netTxns = activeTxns.filter((t) => t.network === net);
    const sales = netTxns.reduce((sum, t) => sum + t.salePricePaisa, 0);
    const profit = netTxns.reduce((sum, t) => sum + t.profitPaisa, 0);
    const cost = netTxns.reduce((sum, t) => sum + t.costPricePaisa, 0);
    return {
      name: net,
      sales: paisaToRupees(sales),
      profit: paisaToRupees(profit),
      cost: paisaToRupees(cost),
      count: netTxns.length,
      color: networkColors[net],
    };
  });

  // 3. Daily Profit trend (last 7 days)
  const getDailyTrendData = () => {
    const days: { [key: string]: { date: string; profit: number; sales: number; cost: number } } = {};
    const now = new Date();
    
    // Generate last 7 days slots
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric' });
      days[dateKey] = { date: label, profit: 0, sales: 0, cost: 0 };
    }

    activeTxns.forEach((t) => {
      const dateKey = t.date.split('T')[0];
      if (days[dateKey]) {
        days[dateKey].profit += paisaToRupees(t.profitPaisa);
        days[dateKey].sales += paisaToRupees(t.salePricePaisa);
        days[dateKey].cost += paisaToRupees(t.costPricePaisa);
      }
    });

    return Object.values(days);
  };

  // 4. Monthly Profit trend (last 6 months)
  const getMonthlyTrendData = () => {
    const months: { [key: string]: { month: string; profit: number; sales: number; cost: number } } = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-PK', { month: 'short' });
      months[monthKey] = { month: label, profit: 0, sales: 0, cost: 0 };
    }

    activeTxns.forEach((t) => {
      const monthKey = t.date.substring(0, 7);
      if (months[monthKey]) {
        months[monthKey].profit += paisaToRupees(t.profitPaisa);
        months[monthKey].sales += paisaToRupees(t.salePricePaisa);
        months[monthKey].cost += paisaToRupees(t.costPricePaisa);
      }
    });

    return Object.values(months);
  };

  // 5. Yearly Performance
  const getYearlyTrendData = () => {
    const years: { [key: string]: { year: string; profit: number; sales: number; cost: number } } = {};
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear; y++) {
      years[String(y)] = { year: String(y), profit: 0, sales: 0, cost: 0 };
    }

    activeTxns.forEach((t) => {
      const y = t.date.substring(0, 4);
      if (years[y]) {
        years[y].profit += paisaToRupees(t.profitPaisa);
        years[y].sales += paisaToRupees(t.salePricePaisa);
        years[y].cost += paisaToRupees(t.costPricePaisa);
      }
    });

    return Object.values(years);
  };

  // Customers with pending Udhaar
  const pendingCustomers = [...customers]
    .filter((c) => c.totalOutstandingPaisa > 0)
    .sort((a, b) => b.totalOutstandingPaisa - a.totalOutstandingPaisa)
    .slice(0, 5);

  const recentTransactions = [...transactions].slice(0, 6);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-800/40 shadow-xl text-white">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {isUrdu ? 'FAZAL AZAM TELECOM ڈیش بورڈ' : 'FAZAL AZAM TELECOM Executive Dashboard'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {isUrdu
              ? 'روزانہ کی بنیاد پر ٹیلی کام سیلز، پیکجز، منافع اور ادھار کھاتہ کی درست رپورٹ'
              : 'Real-time sales, package margins, net profit & customer credit ledger overview'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('newsale')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-sm shadow-lg shadow-emerald-900/50 transition transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isUrdu ? 'نیا اندراج کریں' : '+ Add New Sale'}</span>
          </button>
          <button
            onClick={() => setActiveTab('udhaar')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-amber-300 border border-amber-500/30 text-sm font-semibold transition"
          >
            <Wallet className="w-4 h-4" />
            <span>{isUrdu ? 'ادھار دیکھیں' : 'Udhaar List'}</span>
          </button>
        </div>
      </div>

      {/* 9 Core KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3.5 sm:gap-4">
        {/* 1. Total Sales */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isUrdu ? 'کل فروخت' : '1. Total Sales'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-white">
              {formatPKR(totalSalesPaisa, settings.currencySymbol)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 inline-block">
              {activeTxns.length} {isUrdu ? 'فعال سودے' : 'active sales'}
            </span>
          </div>
        </div>

        {/* 2. Total Cost */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isUrdu ? 'کل لاگت' : '2. Total Cost'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-slate-200">
              {formatPKR(totalCostPaisa, settings.currencySymbol)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 inline-block">
              {isUrdu ? 'پیکجز اور بیلنس کی اصل قیمت' : 'Cost of stock / loads'}
            </span>
          </div>
        </div>

        {/* 3. Total Profit (Green Theme) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/40 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {isUrdu ? 'کل منافع' : '3. Total Profit'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              {formatPKR(totalProfitPaisa, settings.currencySymbol)}
            </div>
            <span className="text-[11px] text-emerald-400/80 mt-0.5 inline-block">
              Profit = max(Sale - Cost, 0)
            </span>
          </div>
        </div>

        {/* 4. Total Loss (Red Theme) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-950/80 to-slate-900 border border-rose-500/40 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              {isUrdu ? 'کل نقصان' : '4. Total Loss'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-400">
              {formatPKR(totalLossPaisa, settings.currencySymbol)}
            </div>
            <span className="text-[11px] text-rose-400/80 mt-0.5 inline-block">
              Loss = max(Cost - Sale, 0)
            </span>
          </div>
        </div>

        {/* 5. Net Balance */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-950/80 to-slate-900 border border-blue-500/40 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
              {isUrdu ? 'خالص بیلنس / نیٹ پرافٹ' : '5. Net Balance'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-xl sm:text-2xl font-black font-mono ${netBalancePaisa >= 0 ? 'text-blue-300' : 'text-rose-400'}`}>
              {formatPKR(netBalancePaisa, settings.currencySymbol)}
            </div>
            <span className="text-[11px] text-blue-300/80 mt-0.5 inline-block">
              Net = Total Profit - Total Loss
            </span>
          </div>
        </div>

        {/* 6. Total Entries */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isUrdu ? 'کل اندراجات' : '6. Total Entries'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-white">
              {totalEntries}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 inline-block">
              {isUrdu ? 'تمام محفوظ شدہ ٹرانزیکشنز' : 'All recorded sales'}
            </span>
          </div>
        </div>

        {/* 7. Total Customers */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isUrdu ? 'کل کسٹمرز' : '7. Total Customers'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-white">
              {totalCustomers}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 inline-block">
              {customers.filter((c) => c.totalOutstandingPaisa > 0).length} {isUrdu ? 'ادھار دار' : 'with pending credit'}
            </span>
          </div>
        </div>

        {/* 8. Total Udhaar (Outstanding) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/80 to-slate-900 border border-amber-500/40 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {isUrdu ? 'کل بقایا ادھار' : '8. Total Udhaar'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-400">
              {formatPKR(totalUdhaarPaisa, settings.currencySymbol)}
            </div>
            <span className="text-[11px] text-amber-400/80 mt-0.5 inline-block">
              {isUrdu ? 'گاہکوں کے ذمے واجب الادا' : 'Receivable credit'}
            </span>
          </div>
        </div>

        {/* 9. Total Payments Received */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isUrdu ? 'کل وصولی ادھار' : '9. Payments Received'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-teal-400">
              {formatPKR(totalPaymentsReceivedPaisa, settings.currencySymbol)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 inline-block">
              {payments.length} {isUrdu ? 'وصولیاں درج ہوئیں' : 'repayment entries'}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section: Daily, Monthly, Yearly Profit & Network Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Trend Chart (2 columns on large screens) */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <BarChart className="w-5 h-5 text-blue-400" />
                {isUrdu ? 'منافع اور سیلز کی کارکردگی' : 'Profit & Sales Performance'}
              </h3>
              <p className="text-xs text-slate-400">
                {chartPeriod === 'daily' && (isUrdu ? 'گزشتہ 7 دنوں کا منافع' : 'Last 7 days profit & revenue')}
                {chartPeriod === 'monthly' && (isUrdu ? 'ماہانہ تقابل' : 'Monthly profit comparison')}
                {chartPeriod === 'yearly' && (isUrdu ? 'سالانہ مجموعی کارکردگی' : 'Yearly performance breakdown')}
              </p>
            </div>

            {/* Time Toggle */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 self-start sm:self-auto">
              {(['daily', 'monthly', 'yearly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                    chartPeriod === period
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isUrdu
                    ? period === 'daily'
                      ? 'روزانہ'
                      : period === 'monthly'
                      ? 'ماہانہ'
                      : 'سالانہ'
                    : period}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartPeriod === 'daily' ? (
                <AreaChart data={getDailyTrendData()}>
                  <defs>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `Rs ${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: any) => [`Rs ${Number(value).toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="sales" name="Sales (Rs)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                  <Area type="monotone" dataKey="profit" name="Profit (Rs)" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#profitGrad)" />
                </AreaChart>
              ) : chartPeriod === 'monthly' ? (
                <RechartsBarChart data={getMonthlyTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `Rs ${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: any) => [`Rs ${Number(value).toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="sales" name="Sales (Rs)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Profit (Rs)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              ) : (
                <RechartsBarChart data={getYearlyTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `Rs ${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: any) => [`Rs ${Number(value).toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="sales" name="Sales (Rs)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="cost" name="Cost (Rs)" fill="#64748b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="profit" name="Profit (Rs)" fill="#10b981" radius={[6, 6, 0, 0]} />
                </RechartsBarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Network Wise Performance Chart */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              {isUrdu ? 'نیٹ ورک کے لحاظ سے کارکردگی' : 'Network Wise Share'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {isUrdu ? 'Zong, Jazz, Ufone, Telenor کی سیلز' : 'Sales share per telecom operator'}
            </p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={networkPerformance}
                    dataKey="sales"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {networkPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(val: any) => [`Rs ${Number(val).toLocaleString()}`, 'Sales']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Network breakdown mini-list */}
          <div className="space-y-2 mt-4 pt-3 border-t border-slate-800">
            {networkPerformance.map((net) => (
              <div key={net.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: net.color }} />
                  <span className="font-semibold text-slate-300">{net.name}</span>
                  <span className="text-slate-500 text-[10px]">({net.count} txns)</span>
                </div>
                <div className="font-mono font-bold text-slate-200">
                  Rs {net.sales.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Lower Dual Widget: Top Udhaar Debtors & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Udhaar Debtors Widget */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                {isUrdu ? 'نمایاں ادھار دار' : 'Top Outstanding Udhaar'}
              </h3>
              <p className="text-xs text-slate-400">
                {isUrdu ? 'جن گاہکوں کے ذمے ادھار باقی ہے' : 'Customers with highest pending balances'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('udhaar')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <span>{isUrdu ? 'سب دیکھیں' : 'View All'}</span>
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingCustomers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              {isUrdu ? 'کوئی ادھار بقایا نہیں ہے!' : 'All customer accounts are clear! Zero outstanding balance.'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingCustomers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 transition"
                >
                  <div>
                    <div className="font-bold text-sm text-white">{c.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{c.phone}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-extrabold font-mono text-amber-400">
                        {formatPKR(c.totalOutstandingPaisa, settings.currencySymbol)}
                      </div>
                      <span className="text-[10px] text-amber-500/80 font-semibold">
                        {isUrdu ? 'واجب الادا' : 'Pending'}
                      </span>
                    </div>

                    <button
                      onClick={() => onOpenReceivePayment(c)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow transition active:scale-95"
                    >
                      {isUrdu ? 'وصولی' : 'Receive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions Feed */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                {isUrdu ? 'حالیہ سودے' : 'Recent Sales'}
              </h3>
              <p className="text-xs text-slate-400">
                {isUrdu ? 'تازہ ترین اندراجات' : 'Latest sales & package transactions'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <span>{isUrdu ? 'پوری ہسٹری' : 'Full History'}</span>
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentTransactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: networkColors[t.network] || '#6366f1' }}
                  />
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <span>{t.customerName}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">
                        {t.network} - {t.packageName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {formatDateOnly(t.date)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-white">
                    {formatPKR(t.salePricePaisa, settings.currencySymbol)}
                  </div>
                  <div className={`text-xs font-semibold ${t.profitPaisa > 0 ? 'text-emerald-400' : t.lossPaisa > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {t.profitPaisa > 0 && `+${formatPKR(t.profitPaisa, settings.currencySymbol)}`}
                    {t.lossPaisa > 0 && `-${formatPKR(t.lossPaisa, settings.currencySymbol)}`}
                    {t.profitPaisa === 0 && t.lossPaisa === 0 && 'Rs 0'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
