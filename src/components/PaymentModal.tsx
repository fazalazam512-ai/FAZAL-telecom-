import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  X, 
  DollarSign, 
  CreditCard 
} from 'lucide-react';
import { Customer, PaymentMethod, AppSettings } from '../types';
import { formatPKR, rupeesToPaisa, paisaToRupees } from '../utils/financial';
import { dbService } from '../services/db';

interface PaymentModalProps {
  customer: Customer | null;
  settings: AppSettings;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  customer,
  settings,
  onClose,
  onPaymentSuccess,
}) => {
  if (!customer) return null;

  const isUrdu = settings.language === 'ur';
  const outstandingRs = paisaToRupees(customer.totalOutstandingPaisa);

  const [amountRs, setAmountRs] = useState<string>(String(outstandingRs));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePayFull = () => {
    setAmountRs(String(outstandingRs));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountPaisa = rupeesToPaisa(amountRs);

    if (amountPaisa <= 0) {
      setError('Payment amount must be greater than 0.');
      return;
    }

    if (amountPaisa > customer.totalOutstandingPaisa) {
      // Allow slight overpay if intentional, but confirm with user
      if (!window.confirm(`Received amount (${formatPKR(amountPaisa, settings.currencySymbol)}) exceeds current Udhaar balance (${formatPKR(customer.totalOutstandingPaisa, settings.currencySymbol)}). Continue?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    const result = dbService.addPayment({
      customerId: customer.id,
      amountPaisa,
      paymentMethod,
      notes: notes.trim() || `Udhaar payment received via ${paymentMethod}`,
    });

    if (result) {
      onPaymentSuccess();
      onClose();
    } else {
      setError('Could not process payment.');
      setIsSubmitting(false);
    }
  };

  const paymentMethods: { id: PaymentMethod; label: string }[] = [
    { id: 'CASH', label: isUrdu ? 'نقد (Cash)' : 'Cash' },
    { id: 'EASYPAISA', label: 'EasyPaisa' },
    { id: 'JAZZCASH', label: 'JazzCash' },
    { id: 'BANK_TRANSFER', label: isUrdu ? 'بینک ٹرانسفر' : 'Bank Transfer' },
    { id: 'OTHER', label: isUrdu ? 'دیگر' : 'Other' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isUrdu ? 'ادھار رقم کی وصولی' : 'Receive Udhaar Payment'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">{customer.name} ({customer.phone})</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Display */}
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <Wallet className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isUrdu ? 'موجودہ بقایا ادھار' : 'Current Udhaar Balance'}
            </span>
          </div>
          <div className="text-lg font-black font-mono text-amber-400">
            {formatPKR(customer.totalOutstandingPaisa, settings.currencySymbol)}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                {isUrdu ? 'وصول شدہ رقم (Rs)' : 'Amount Received (Rs) *'}
              </label>
              <button
                type="button"
                onClick={handlePayFull}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 underline"
              >
                {isUrdu ? 'مکمل ادائیگی (Pay Full)' : 'Full Payment'}
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 font-mono text-sm">Rs</span>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={amountRs}
                onChange={(e) => setAmountRs(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono font-black text-lg focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              {isUrdu ? 'ادائیگی کا ذریعہ' : 'Payment Method'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition border ${
                    paymentMethod === m.id
                      ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              {isUrdu ? 'تفصیل / نوٹ' : 'Payment Notes (Optional)'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received via counter cash..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Impact notice (Module 4 & 12 invariant: Never count payments as new sales) */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-400 leading-snug">
            <span className="font-semibold text-emerald-400">Ledger Rule:</span>{' '}
            {isUrdu
              ? 'یہ وصولی کسٹمر کا ادھار کم کرے گی، مگر کل سیلز یا منافع میں اضافہ نہیں کرے گی۔'
              : 'This payment directly reduces customer credit without inflating sales revenue or profit.'}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black shadow-lg shadow-teal-900/40"
            >
              Confirm Receipt
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
