import React from 'react';
import { 
  Signal, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  DollarSign, 
  Layers, 
  Hash, 
  CheckCircle2,
  BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { Transaction, NetworkConfig, AppSettings, NetworkName } from '../types';
import { formatPKR, paisaToRupees } from '../utils/financial';

interface NetworksViewProps {
  networks: NetworkConfig[];
  transactions: Transaction[];
  settings: AppSettings;
}

export const NetworksView: React.FC<NetworksViewProps> = ({
  networks,
  transactions,
  settings,
}) => {
  const isUrdu = settings.language === 'ur';
  const activeTxns = transactions.filter((t) => t.status === 'ACTIVE');

  const networkNames: NetworkName[] = ['Zong', 'Jazz', 'Ufone', 'Telenor', 'Other'];

  const reports = networkNames.map((netName) => {
    const config = networks.find((n) => n.name === netName);
    const netTxns = activeTxns.filter((t) => t.network === netName);

    const totalSalesPaisa = netTxns.reduce((s, t) => s + t.salePricePaisa, 0);
    const totalCostPaisa = netTxns.reduce((s, t) => s + t.costPricePaisa, 0);
    const totalProfitPaisa = netTxns.reduce((s, t) => s + t.profitPaisa, 0);
    const totalLossPaisa = netTxns.reduce((s, t) => s + t.lossPaisa, 0);
    const netProfitPaisa = totalProfitPaisa - totalLossPaisa;
    const count = netTxns.length;
    const margin = totalSalesPaisa > 0 ? ((totalProfitPaisa / totalSalesPaisa) * 100).toFixed(1) : '0';

    return {
      name: netName,
      config,
      totalSalesPaisa,
      totalCostPaisa,
      totalProfitPaisa,
      totalLossPaisa,
      netProfitPaisa,
      count,
      margin,
    };
  });

  // Chart data
  const chartData = reports.map((r) => ({
    name: r.name,
    Sales: paisaToRupees(r.totalSalesPaisa),
    Cost: paisaToRupees(r.totalCostPaisa),
    Profit: paisaToRupees(r.totalProfitPaisa),
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Signal className="w-5 h-5 text-blue-500" />
          {isUrdu ? 'ٹیلی کام نیٹ ورک مینجمنٹ و رپورٹ' : 'Telecom Network Performance & Analytics'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          {isUrdu
            ? 'Zong, Jazz, Ufone, Telenor اور دیگر نیٹ ورکس کی فروخت، لاگت اور منافع کی مکمل تفصیل'
            : 'Dedicated performance breakdown, margin analysis, and prefix routing for all mobile carriers'}
        </p>
      </div>

      {/* Comparison Chart */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-sky-400" />
          Network Comparison (Sales vs Cost vs Profit)
        </h3>
        <p className="text-xs text-slate-400 mb-6">Visual comparison across all five telecom operator divisions</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `Rs ${val}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                formatter={(val: any) => [`Rs ${Number(val).toLocaleString()}`, '']}
              />
              <Legend />
              <Bar dataKey="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Cost" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Individual Network Reports (ZONG, JAZZ, UFONE, TELENOR, OTHER) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((r) => {
          const cfg = r.config;
          const badgeClass = cfg ? cfg.badgeBg : 'bg-slate-800 text-white';

          return (
            <div
              key={r.name}
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                {/* Header with Network Branding */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: cfg?.color || '#3b82f6' }}
                    />
                    <h3 className="text-lg font-black tracking-wide text-white uppercase font-mono">
                      {r.name}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeClass}`}>
                    {r.count} {isUrdu ? 'سودے' : 'txns'}
                  </span>
                </div>

                {/* 5 Core Network Metrics */}
                <div className="space-y-2.5 text-xs">
                  {/* Total Sales */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                      {isUrdu ? 'کل سیلز' : 'Total Sales'}
                    </span>
                    <span className="font-bold font-mono text-white text-sm">
                      {formatPKR(r.totalSalesPaisa, settings.currencySymbol)}
                    </span>
                  </div>

                  {/* Total Cost */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                      {isUrdu ? 'کل لاگت' : 'Total Cost'}
                    </span>
                    <span className="font-bold font-mono text-slate-300">
                      {formatPKR(r.totalCostPaisa, settings.currencySymbol)}
                    </span>
                  </div>

                  {/* Total Profit */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                    <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      {isUrdu ? 'کل منافع' : 'Total Profit'}
                    </span>
                    <span className="font-bold font-mono text-emerald-400 text-sm">
                      +{formatPKR(r.totalProfitPaisa, settings.currencySymbol)}
                    </span>
                  </div>

                  {/* Total Loss */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                    <span className="text-rose-400 flex items-center gap-1.5 font-bold">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                      {isUrdu ? 'کل نقصان' : 'Total Loss'}
                    </span>
                    <span className="font-bold font-mono text-rose-400">
                      {r.totalLossPaisa > 0 ? `-${formatPKR(r.totalLossPaisa, settings.currencySymbol)}` : 'Rs 0'}
                    </span>
                  </div>

                  {/* Number of Transactions */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <Hash className="w-3.5 h-3.5 text-purple-400" />
                      {isUrdu ? 'ٹرانزیکشنز کی تعداد' : 'Number of Transactions'}
                    </span>
                    <span className="font-bold font-mono text-white">
                      {r.count}
                    </span>
                  </div>
                </div>
              </div>

              {/* Prefixes Guide */}
              {cfg?.prefixes && cfg.prefixes.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Prefixes ({r.name})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {cfg.prefixes.slice(0, 6).map((pref) => (
                      <span
                        key={pref}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400"
                      >
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
