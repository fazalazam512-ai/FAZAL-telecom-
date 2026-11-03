import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  ShieldCheck, 
  Database,
  FileCheck,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { AppSettings } from '../types';
import { exportTelecomExcelBackup, downloadJSONFile } from '../services/excelExport';
import { dbService } from '../services/db';

interface BackupViewProps {
  settings: AppSettings;
  onRefreshData: () => void;
}

export const BackupView: React.FC<BackupViewProps> = ({ settings, onRefreshData }) => {
  const isUrdu = settings.language === 'ur';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [restoreStatus, setRestoreStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [isProcessing, setIsProcessing] = useState(false);

  // Handle Excel Export
  const handleExportExcel = () => {
    setIsProcessing(true);
    try {
      exportTelecomExcelBackup();
      setRestoreStatus({
        type: 'success',
        message: 'Excel spreadsheet generated and downloaded successfully with all sheets!',
      });
    } catch (e: any) {
      setRestoreStatus({
        type: 'error',
        message: `Excel export error: ${e.message}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle JSON Backup Download
  const handleExportJSON = () => {
    try {
      const jsonStr = dbService.exportFullBackupJSON();
      downloadJSONFile(jsonStr);
      setRestoreStatus({
        type: 'success',
        message: 'Complete JSON backup archive downloaded successfully.',
      });
    } catch (e: any) {
      setRestoreStatus({
        type: 'error',
        message: `Backup failed: ${e.message}`,
      });
    }
  };

  // Handle Restore file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const res = dbService.restoreFromJSON(content);
        if (res.success) {
          setRestoreStatus({
            type: 'success',
            message: res.message,
          });
          onRefreshData();
        } else {
          setRestoreStatus({
            type: 'error',
            message: res.message,
          });
        }
      } catch (err: any) {
        setRestoreStatus({
          type: 'error',
          message: `Corrupted backup file: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to restore the system to factory seed data? Current custom entries will be reset.')) {
      dbService.resetAllData();
      onRefreshData();
      setRestoreStatus({
        type: 'success',
        message: 'System restored to fresh factory settings and standard demo data.',
      });
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          {isUrdu ? 'ڈیٹا بیک اپ و ایکسل ایکسپورٹ' : 'Excel Export & Data Backup Center'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          {isUrdu
            ? 'تمام کھاتہ، کسٹمرز، سیلز اور ادائیگیوں کا مکمل ایکسل اور محفوظ JSON بیک اپ'
            : 'Export comprehensive Microsoft Excel (.xlsx) workbooks or full system JSON backups for offline storage'}
        </p>
      </div>

      {/* Notification Banner */}
      {restoreStatus.type && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-3 ${
          restoreStatus.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
        }`}>
          {restoreStatus.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{restoreStatus.message}</span>
        </div>
      )}

      {/* Grid of 3 Backup Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card 1: Excel Backup */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {isUrdu ? 'ایکسل فائل ڈاؤن لوڈ کریں' : 'Download Excel Backup (.xlsx)'}
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Generates a multi-sheet Microsoft Excel file containing:
            </p>
            <ul className="text-xs text-slate-300 space-y-1 mb-6 list-disc list-inside">
              <li>Sheet 1: Dashboard Executive Summary & KPIs</li>
              <li>Sheet 2: Network Performance Breakdown</li>
              <li>Sheet 3: Complete Transactions & Margins Ledger</li>
              <li>Sheet 4: Customer Contact & Udhaar Accounts</li>
              <li>Sheet 5: Udhaar Repayment Receipts</li>
            </ul>
          </div>

          <button
            onClick={handleExportExcel}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel Backup</span>
          </button>
        </div>

        {/* Card 2: Full JSON Archive */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {isUrdu ? 'مکمل سسٹم بیک اپ (JSON)' : 'Download Full JSON Backup'}
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Creates an encrypted, structured snapshot of your entire database:
            </p>
            <ul className="text-xs text-slate-300 space-y-1 mb-6 list-disc list-inside">
              <li>All Customer records and Udhaar balances</li>
              <li>All Sales transactions with exact integer paisa</li>
              <li>Complete Payment history and receipts</li>
              <li>Network operator settings and custom bundle presets</li>
              <li>Audit trails and system preferences</li>
            </ul>
          </div>

          <button
            onClick={handleExportJSON}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Full JSON Backup</span>
          </button>
        </div>

      </div>

      {/* Restore Section */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isUrdu ? 'بیک اپ بحال کریں (Restore Backup)' : 'Restore Backup Archive'}
            </h3>
            <p className="text-xs text-slate-400">
              Upload a previously exported .json file to restore all customers, sales, and accounts
            </p>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
          id="backup-file-input"
        />

        <div className="mt-4 p-5 rounded-2xl border-2 border-dashed border-slate-700 hover:border-blue-500 text-center transition">
          <HardDrive className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-xs text-slate-300 font-semibold mb-3">
            Select FAZAL AZAM TELECOM JSON backup file from your device
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-600 shadow"
          >
            Choose Backup File (.json)
          </button>
        </div>
      </div>

      {/* Factory Reset */}
      <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-slate-400" />
            Reset to Factory Demo Data
          </h4>
          <p className="text-xs text-slate-500">
            Re-populates the standard initial customers and network presets
          </p>
        </div>
        <button
          onClick={handleResetData}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
        >
          Reset Data
        </button>
      </div>
    </div>
  );
};
