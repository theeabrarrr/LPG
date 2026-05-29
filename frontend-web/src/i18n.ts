import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      dashboard: "Dashboard",
      customerRegistry: "Customer Registry",
      tripDispatch: "Route Dispatch / Loadout Console",
      shiftReconciliation: "Driver Settlement / Shift Reconciliation",
      financialLedgers: "Financial Ledgers",
      expenseManager: "Expense Manager",
      
      // Global metrics
      globalSales: "Global Sales",
      activeTrucks: "Active Trucks",
      outstandingReceivables: "Accounts Receivable Aging Outstanding",
      openDisputes: "Open Disputes",
      recentNotifications: "Recent Notifications",
      
      // Customer Registry
      registerCustomer: "Register Customer",
      customerList: "Customer List",
      name: "Name",
      email: "Email",
      phone: "Phone",
      address: "Address",
      creditLimit: "Credit Limit (Rs.)",
      creditBalance: "Outstanding Balance (Rs.)",
      availableCredit: "Available Credit (Rs.)",
      cylinderLiability: "Customer Cylinder Balance / Liability",
      status: "Status",
      actions: "Actions",
      active: "Active",
      blocked: "Blocked",
      suspended: "Suspended",
      saveCustomer: "Save Customer",
      blockCustomer: "Block",
      unblockCustomer: "Activate",
      
      // Trip Dispatch
      buildTrip: "Build Delivery Route",
      draftOrders: "Draft Orders Queue",
      assignDriver: "Assign Driver & Truck",
      driver: "Driver",
      truck: "Truck License Plate",
      cargoInventory: "Verify Truck Loaded Stock",
      startFull: "Initial Full Cylinders Loaded",
      startEmpty: "Initial Empty Cylinders Loaded",
      createShift: "Generate Gate Pass & Route Dispatch",
      quantity: "Qty",
      assign: "Assign",
      activeTrips: "Active Outbound Fleet",
      truckId: "Truck ID",
      expectedCash: "Expected Cash (Rs.)",
      shiftStatus: "Shift Status",
      
      // Shift Reconciliation
      reconciliationTitle: "Driver Settlement / Shift Reconciliation Audits",
      expectedVsPhysical: "Expected vs Physical Cash",
      cylinderVariance: "Cylinder Ledger Inventory / Cash Variance",
      loggedExpenses: "Trip Outbox Road Expenses",
      physicalCash: "Physical Cash Returned (Rs.)",
      cashVariance: "Inventory / Cash Variance (Rs.)",
      emptyVariance: "Empty Cylinder / Shells Variance",
      reconcileShift: "Approve Driver Settlement / Shift Reconciliation",
      disputeShift: "Mark as Disputed / Lock",
      returnedFulls: "Returned Full Cylinders",
      returnedEmpties: "Returned Empty Cylinders / Shells",
      
      // Expenses
      expenseClaims: "Expense Claims Review",
      category: "Category",
      amount: "Amount (Rs.)",
      odometer: "Odometer Reading (km)",
      receiptHash: "Receipt Hash (Image)",
      approvedBy: "Approved By",
      approve: "Approve",
      reject: "Reject",
      
      // Ledger
      ledgerEntries: "Double-Entry Bookkeeping Ledger Logs",
      batchId: "Batch ID / Transaction UUID",
      debit: "Debit (Rs.)",
      credit: "Credit (Rs.)",
      accountBalance: "Chart of Accounts Balances",
      accountName: "Account Name",
      code: "Code",
      type: "Type"
    }
  },
  ur: {
    translation: {
      dashboard: "ڈیش بورڈ",
      customerRegistry: "کسٹمر رجسٹر",
      tripDispatch: "روٹ ڈسپیچ / لوڈ آؤٹ کنسول",
      shiftReconciliation: "ڈرائیور سیٹلمنٹ / شفٹ کی مفاہمت",
      financialLedgers: "مالیاتی لیجر",
      expenseManager: "اخراجات کے مینیجر",
      
      // Global metrics
      globalSales: "کل فروخت",
      activeTrucks: "فعال ٹرک",
      outstandingReceivables: "حساباتِ وصولی کی عمر رسیدہ بقایا جات",
      openDisputes: "کھلے تنازعات",
      recentNotifications: "حالیہ اطلاعات",
      
      // Customer Registry
      registerCustomer: "کسٹمر رجسٹر کریں",
      customerList: "گاہکوں کی فہرست",
      name: "نام",
      email: "ای میل",
      phone: "فون نمبر",
      address: "پتہ",
      creditLimit: "ادھار کی حد (Rs.)",
      creditBalance: "بقایا ادھار (Rs.)",
      availableCredit: "دستیاب ادھار (Rs.)",
      cylinderLiability: "کسٹمر سلنڈر بیلنس / ذمہ داری",
      status: "حالت",
      actions: "اقدامات",
      active: "فعال",
      blocked: "بلاک شدہ",
      suspended: "معطل شدہ",
      saveCustomer: "گاہک محفوظ کریں",
      blockCustomer: "بلاک کریں",
      unblockCustomer: "فعال کریں",
      
      // Trip Dispatch
      buildTrip: "ڈلیوری روٹ بنائیں",
      draftOrders: "ڈرافٹ آرڈرز قطار",
      assignDriver: "ڈرائیور اور ٹرک مختص کریں",
      driver: "ڈرائیور",
      truck: "ٹرک لائسنس پلیٹ",
      cargoInventory: "لوڈ شدہ اسٹاک کی تصدیق",
      startFull: "ابتدائی لوڈ شدہ بھرے سلنڈر",
      startEmpty: "ابتدائی لوڈ شدہ خالی سلنڈر",
      createShift: "گیٹ پاس بنائیں اور روٹ روانہ کریں",
      quantity: "مقدار",
      assign: "مختص کریں",
      activeTrips: "روانہ ہونے والا فعال بیڑا",
      truckId: "ٹرک نمبر",
      expectedCash: "متوقع نقد رقم (Rs.)",
      shiftStatus: "شفٹ کی حالت",
      
      // Shift Reconciliation
      reconciliationTitle: "ڈرائیور سیٹلمنٹ اور شفٹ آڈٹ",
      expectedVsPhysical: "متوقع بمقابلہ وصول شدہ نقد",
      cylinderVariance: "سلنڈر لیجر انوینٹری / کیش کا فرق",
      loggedExpenses: "سفر کے اخراجات کا ریکارڈ",
      physicalCash: "واپس کی گئی نقد رقم (Rs.)",
      cashVariance: "انوینٹری / نقد رقم کا فرق (Rs.)",
      emptyVariance: "خالی سلنڈر / شیلز کا فرق",
      reconcileShift: "ڈرائیور سیٹلمنٹ اور شفٹ کی مفاہمت کی منظوری دیں",
      disputeShift: "متنازعہ قرار دیں اور لاک کریں",
      returnedFulls: "واپس آنے والے بھرے سلنڈر",
      returnedEmpties: "واپس آنے والے خالی سلنڈر / شیلز",
      
      // Expenses
      expenseClaims: "اخراجات کے دعووں کا جائزہ",
      category: "زمرہ",
      amount: "رقم (Rs.)",
      odometer: "اوڈومیٹر ریڈنگ (کلومیٹر)",
      receiptHash: "رسید ہیش (تصویر)",
      approvedBy: "منظور کنندہ",
      approve: "منظور کریں",
      reject: "مسترد کریں",
      
      // Ledger
      ledgerEntries: "ڈبل انٹری بک کیپنگ لیجر لاگز",
      batchId: "بیچ آئی ڈی / ٹرانزیکشن UUID",
      debit: "ڈیبٹ (Rs.)",
      credit: "کریڈٹ (Rs.)",
      accountBalance: "چارٹ آف اکاؤنٹس بیلنس",
      accountName: "اکاؤنٹ کا نام",
      code: "کوڈ",
      type: "قسم"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
