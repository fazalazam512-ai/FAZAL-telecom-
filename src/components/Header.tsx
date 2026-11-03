import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  PlusCircle, 
  Globe, 
  Database, 
  Clock, 
  Wallet,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { AppSettings, ViewTab } from '../types';
import { formatPKR } from '../utils/financial';

interface HeaderProps {
  settings: AppSettings;
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  totalNetProfitPaisa: number;
  totalUdhaarPaisa: number;
  onOpenNewSale: () => void;
  onToggleLanguage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeTab,
  setActiveTab,
  totalNetProfitPaisa,
  totalUdhaarPaisa,
  onOpenNewSale,
  onToggleLanguage,
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-PK', {
          timeZone: 'Asia/Karachi',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isUrdu = settings.language === 'ur';

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Name */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Radio className="w-6 h-6 text-sky-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-wider text-white font-mono uppercase bg-gradient-to-r from-white via-sky-200 to-blue-300 bg-clip-text text-transparent">
                  {settings.businessName}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  VERIFIED PRO
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
                {isUrdu ? 'ٹیلی کام بزنس و کھاتہ مینجمنٹ' : 'Telecom Business & Ledger System'}
              </p>
            </div>
          </div>

          {/* Center Quick Financial Badges (Hidden on very small screens) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Net Profit Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold">
                  {isUrdu ? 'خالص منافع' : 'Net Profit'}
                </div>
                <div className="text-sm font-bold font-mono">
                  {formatPKR(totalNetProfitPaisa, settings.currencySymbol)}
                </div>
              </div>
            </div>

            {/* Total Udhaar Pill */}
            <div 
              onClick={() => setActiveTab('udhaar')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-400 cursor-pointer hover:bg-amber-900/60 transition-colors"
              title="Click to view Udhaar Khata"
            >
              <Wallet className="w-4 h-4" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold">
                  {isUrdu ? 'کل ادھار' : 'Total Udhaar'}
                </div>
                <div className="text-sm font-bold font-mono">
                  {formatPKR(totalUdhaarPaisa, settings.currencySymbol)}
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Clock */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 text-xs font-mono border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>{timeStr || 'PKT'}</span>
            </div>

            {/* Language Switcher */}
            <button
              onClick={onToggleLanguage}
              title={isUrdu ? 'Switch to English' : 'اردو میں دیکھیں'}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold">{isUrdu ? 'English' : 'اردو'}</span>
            </button>

            {/* Database indicator */}
            <button
              onClick={() => setActiveTab('settings')}
              title="Database & Cloud Status"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono text-[11px]">DB Active</span>
            </button>

            {/* Primary Action: New Sale */}
            <button
              onClick={onOpenNewSale}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/30 hover:shadow-blue-600/50 transition-all transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isUrdu ? 'نیا اندراج' : 'New Sale'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
