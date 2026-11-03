import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Plus, 
  Save, 
  Phone, 
  Calendar, 
  User, 
  Tag, 
  DollarSign, 
  FileText,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Customer, NetworkName, PackageType, PaymentStatus, PackagePreset, AppSettings, Transaction } from '../types';
import { 
  rupeesToPaisa, 
  paisaToRupees, 
  formatPKR, 
  calculateProfitLoss, 
  calculateRemainingBalance,
  getTodayDateString 
} from '../utils/financial';
import { dbService } from '../services/db';

interface NewSaleViewProps {
  customers: Customer[];
  packages: PackagePreset[];
  settings: AppSettings;
  onSaleSaved: (txn: Transaction) => void;
  onCustomerAdded: (customer: Customer) => void;
}

export const NewSaleView: React.FC<NewSaleViewProps> = ({
  customers,
  packages,
  settings,
  onSaleSaved,
  onCustomerAdded,
}) => {
  const isUrdu = settings.language === 'ur';

  // Form States
  const [date, setDate] = useState(getTodayDateString());
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [network, setNetwork] = useState<NetworkName>('Zong');
  const [packageName, setPackageName] = useState<PackageType>('Slot');
  const [customPackageTitle, setCustomPackageTitle] = useState('');

  // Numerical inputs in decimal Rupees for easy shopkeeper typing
  const [costPriceRs, setCostPriceRs] = useState<string>('85');
  const [salePriceRs, setSalePriceRs] = useState<string>('100');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PAID');
  const [amountReceivedRs, setAmountReceivedRs] = useState<string>('100');
  const [notes, setNotes] = useState('');

  // UI status
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [showQuickAddCustomerModal, setShowQuickAddCustomerModal] = useState(false);
  const [quickCustomerAddress, setQuickCustomerAddress] = useState('');

  // When package or network changes, auto-fill standard pricing preset if available
  useEffect(() => {
    const matched = packages.find(
      (p) => p.network === network && p.name === packageName
    );
    if (matched) {
      setCostPriceRs(String(paisaToRupees(matched.defaultCostPaisa)));
      setSalePriceRs(String(paisaToRupees(matched.defaultSalePaisa)));
      if (paymentStatus === 'PAID') {
        setAmountReceivedRs(String(paisaToRupees(matched.defaultSalePaisa)));
      }
    }
  }, [network, packageName, packages]);

  // When Sale Price changes and status is PAID, sync Amount Received
  const handleSalePriceChange = (val: string) => {
    setSalePriceRs(val);
    if (paymentStatus === 'PAID') {
      setAmountReceivedRs(val);
    }
  };

  // When payment status changes, adjust Amount Received
  const handlePaymentStatusChange = (status: PaymentStatus) => {
    setPaymentStatus(status);
    if (status === 'PAID') {
      setAmountReceivedRs(salePriceRs);
    } else if (status === 'UDHAAR') {
      setAmountReceivedRs('0');
    }
  };

  // Convert inputs to exact paisa for calculation
  const costPaisa = rupeesToPaisa(costPriceRs);
  const salePaisa = rupeesToPaisa(salePriceRs);
  const receivedPaisa = rupeesToPaisa(amountReceivedRs);

  const { profitPaisa, lossPaisa, netProfitPaisa, isProfit, isLoss } = calculateProfitLoss(salePaisa, costPaisa);
  const remainingBalancePaisa = calculateRemainingBalance(salePaisa, receivedPaisa);

  // Filter existing customers for autocomplete
  const filteredCustomers = customerSearch.trim() === ''
    ? []
    : customers.filter(
        (c) =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.phone.includes(customerSearch)
      );

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setCustomerSearch(c.name);
    setShowCustomerDropdown(false);
  };

  const handleQuickCreateCustomer = () => {
    if (!customerSearch.trim()) return;
    const newCust = dbService.addCustomer({
      name: customerSearch.trim(),
      phone: customerPhone.trim() || '0300-0000000',
      address: quickCustomerAddress.trim(),
      registrationDate: getTodayDateString(),
      notes: 'Added from New Sale entry',
    });
    onCustomerAdded(newCust);
    handleSelectCustomer(newCust);
    setShowQuickAddCustomerModal(false);
  };

  const handleResetForm = () => {
    setCustomerSearch('');
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setPackageName('Slot');
    setCustomPackageTitle('');
    setCostPriceRs('85');
    setSalePriceRs('100');
    setPaymentStatus('PAID');
    setAmountReceivedRs('100');
    setNotes('');
    setErrors({});
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!customerName.trim() && !customerSearch.trim()) {
      newErrors.customer = isUrdu ? 'کسٹمر کا نام درج کریں' : 'Please select or enter customer name';
    }

    if (salePaisa <= 0) {
      newErrors.salePrice = isUrdu ? 'فروخت کی قیمت درست درج کریں' : 'Sale price must be greater than 0';
    }

    if (receivedPaisa > salePaisa) {
      newErrors.amountReceived = isUrdu
        ? 'وصول شدہ رقم فروخت کی قیمت سے زیادہ نہیں ہو سکتی'
        : 'Received amount cannot exceed sale price';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // If customer wasn't selected from dropdown, link or create one
    let finalCustId = selectedCustomerId;
    let finalCustName = customerName || customerSearch.trim();
    let finalCustPhone = customerPhone.trim();

    if (!finalCustId) {
      // Find if customer with this exact name already exists
      const existing = customers.find(
        (c) => c.name.toLowerCase() === finalCustName.toLowerCase()
      );
      if (existing) {
        finalCustId = existing.id;
        finalCustPhone = existing.phone;
      } else {
        const created = dbService.addCustomer({
          name: finalCustName,
          phone: finalCustPhone || '0300-0000000',
          registrationDate: date,
          notes: 'Auto-registered from sales counter',
        });
        onCustomerAdded(created);
        finalCustId = created.id;
      }
    }

    // Save transaction to persistent database
    const savedTxn = dbService.addTransaction({
      date: new Date(date).toISOString(),
      customerId: finalCustId,
      customerName: finalCustName,
      customerPhone: finalCustPhone,
      network,
      packageName,
      customPackageTitle: packageName === 'Custom Package' ? customPackageTitle : undefined,
      costPricePaisa: costPaisa,
      salePricePaisa: salePaisa,
      paymentStatus,
      amountReceivedPaisa: receivedPaisa,
      notes: notes.trim(),
    });

    onSaleSaved(savedTxn);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      handleResetForm();
    }, 1500);
  };

  const networksList: NetworkName[] = ['Zong', 'Jazz', 'Ufone', 'Telenor', 'Other'];
  const packagesList: PackageType[] = [
    'Slot',
    'My5',
    'Daily Package',
    'Weekly Package',
    'Monthly Package',
    'Custom Package',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-500" />
            {isUrdu ? 'نیا سودا / سیلز اندراج' : 'New Telecom Sale Entry'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {isUrdu
              ? 'صحیح حساب کے ساتھ فوری سیل محفوظ کریں۔ منافع، نقصان اور ادھار کا خودکار حساب۔'
              : 'Record telecom loads, bundles, or slots. Instant exact profit & udhaar tracking.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetForm}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isUrdu ? 'صاف کریں' : 'Reset'}</span>
        </button>
      </div>

      {/* Main Sale Form Card */}
      <form onSubmit={handleSaveEntry} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        
        {/* Row 1: Date & Customer Autocomplete */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              {isUrdu ? 'تاریخ' : 'Date'}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm focus:outline-none focus:border-blue-500 transition"
              required
            />
          </div>

          {/* Customer Selection with Autocomplete */}
          <div className="relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-400" />
                {isUrdu ? 'کسٹمر کا نام' : 'Customer Name'}
              </span>
              <button
                type="button"
                onClick={() => setShowQuickAddCustomerModal(true)}
                className="text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'نیا کسٹمر' : '+ Quick Add'}</span>
              </button>
            </label>

            <div className="relative">
              <input
                type="text"
                placeholder={isUrdu ? 'کسٹمر کا نام تلاش کریں یا نیا لکھیں...' : 'Search customer or type new name...'}
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setCustomerName(e.target.value);
                  setSelectedCustomerId('');
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className={`w-full px-4 py-3 rounded-xl bg-slate-800 border ${
                  errors.customer ? 'border-rose-500' : 'border-slate-700'
                } text-white font-medium text-sm focus:outline-none focus:border-blue-500 transition`}
              />
              {selectedCustomerId && (
                <div className="absolute right-3 top-3.5 text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Existing</span>
                </div>
              )}
            </div>

            {errors.customer && (
              <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.customer}
              </p>
            )}

            {/* Dropdown Suggestions */}
            {showCustomerDropdown && filteredCustomers.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1.5 max-h-48 overflow-y-auto rounded-xl bg-slate-800 border border-slate-700 shadow-2xl divide-y divide-slate-700">
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className="p-3 hover:bg-slate-700/80 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <div className="font-bold text-white">{c.name}</div>
                      <div className="text-slate-400 font-mono">{c.phone}</div>
                    </div>
                    {c.totalOutstandingPaisa > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Udhaar: {formatPKR(c.totalOutstandingPaisa, settings.currencySymbol)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Customer Phone (Optional or auto-filled) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-blue-400" />
              {isUrdu ? 'کسٹمر کا موبائل نمبر' : 'Customer Phone'}
            </label>
            <input
              type="text"
              placeholder="0300-1234567"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Network Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              {isUrdu ? 'نیٹ ورک منتخب کریں' : 'Network'}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {networksList.map((net) => {
                const isSelected = network === net;
                return (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setNetwork(net)}
                    className={`py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wide transition border ${
                      isSelected
                        ? net === 'Zong'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                          : net === 'Jazz'
                          ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                          : net === 'Ufone'
                          ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/30'
                          : net === 'Telenor'
                          ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/30'
                          : 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {net}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 2: Package Type Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            {isUrdu ? 'پیکج کی قسم' : 'Package Name'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {packagesList.map((pkg) => {
              const isSelected = packageName === pkg;
              return (
                <button
                  key={pkg}
                  type="button"
                  onClick={() => setPackageName(pkg)}
                  className={`p-2.5 rounded-xl text-xs font-semibold transition border text-center ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {pkg}
                </button>
              );
            })}
          </div>

          {packageName === 'Custom Package' && (
            <div className="mt-3">
              <input
                type="text"
                placeholder={isUrdu ? 'کسٹم پیکج یا ڈیوائس کا نام درج کریں...' : 'Enter custom package title or detail...'}
                value={customPackageTitle}
                onChange={(e) => setCustomPackageTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          )}
        </div>

        {/* Row 3: Financial Calculations (Cost Price & Sale Price) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
          {/* Cost Price */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
              <span>{isUrdu ? 'لاگت کی قیمت (Cost Price)' : 'Cost Price (Rs)'}</span>
              <span className="text-[10px] text-slate-400 font-normal">Our Purchase</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 font-mono text-sm">Rs</span>
              <input
                type="number"
                step="any"
                min="0"
                value={costPriceRs}
                onChange={(e) => setCostPriceRs(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono font-bold text-base focus:outline-none focus:border-blue-500 transition"
                required
              />
            </div>
          </div>

          {/* Sale Price */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
              <span>{isUrdu ? 'فروخت کی قیمت (Sale Price)' : 'Sale Price (Rs)'}</span>
              <span className="text-[10px] text-slate-400 font-normal">Customer Price</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 font-mono text-sm">Rs</span>
              <input
                type="number"
                step="any"
                min="0"
                value={salePriceRs}
                onChange={(e) => handleSalePriceChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border ${
                  errors.salePrice ? 'border-rose-500' : 'border-slate-700'
                } text-white font-mono font-bold text-base focus:outline-none focus:border-blue-500 transition`}
                required
              />
            </div>
            {errors.salePrice && (
              <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.salePrice}
              </p>
            )}
          </div>
        </div>

        {/* Live Profit or Loss Preview Banner */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isProfit 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' 
            : isLoss 
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-400' 
            : 'bg-slate-800/60 border-slate-700 text-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isProfit && <TrendingUp className="w-5 h-5 text-emerald-400" />}
              {isLoss && <TrendingDown className="w-5 h-5 text-rose-400" />}
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  {isProfit ? (isUrdu ? 'متوقع منافع (Profit)' : 'Calculated Profit') : isLoss ? (isUrdu ? 'متوقع نقصان (Loss)' : 'Calculated Loss') : 'Break Even'}
                </span>
                <p className="text-[11px] text-slate-400">
                  {isProfit
                    ? `Sale Price (Rs ${salePriceRs}) - Cost Price (Rs ${costPriceRs})`
                    : isLoss
                    ? `Warning: Cost (Rs ${costPriceRs}) exceeds Sale (Rs ${salePriceRs})`
                    : 'Zero Margin'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl sm:text-2xl font-black font-mono">
                {isProfit && `+${formatPKR(profitPaisa, settings.currencySymbol)}`}
                {isLoss && `-${formatPKR(lossPaisa, settings.currencySymbol)}`}
                {!isProfit && !isLoss && 'Rs 0'}
              </div>
              {salePaisa > 0 && isProfit && (
                <span className="text-[11px] font-semibold text-emerald-400">
                  Margin: {((profitPaisa / salePaisa) * 100).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Row 4: Payment Status & Udhaar Calculation */}
        <div className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            {isUrdu ? 'ادائیگی کی حالت' : 'Payment Status'}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['PAID', 'PARTIAL', 'UDHAAR'] as PaymentStatus[]).map((status) => {
              const isSelected = paymentStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => handlePaymentStatusChange(status)}
                  className={`py-3 rounded-xl text-xs sm:text-sm font-extrabold transition border ${
                    isSelected
                      ? status === 'PAID'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                        : status === 'PARTIAL'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30'
                        : 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {status === 'PAID' && (isUrdu ? 'مکمل نقد (PAID)' : 'Full Paid')}
                  {status === 'PARTIAL' && (isUrdu ? 'جزوی نقد (PARTIAL)' : 'Partial')}
                  {status === 'UDHAAR' && (isUrdu ? 'مکمل ادھار (UDHAAR)' : 'Full Udhaar')}
                </button>
              );
            })}
          </div>

          {/* Amount Received & Remaining Balance Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                {isUrdu ? 'وصول شدہ رقم (Amount Received)' : 'Amount Received (Rs)'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 font-mono text-sm">Rs</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max={salePriceRs}
                  value={amountReceivedRs}
                  onChange={(e) => {
                    setAmountReceivedRs(e.target.value);
                    if (Number(e.target.value) === 0) setPaymentStatus('UDHAAR');
                    else if (Number(e.target.value) >= Number(salePriceRs)) setPaymentStatus('PAID');
                    else setPaymentStatus('PARTIAL');
                  }}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border ${
                    errors.amountReceived ? 'border-rose-500' : 'border-slate-700'
                  } text-white font-mono font-bold text-base focus:outline-none focus:border-blue-500 transition`}
                  required
                />
              </div>
              {errors.amountReceived && (
                <p className="text-xs text-rose-400 mt-1">{errors.amountReceived}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                {isUrdu ? 'بقایا ادھار (Remaining Udhaar)' : 'Remaining Balance (Rs)'}
              </label>
              <div className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-400">Sale - Received</span>
                <span className={`text-base font-black font-mono ${remainingBalancePaisa > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {formatPKR(remainingBalancePaisa, settings.currencySymbol)}
                </span>
              </div>
              {remainingBalancePaisa > 0 && (
                <p className="text-[11px] text-amber-400/90 mt-1 font-semibold">
                  {isUrdu ? 'یہ رقم کسٹمر کے کھاتہ میں ادھار درج ہوگی' : 'Will be added to customer credit ledger'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Row 5: Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-400" />
            {isUrdu ? 'تفصیل / نوٹ (اختیاری)' : 'Notes / Remarks (Optional)'}
          </label>
          <input
            type="text"
            placeholder={isUrdu ? 'مثلاً: نقد وصول ہوا، یا کل ادائیگی کا وعدہ...' : 'e.g. Paid via JazzCash, or promises to pay Friday...'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* SAVE ENTRY BUTTON */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSuccess}
            className={`w-full py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-xl transition-all transform active:scale-[0.99] ${
              isSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-600/40'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-blue-600/30'
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle className="w-6 h-6 animate-bounce" />
                <span>{isUrdu ? 'اندراج کامیابی سے محفوظ ہوگیا!' : 'Sale Successfully Saved!'}</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{isUrdu ? 'سیو اندراج (SAVE ENTRY)' : 'SAVE ENTRY'}</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* Quick Add Customer Modal */}
      {showQuickAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                {isUrdu ? 'نیا کسٹمر شامل کریں' : 'Quick Register Customer'}
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickAddCustomerModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Mobile Phone</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Address / Shop</label>
                <input
                  type="text"
                  value={quickCustomerAddress}
                  onChange={(e) => setQuickCustomerAddress(e.target.value)}
                  placeholder="e.g. Main Bazar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setShowQuickAddCustomerModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickCreateCustomer}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
              >
                Save & Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
