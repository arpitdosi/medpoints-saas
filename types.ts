export interface StoreProfile {
  id: string;
  storeName: string;
  ownerName: string;
  phone: string;
  email?: string;
  address: string;
  dlNumber?: string; // Drug License Number
  gstin?: string;
  minRedeemPoints: number; // e.g. 50
  pointValueInRs: number; // e.g. 1 (1 point = ₹1)
  whatsappMessageTemplate: string;
  redeemMessageTemplate: string;
  medicineReminderTemplate: string;
  currencySymbol: string;
  registeredAt: string;
  adminPin?: string;
  // Multi-Store SaaS Distribution
  pin: string; // 4-digit PIN password for pharmacy owner login
  status?: 'active' | 'blocked' | 'trial';
  storeCode?: string; // Short code e.g. "SM01"
  cloudStatus?: 'local' | 'synced' | 'pending';
  planType?: 'Trial' | 'Standard' | 'Premium';
  subscriptionExpiry?: string;
  notes?: string;
}

export interface AuthSession {
  isLoggedIn: boolean;
  role: 'super_admin' | 'store_owner' | 'guest';
  mobile: string;
  storeId?: string;
  storeName?: string;
  ownerName?: string;
  isSuperAdmin?: boolean;
  viewingAsStoreId?: string; // If super admin is previewing a store
}

export interface StoreSummary {
  id: string;
  storeName: string;
  ownerName: string;
  phone: string;
  address: string;
  dlNumber?: string;
  customerCount: number;
  billCount: number;
  totalSales: number;
  registeredAt: string;
  isActive: boolean;
}

export interface CategoryTab {
  id: string;
  name: string;
  hindiName?: string;
  description: string;
  isLoyaltyEligible: boolean;
  pointsPerHundred: number; // e.g. 1 means 1 point for every ₹100 (1%)
  color: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'teal' | 'indigo';
  icon: string;
  order: number;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  currentPoints: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  totalSpent: number;
  totalBills: number;
  firstVisit: string;
  lastVisit: string;
  notes?: string;
}

export interface BillItem {
  tabId: string;
  tabName: string;
  amount: number;
  isLoyaltyEligible: boolean;
  pointsPerHundred: number;
  pointsEarned: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  date: string;
  items: BillItem[];
  subtotal: number;
  pointsRedeemed: number;
  discountFromPoints: number;
  finalAmount: number;
  pointsEarned: number;
  pointsBalanceAfter: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Credit';
  notes?: string;
}

export interface PointTransaction {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  type: 'EARNED' | 'REDEEMED' | 'ADJUSTMENT';
  points: number;
  billId?: string;
  billNumber?: string;
  notes: string;
  balanceAfter: number;
}

export interface MedicineReminder {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  medicineName: string; // e.g. "Thyronorm 50mcg (Thyroid)" or "Atorvastatin 10mg (Cholesterol)"
  category: 'Thyroid' | 'Cholesterol' | 'Blood Pressure' | 'Diabetes' | 'Heart' | 'General';
  daysSupply: number; // e.g. 30 (1 month)
  startDate: string;
  nextDueDate: string; // startDate + daysSupply
  alertBeforeDays: number; // default 2 days before
  status: 'ACTIVE' | 'DUE' | 'REFILLED' | 'STOPPED';
  lastReminderSentAt?: string;
  reminderCount: number;
  notes?: string;
}
