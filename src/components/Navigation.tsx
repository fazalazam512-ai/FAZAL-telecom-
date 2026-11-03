import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  Wallet, 
  History, 
  BarChart3, 
  Signal, 
  FileSpreadsheet, 
  Settings as SettingsIcon,
  ChevronRight
} from 'lucide-react';
import { ViewTab } from '../types';

interface NavigationProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  pendingUdhaarCount: number;
  isUrdu?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  pendingUdhaarCount,
  isUrdu = false,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ViewTab,
      label: isUrdu ? 'ڈیش بورڈ' : 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'newsale' as ViewTab,
      label: isUrdu ? 'نئی فروخت' : 'New Sale',
      icon: PlusCircle,
      badge: null,
      highlight: true,
    },
    {
      id: 'customers' as ViewTab,
      label: isUrdu ? 'کسٹمرز' : 'Customers',
      icon: Users,
      badge: null,
    },
    {
      id: 'udhaar' as ViewTab,
      label: isUrdu ? 'ادھار کھاتہ' : 'Udhaar',
      icon: Wallet,
      badge: pendingUdhaarCount > 0 ? pendingUdhaarCount : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    },
    {
      id: 'history' as ViewTab,
      label: isUrdu ? 'تاریخچہ' : 'History',
      icon: History,
      badge: null,
    },
    {
      id: 'reports' as ViewTab,
      label: isUrdu ? 'رپورٹس' : 'Reports',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'networks' as ViewTab,
      label: isUrdu ? 'نیٹ ورکس' : 'Networks',
      icon: Signal,
      badge: null,
    },
    {
      id: 'backup' as ViewTab,
      label: isUrdu ? 'بیک اپ / ایکسل' : 'Backup & Excel',
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      id: 'settings' as ViewTab,
      label: isUrdu ? 'سیٹنگز' : 'Settings',
      icon: SettingsIcon,
      badge: null,
    },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-6 shrink-0 min-h-[calc(100vh-5rem)]">
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {isUrdu ? 'مین مینو' : 'Main Navigation'}
          </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                      : item.highlight
                      ? 'bg-blue-950/40 text-blue-300 hover:bg-blue-900/50 hover:text-white border border-blue-800/40'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : item.highlight ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge !== null && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.badgeColor || 'bg-blue-500 text-white'}`}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Shop Status Card */}
        <div className="mt-auto p-3.5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 shadow-inner">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold text-emerald-400">
              {isUrdu ? 'سسٹم تیار ہے' : 'System Ready'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isUrdu 
              ? 'تمام حساب کتاب محفوظ طریقے سے پیسہ انٹیجر میں کی جاتی ہے۔' 
              : 'Exact integer paisa ledger. 100% financial accuracy.'}
          </p>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 shadow-2xl safe-area-pb">
        <div className="flex items-center justify-around">
          {/* Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition ${
              activeTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>{isUrdu ? 'ڈیش بورڈ' : 'Home'}</span>
          </button>

          {/* Customers */}
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition ${
              activeTab === 'customers' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span>{isUrdu ? 'گاہک' : 'Customers'}</span>
          </button>

          {/* Prominent Center Action: New Sale */}
          <button
            onClick={() => setActiveTab('newsale')}
            className="flex flex-col items-center -mt-5"
          >
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/40 active:scale-95 transition-transform border-2 border-slate-900">
              <PlusCircle className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-bold text-blue-400 mt-1">
              {isUrdu ? 'فروخت +' : '+ Sale'}
            </span>
          </button>

          {/* Udhaar */}
          <button
            onClick={() => setActiveTab('udhaar')}
            className={`relative flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition ${
              activeTab === 'udhaar' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {pendingUdhaarCount > 0 && (
              <span className="absolute top-0 right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-500 text-slate-950">
                {pendingUdhaarCount}
              </span>
            )}
            <Wallet className="w-5 h-5 mb-0.5" />
            <span>{isUrdu ? 'ادھار' : 'Udhaar'}</span>
          </button>

          {/* Reports */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition ${
              activeTab === 'reports' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span>{isUrdu ? 'رپورٹس' : 'Reports'}</span>
          </button>

          {/* Backup & Settings Toggle */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition ${
              activeTab === 'settings' || activeTab === 'backup' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SettingsIcon className="w-5 h-5 mb-0.5" />
            <span>{isUrdu ? 'سیٹنگز' : 'More'}</span>
          </button>
        </div>
      </nav>
    </>
  );
};
