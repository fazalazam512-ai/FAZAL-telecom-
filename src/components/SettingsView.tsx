import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Building2, 
  Globe, 
  DollarSign, 
  Lock, 
  Smartphone, 
  Layers, 
  Save, 
  CheckCircle, 
  Download, 
  Info, 
  Radio, 
  Shield, 
  Clock,
  Plus,
  Trash2,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { AppSettings, NetworkConfig, PackagePreset } from '../types';
import { dbService } from '../services/db';
import { paisaToRupees, rupeesToPaisa, formatPKR } from '../utils/financial';

interface SettingsViewProps {
  settings: AppSettings;
  networks: NetworkConfig[];
  packages: PackagePreset[];
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  networks,
  packages,
  onRefreshData,
}) => {
  const isUrdu = settings.language === 'ur';

  // Form States
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [currency, setCurrency] = useState(settings.currency);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [language, setLanguage] = useState<'en' | 'ur'>(settings.language);
  const [timezone, setTimezone] = useState(settings.timezone || 'Asia/Karachi');
  const [securityPin, setSecurityPin] = useState(settings.securityPin || '');

  // Package Management Sub-state
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgNetwork, setNewPkgNetwork] = useState('Zong');
  const [newPkgCostRs, setNewPkgCostRs] = useState('');
  const [newPkgSaleRs, setNewPkgSaleRs] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'packages' | 'mobileGuide' | 'firebase'>('general');

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    dbService.updateSettings({
      businessName: businessName.trim() || 'FAZAL AZAM TELECOM',
      phone: phone.trim(),
      address: address.trim(),
      currency,
      currencySymbol,
      language,
      timezone,
      securityPin: securityPin.trim(),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    onRefreshData();
  };

  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim()) return;

    dbService.addPackage({
      network: newPkgNetwork as any,
      name: newPkgName.trim(),
      category: 'Custom Bundle',
      defaultCostPaisa: rupeesToPaisa(newPkgCostRs),
      defaultSalePaisa: rupeesToPaisa(newPkgSaleRs),
      description: 'Custom preset created in settings',
    });

    setNewPkgName('');
    setNewPkgCostRs('');
    setNewPkgSaleRs('');
    onRefreshData();
  };

  const handleDeletePackage = (id: string) => {
    dbService.deletePackage(id);
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-500" />
            {isUrdu ? 'سسٹم سیٹنگز و کنفیگریشن' : 'System Settings & Mobile Deployment'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {isUrdu
              ? 'بزنس کا نام، کرنسی، زبان، پیکجز اور موبائل APK / ZIP گائیڈ'
              : 'Business branding, currency presets, package prices, and mobile Android export guide'}
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => setActiveSubTab('general')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'general' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          {isUrdu ? 'عام سیٹنگز' : 'Business & General'}
        </button>

        <button
          onClick={() => setActiveSubTab('packages')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'packages' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          {isUrdu ? 'پیکج ریٹس' : 'Package Presets'}
        </button>

        <button
          onClick={() => setActiveSubTab('mobileGuide')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'mobileGuide' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-amber-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{isUrdu ? 'موبائل ایپ / APK گائیڈ' : 'Mobile APK & ZIP Guide'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('firebase')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'firebase' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          {isUrdu ? 'فائر بیس اسٹیٹس' : 'Firebase Cloud DB'}
        </button>
      </div>

      {/* SUB-TAB 1: General Business Settings */}
      {activeSubTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-400" />
                {isUrdu ? 'بزنس کا نام' : 'Business Name'}
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                {isUrdu ? 'فون نمبر' : 'Contact Phone'}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              {isUrdu ? 'دکان کا پتہ' : 'Shop / Business Address'}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-400" />
                {isUrdu ? 'زبان' : 'Language'}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="en">English (انگریزی)</option>
                <option value="ur">اردو (Urdu)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                {isUrdu ? 'کرنسی کی علامت' : 'Currency Symbol'}
              </label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="Rs"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-400" />
                {isUrdu ? 'ٹائم زون' : 'Timezone'}
              </label>
              <input
                type="text"
                disabled
                value={timezone}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-mono text-xs cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" />
              {isUrdu ? 'سیکیورٹی پن کوڈ (اختیاری)' : 'Security PIN (Optional)'}
            </label>
            <input
              type="password"
              maxLength={6}
              value={securityPin}
              onChange={(e) => setSecurityPin(e.target.value)}
              placeholder="e.g. 1234"
              className="w-full max-w-xs px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                {isUrdu ? 'سیٹنگز محفوظ ہو گئیں!' : 'Settings updated successfully!'}
              </span>
            ) : <span />}

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition active:scale-95"
            >
              Save Settings
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 2: Package Presets Management */}
      {activeSubTab === 'packages' && (
        <div className="space-y-6">
          {/* Add Package form */}
          <form onSubmit={handleAddPackage} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              Add Custom Package Preset
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Network</label>
                <select
                  value={newPkgNetwork}
                  onChange={(e) => setNewPkgNetwork(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="Zong">Zong</option>
                  <option value="Jazz">Jazz</option>
                  <option value="Ufone">Ufone</option>
                  <option value="Telenor">Telenor</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Package Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Super Max"
                  value={newPkgName}
                  onChange={(e) => setNewPkgName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Default Cost (Rs)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 250"
                  value={newPkgCostRs}
                  onChange={(e) => setNewPkgCostRs(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Default Sale (Rs)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 300"
                  value={newPkgSaleRs}
                  onChange={(e) => setNewPkgSaleRs(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
              >
                + Add Preset
              </button>
            </div>
          </form>

          {/* List of Current Packages */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white">Configured Packages ({packages.length})</h4>
            </div>
            <div className="divide-y divide-slate-800">
              {packages.map((pkg) => (
                <div key={pkg.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                      {pkg.network}
                    </span>
                    <div>
                      <div className="font-bold text-white">{pkg.name}</div>
                      <div className="text-slate-400 text-[10px]">{pkg.description || pkg.category}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right font-mono">
                      <div className="text-white font-bold">
                        Sale: {formatPKR(pkg.defaultSalePaisa, settings.currencySymbol)}
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        Cost: {formatPKR(pkg.defaultCostPaisa, settings.currencySymbol)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Mobile APK & ZIP Export Guide (Addressing user question directly!) */}
      {activeSubTab === 'mobileGuide' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 text-amber-400">
            <Smartphone className="w-7 h-7" />
            <div>
              <h3 className="text-lg font-black text-white">
                {isUrdu ? 'موبائل فون میں ایپ انسٹال اور ZIP ڈاؤن لوڈ کرنے کا طریقہ' : 'Mobile APK, ZIP Download & Online Hosting Guide'}
              </h3>
              <p className="text-xs text-amber-400/90 font-medium">
                Step-by-step instructions for Android mobile users
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
            
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                <span>Chrome براؤزر سے ZIP فائل ڈاؤن لوڈ کریں (Desktop Site)</span>
              </h4>
              <p className="text-slate-300">
                اگر آپ کے موبائل پر Download Failed آ رہا ہے:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 text-xs">
                <li>موبائل کے Chrome براؤزر میں اوپر دائیں طرف تین ڈاٹ <strong>(⋮)</strong> دبائیں۔</li>
                <li><strong>Desktop site</strong> کو آن (Check) کریں۔</li>
                <li>اوپر <strong>Export / Code</strong> بٹن پر کلک کر کے <strong>Download as ZIP</strong> پر کلک کریں۔</li>
                <li>پورا پروجیکٹ مع کوڈ آپ کے موبائل ڈاؤن لوڈز میں محفوظ ہو جائے گا۔</li>
              </ol>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">2</span>
                <span>موبائل میں انسٹال کریں (1-Click PWA App / APK)</span>
              </h4>
              <p className="text-slate-300">
                اس ایپ کو بغیر کسی پریشانی کے اپنے موبائل کی ہوم اسکرین پر انسٹال کرنے کے لیے:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
                <li>Chrome کے مینو <strong>(⋮)</strong> میں جائیں۔</li>
                <li><strong>"Add to Home screen"</strong> یا <strong>"Install app"</strong> پر کلک کریں۔</li>
                <li><strong>FAZAL AZAM TELECOM</strong> کا آئیکن آپ کی موبائل اسکرین پر کسی بھی عام اینڈرائیڈ ایپ کی طرح ظاہر ہو جائے گا اور مکمل کام کرے گا۔</li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">3</span>
                <span>اینڈرائیڈ APK فائل بنانا (Standalone APK)</span>
              </h4>
              <p className="text-slate-300">
                اگر آپ باقاعدہ .APK فائل بنانا چاہتے ہیں:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
                <li>ڈاؤن لوڈ کی گئی ZIP فائل سے ویب سائٹ کا لنک لیں، یا Vercel / Netlify پر ایک کلک سے لائیو کریں۔</li>
                <li>ویب سائٹ لنک کو <strong>PWABuilder.com</strong> یا <strong>Website2APK</strong> میں ڈال کر 2 منٹ میں آفیشل Android APK تیار کر سکتے ہیں۔</li>
              </ul>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 4: Firebase Status */}
      {activeSubTab === 'firebase' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">Firebase Firestore Database Connector</h3>
              <p className="text-xs text-slate-400">Persistent Cloud Database & Security Rules Architecture</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Local Persistent Engine:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Active (Zero Data Loss)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Collections Provisioned:</span>
              <span className="text-white font-mono font-semibold">
                users, customers, transactions, payments, networks, packages, auditLogs, settings
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Security Rules:</span>
              <span className="text-blue-400 font-mono">
                Hardened firestore.rules & firebase-blueprint.json generated
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            All records in FAZAL AZAM TELECOM are stored with integer paisa precision and persist across all browser reloads. You can export Excel backups or full JSON snapshots anytime from the Backup tab.
          </p>
        </div>
      )}

    </div>
  );
};
