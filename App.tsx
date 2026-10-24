import React, { useState, useEffect } from 'react';
import { 
  StoreProfile, 
  CategoryTab, 
  Customer, 
  Bill, 
  PointTransaction,
  MedicineReminder,
  AuthSession
} from './types';
import { 
  getStoreProfile, 
  saveStoreProfile, 
  getCategoryTabs, 
  saveCategoryTabs, 
  getCustomers, 
  saveCustomers, 
  getBills, 
  saveBills, 
  getTransactions, 
  saveTransactions,
  getReminders,
  saveReminders,
  getAllStores,
  getActiveStoreId,
  setActiveStoreId
} from './utils/storage';
import {
  getAuthSession,
  saveAuthSession,
  clearAuthSession,
  pushBillToCloud,
  pushCustomerToCloud,
  pushReminderToCloud,
  pushTransactionToCloud,
  pullStoreDataFromCloud,
  ADMIN_MOBILE
} from './utils/cloudSync';
import { Header } from './components/Header';
import { QuickBillPOS } from './components/QuickBillPOS';
import { TabManager } from './components/TabManager';
import { CustomerLedger } from './components/CustomerLedger';
import { MedicineReminders } from './components/MedicineReminders';
import { SalesHistory } from './components/SalesHistory';
import { StoreSettings } from './components/StoreSettings';
import { RegisterStoreModal } from './components/RegisterStoreModal';
import { StoreManagerModal } from './components/StoreManagerModal';
import { AuthModal } from './components/AuthModal';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { ReceiptText, Layers, Users, Bell, Settings, AlertTriangle, LogOut } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<AuthSession>(getAuthSession());
  const [store, setStore] = useState<StoreProfile>(getStoreProfile());
  const [tabs, setTabs] = useState<CategoryTab[]>(getCategoryTabs());
  const [customers, setCustomers] = useState<Customer[]>(getCustomers());
  const [bills, setBills] = useState<Bill[]>(getBills());
  const [transactions, setTransactions] = useState<PointTransaction[]>(getTransactions());
  const [reminders, setReminders] = useState<MedicineReminder[]>(getReminders());
  const [allStoresList, setAllStoresList] = useState<StoreProfile[]>(getAllStores());

  const [activeTab, setActiveTab] = useState<'pos' | 'tabs' | 'customers' | 'reminders' | 'history' | 'settings'>('pos');
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isStoreManagerOpen, setIsStoreManagerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [quickScenarioKey, setQuickScenarioKey] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  // Auto-detect typing on mobile to hide floating bottom nav bar and prevent obscuring active inputs
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        setIsTyping(true);
      }
    };
    const handleFocusOut = () => {
      setIsTyping(false);
    };
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // When clicking "Make Bill" from Reminders tab
  const [prefillRefillData, setPrefillRefillData] = useState<{ mobile: string; medicine: string } | null>(null);

  // Compute how many patients have refill due in <= 2 days or today
  const dueRemindersCount = reminders.filter((rem) => {
    if (rem.status === 'REFILLED' || rem.status === 'STOPPED') return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(rem.nextDueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - now.getTime()) / 86400000);
    return diffDays <= rem.alertBeforeDays;
  }).length;

  // Load from local storage
  const refreshAllData = () => {
    setStore(getStoreProfile());
    setTabs(getCategoryTabs());
    setCustomers(getCustomers());
    setBills(getBills());
    setTransactions(getTransactions());
    setReminders(getReminders());
    setAllStoresList(getAllStores());
  };

  const handleSaveStore = (updated: StoreProfile) => {
    setStore(updated);
    saveStoreProfile(updated);
    setAllStoresList(getAllStores());
  };

  const handleSaveTabs = (updated: CategoryTab[]) => {
    setTabs(updated);
    saveCategoryTabs(updated);
  };

  const handleSaveBill = (
    newBill: Bill, 
    updatedCustomer: Customer, 
    newTxn: PointTransaction
  ) => {
    // 1. Update bills
    const updatedBills = [newBill, ...bills];
    setBills(updatedBills);
    saveBills(updatedBills);
    pushBillToCloud(store.id, newBill);

    // 2. Update customers
    const exists = customers.some(c => c.id === updatedCustomer.id);
    let updatedCustomers: Customer[];
    if (exists) {
      updatedCustomers = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    } else {
      updatedCustomers = [updatedCustomer, ...customers];
    }
    setCustomers(updatedCustomers);
    saveCustomers(updatedCustomers);
    pushCustomerToCloud(store.id, updatedCustomer);

    // 3. Update transactions
    const updatedTxns = [newTxn, ...transactions];
    setTransactions(updatedTxns);
    saveTransactions(updatedTxns);
    pushTransactionToCloud(store.id, newTxn);
  };

  const handleUpdateCustomer = (updatedCustomer: Customer, txn?: PointTransaction) => {
    const updatedCustomers = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    setCustomers(updatedCustomers);
    saveCustomers(updatedCustomers);
    pushCustomerToCloud(store.id, updatedCustomer);

    if (txn) {
      const updatedTxns = [txn, ...transactions];
      setTransactions(updatedTxns);
      saveTransactions(updatedTxns);
      pushTransactionToCloud(store.id, txn);
    }
  };

  // Medicine Reminders Handlers
  const handleSaveReminder = (newReminder: MedicineReminder) => {
    const exists = reminders.some(r => r.id === newReminder.id);
    let updated: MedicineReminder[];
    if (exists) {
      updated = reminders.map(r => r.id === newReminder.id ? newReminder : r);
    } else {
      updated = [newReminder, ...reminders];
    }
    setReminders(updated);
    saveReminders(updated);
    pushReminderToCloud(store.id, newReminder);
  };

  const handleUpdateReminder = (updatedReminder: MedicineReminder) => {
    const updated = reminders.map(r => r.id === updatedReminder.id ? updatedReminder : r);
    setReminders(updated);
    saveReminders(updated);
    pushReminderToCloud(store.id, updatedReminder);
  };

  const handleDeleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    saveReminders(updated);
  };

  const handleGoToBillForCustomer = (customerMobile: string, medicineName: string) => {
    setPrefillRefillData({ mobile: customerMobile, medicine: medicineName });
    setActiveTab('pos');
  };

  const handleQuickScenario = () => {
    setPrefillRefillData(null);
    setActiveTab('pos');
    setQuickScenarioKey((prev) => prev + 1);
  };

  const handleQuickBillForCustomer = (customer: Customer) => {
    setPrefillRefillData({ mobile: customer.mobile, medicine: '' });
    setActiveTab('pos');
  };

  // Auth & Multi-Tenant Actions
  const handleLoginSuccess = (newSession: AuthSession, targetStore?: StoreProfile) => {
    setSession(newSession);
    saveAuthSession(newSession);
    if (targetStore) {
      setStore(targetStore);
      setActiveStoreId(targetStore.id);
      refreshAllData();
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    const guestSession: AuthSession = {
      isLoggedIn: false,
      role: 'guest',
      mobile: '',
    };
    setSession(guestSession);
    setIsAuthModalOpen(true);
  };

  const handleEnterStoreView = (targetStore: StoreProfile) => {
    const adminViewingSession: AuthSession = {
      ...session,
      viewingAsStoreId: targetStore.id,
      storeId: targetStore.id,
      storeName: targetStore.storeName,
      ownerName: targetStore.ownerName,
    };
    setSession(adminViewingSession);
    saveAuthSession(adminViewingSession);
    setActiveStoreId(targetStore.id);
    refreshAllData();
  };

  const handleBackToAdmin = () => {
    const adminSession: AuthSession = {
      ...session,
      viewingAsStoreId: undefined,
    };
    setSession(adminSession);
    saveAuthSession(adminSession);
  };

  // Case 1: Super Admin Master Hub (Admin ID: 9662076010 / PIN: 0911)
  if (session.role === 'super_admin' && !session.viewingAsStoreId) {
    return (
      <>
        <SuperAdminDashboard
          session={session}
          onLogout={handleLogout}
          onEnterStoreView={handleEnterStoreView}
          onOpenRegisterModal={() => setIsAuthModalOpen(true)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          defaultMode="register"
        />
      </>
    );
  }

  // Case 2: Blocked Pharmacy Account Screen
  if (store.status === 'blocked' && !session.isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-slate-800 border border-rose-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-900/60 border border-rose-500 text-rose-300 flex items-center justify-center mx-auto text-2xl">
            🔒
          </div>
          <h2 className="text-lg font-bold text-white">मेडिकल स्टोर खाता ब्लॉक/निष्क्रिय है</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            "{store.storeName}" का खाता अस्थायी रूप से रोक दिया गया है। पुनः चालू करवाने के लिए कृपया सुपर एडमिन से संपर्क करें।
          </p>
          <div className="p-3 bg-slate-900 rounded-xl font-mono text-xs text-emerald-400 font-bold">
            📞 सुपर एडमिन संपर्क: {ADMIN_MOBILE}
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
          >
            दूसरे खाते से लॉगिन करें
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        store={store}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dueRemindersCount={dueRemindersCount}
        totalStoresCount={allStoresList.length}
        session={session}
        onQuickScenario={handleQuickScenario}
        onOpenStoreModal={() => setIsStoreModalOpen(true)}
        onOpenStoreManager={() => setIsStoreManagerOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onBackToAdmin={session.viewingAsStoreId ? handleBackToAdmin : undefined}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 pb-20 sm:pb-8">
        {activeTab === 'pos' && (
          <QuickBillPOS
            key={`${quickScenarioKey}-${prefillRefillData?.mobile || 'clean'}`}
            store={store}
            tabs={tabs}
            customers={customers}
            bills={bills}
            reminders={reminders}
            onSaveBill={handleSaveBill}
            onSaveReminder={handleSaveReminder}
            onGoToTabs={() => setActiveTab('tabs')}
            onGoToReminders={() => setActiveTab('reminders')}
            onGoToCustomers={() => setActiveTab('customers')}
            prefillMobile={prefillRefillData?.mobile}
            prefillMedicine={prefillRefillData?.medicine}
          />
        )}

        {activeTab === 'tabs' && (
          <TabManager
            tabs={tabs}
            onSaveTabs={handleSaveTabs}
            onGoToBilling={() => setActiveTab('pos')}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerLedger
            customers={customers}
            transactions={transactions}
            store={store}
            onUpdateCustomer={handleUpdateCustomer}
            onQuickBillForCustomer={handleQuickBillForCustomer}
          />
        )}

        {activeTab === 'reminders' && (
          <MedicineReminders
            reminders={reminders}
            customers={customers}
            store={store}
            onSaveReminder={handleSaveReminder}
            onUpdateReminder={handleUpdateReminder}
            onDeleteReminder={handleDeleteReminder}
            onGoToBillForCustomer={handleGoToBillForCustomer}
          />
        )}

        {activeTab === 'history' && (
          <SalesHistory
            bills={bills}
            customers={customers}
            store={store}
          />
        )}

        {activeTab === 'settings' && (
          <StoreSettings
            store={store}
            onSaveStore={handleSaveStore}
            onRefreshAllData={refreshAllData}
            onOpenStoreManager={() => setIsStoreManagerOpen(true)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar - Slides away smoothly when keyboard is open / typing */}
      <nav 
        aria-label="Mobile Navigation" 
        className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1.5 flex items-center justify-around shadow-lg transition-transform duration-200 ${
          isTyping ? 'translate-y-full pointer-events-none opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <button
          type="button"
          onClick={() => setActiveTab('pos')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'pos' ? 'text-emerald-700 font-bold' : 'text-slate-500'
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">बिल (POS)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tabs')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'tabs' ? 'text-emerald-700 font-bold' : 'text-slate-500'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">टैब्स</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reminders')}
          className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'reminders' ? 'text-teal-700 font-bold' : 'text-slate-500'
          }`}
        >
          <Bell className="w-4 h-4" />
          {dueRemindersCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
          )}
          <span className="text-[10px] mt-0.5">रिमाइंडर</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'customers' ? 'text-emerald-700 font-bold' : 'text-slate-500'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">ग्राहक</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'settings' ? 'text-emerald-700 font-bold' : 'text-slate-500'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">प्रोफाइल</span>
        </button>
      </nav>

      {/* Shop Profile Modal */}
      <RegisterStoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        store={store}
        onSaveStore={handleSaveStore}
      />

      {/* Multi-Store Manager Modal (Option 1 Architecture) */}
      <StoreManagerModal
        isOpen={isStoreManagerOpen}
        onClose={() => setIsStoreManagerOpen(false)}
        onStoreSwitched={(newStore) => {
          setStore(newStore);
          refreshAllData();
        }}
      />

      {/* Authentication & Pharmacy Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">MedPoints Loyalty & Refill System</span>
            <span>·</span>
            <span>Made for Medical Stores & Pharmacies</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>2-Day Advance Refill Alert</span>
            <span>·</span>
            <span>Pure Hindi WhatsApp</span>
            <span>·</span>
            <span>₹100 = 1 Point Default</span>
            <span>·</span>
            <span>Min 50 Pts Redeem</span>
            <span>·</span>
            <button
              onClick={() => setIsStoreModalOpen(true)}
              className="text-emerald-700 font-semibold hover:underline cursor-pointer"
            >
              Shop Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
