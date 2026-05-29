import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      loginTitle: "Driver Portal Login",
      enterPin: "Enter Your Security PIN",
      invalidPin: "Incorrect PIN. Please try again.",
      loginBtn: "Login",
      languageToggle: "اردو",
      
      // Dashboard
      dashboardTitle: "Driver Route Map",
      welcomeDriver: "Welcome, Driver!",
      startShiftPrompt: "Enter Odometer for Check-out / Dispatch",
      odometerPlaceholder: "Current Odometer (km)",
      startShiftBtn: "Check-out / Dispatch & Open Gate Pass",
      activeShiftInfo: "Active Shift",
      truckPlate: "Truck Plate",
      stopList: "Assigned Customer Deliveries",
      arriveAtStop: "Arrive at Customer Delivery",
      deliveringTo: "Delivering to",
      completed: "Completed",
      startRoute: "Start Route Dispatch",
      
      // Delivery dialog
      deliveryDetails: "Customer Delivery & Cylinder Exchange",
      fullsDelivered: "Delivered Full Cylinders",
      emptiesRecovered: "Recovered Empty Cylinders/Shells",
      customerSign: "Customer Signature",
      signHere: "Tap to sign screen",
      clearSign: "Clear Signature",
      paymentCapture: "Collect Payment",
      
      // Payment Options
      paymentMethod: "Select Payment Method",
      cash: "Cash on Delivery",
      cheque: "Cheque Payment",
      credit: "Credit Account (B2B)",
      collectCash: "Collect Cash Amount (Rs.)",
      chequeNum: "Cheque Number",
      chequePhoto: "Perform Cheque Image Capture",
      photoUploaded: "Photo Uploaded successfully",
      photoRequired: "Receipt/Cheque Photo is Mandatory",
      confirmDelivery: "Submit Event (Confirm)",
      
      // Expense logger
      logExpense: "Record Trip Expense",
      expenseCategory: "Expense Category",
      expenseAmount: "Cost Amount (Rs.)",
      fuelOdo: "Fuel Station Odometer (km)",
      receiptPhoto: "Perform Payment Receipt Capture",
      submitExpense: "Submit Expense Claim",
      expenseList: "Shift Expenses Logged",
      
      // Shift close
      shiftClose: "Driver Settlement / Shift Reconciliation & EOD Close",
      cashInBag: "Total Cash in Bag (Rs.)",
      fullsRemaining: "Full Cylinders Remaining",
      emptiesCollected: "Empty Cylinders / Shells Collected",
      closeShiftBtn: "Driver Settlement & Return to Warehouse",
      shiftAwaitingVerification: "Shift Closed. Awaiting Verification.",
      shiftBlocked: "Locked! Driver Settlement Cash/Asset Dispute. Please Contact Office.",
      
      // Sync outbox
      syncStatus: "Sync Engine Controller",
      offlineMode: "Simulate Offline Mode",
      onlineStatus: "Device Online (Sync Connected)",
      offlineStatus: "Device Offline (Queue Logs events locally)",
      unsyncedCount: "Pending Events in Outbox Queue",
      syncBtn: "Trigger Outbox Upload Sync",
      logsTitle: "Local Outbox Queue Log"
    }
  },
  ur: {
    translation: {
      loginTitle: "ڈرائیور پورٹل لاگ ان",
      enterPin: "اپنا سیکیورٹی پن درج کریں",
      invalidPin: "غلط پن۔ دوبارہ کوشش کریں۔",
      loginBtn: "لاگ ان کریں",
      languageToggle: "English",
      
      // Dashboard
      dashboardTitle: "ڈرائیور روٹ میپ",
      welcomeDriver: "خوش آمدید، ڈرائیور!",
      startShiftPrompt: "چیک آؤٹ / ڈسپیچ شروع کرنے کے لیے اوڈومیٹر درج کریں",
      odometerPlaceholder: "موجودہ اوڈومیٹر (کلومیٹر)",
      startShiftBtn: "چیک آؤٹ / ڈسپیچ شروع کریں اور گیٹ پاس کھولیں",
      activeShiftInfo: "فعال شفٹ",
      truckPlate: "ٹرک نمبر",
      stopList: "تفویض کردہ گاہک ڈلیوری / سٹاپ",
      arriveAtStop: "ڈلیوری سٹاپ پر پہنچ گئے",
      deliveringTo: "ڈلیوری برائے",
      completed: "مکمل ہو گیا",
      startRoute: "روٹ ڈسپیچ شروع کریں",
      
      // Delivery dialog
      deliveryDetails: "گاہک ڈلیوری اور سلنڈر کا تبادلہ",
      fullsDelivered: "بھرے سلنڈر پہنچائے گئے",
      emptiesRecovered: "خالی سلنڈر / شیلز واپس لیے گئے",
      customerSign: "گاہک کے دستخط",
      signHere: "اسکرین پر دستخط کریں",
      clearSign: "دستخط صاف کریں",
      paymentCapture: "ادائیگی وصول کریں",
      
      // Payment Options
      paymentMethod: "ادائیگی کا طریقہ منتخب کریں",
      cash: "نقد رقم ڈلیوری پر (COD)",
      cheque: "چیک کے ذریعے ادائیگی",
      credit: "ادھار اکاؤنٹ (B2B)",
      collectCash: "نقد رقم جمع کریں (Rs.)",
      chequeNum: "چیک نمبر",
      chequePhoto: "چیک کی تصویر لیں (امیج کیپچر)",
      photoUploaded: "تصویر کامیابی سے اپ لوڈ ہو گئی",
      photoRequired: "رسید/چیک کی تصویر لازمی ہے",
      confirmDelivery: "آرڈر مکمل کریں (تصدیق)",
      
      // Expense logger
      logExpense: "سفر کے اخراجات درج کریں",
      expenseCategory: "اخراجات کا زمرہ",
      expenseAmount: "لاگت رقم (Rs.)",
      fuelOdo: "فیول اسٹیشن اوڈومیٹر (کلومیٹر)",
      receiptPhoto: "رسید کی تصویر لیں (پیمنٹ رسید کیپچر)",
      submitExpense: "اخراجات کا دعوی جمع کریں",
      expenseList: "شفٹ میں درج اخراجات",
      
      // Shift close
      shiftClose: "ڈرائیور سیٹلمنٹ اور شفٹ کی مفاہمت اور EOD بند کریں",
      cashInBag: "بیگ میں کل نقد رقم (Rs.)",
      fullsRemaining: "باقی بھرے سلنڈر",
      emptiesCollected: "جمع شدہ خالی سلنڈر / شیلز",
      closeShiftBtn: "ڈرائیور سیٹلمنٹ مکمل کریں اور گودام واپس جائیں",
      shiftAwaitingVerification: "شفٹ بند ہو گئی۔ تصدیق کے انتظار میں۔",
      shiftBlocked: "لاک ہو گیا! ڈرائیور سیٹلمنٹ نقد/سلنڈر تنازعہ۔ دفتر سے رابطہ کریں۔",
      
      // Sync outbox
      syncStatus: "سنکرونائزیشن انجن",
      offlineMode: "آف لائن موڈ کی نقل کریں",
      onlineStatus: "ڈیوائس آن لائن (منسلک ہے)",
      offlineStatus: "ڈیوائس آف لائن (واقعات مقامی طور پر لاگ ہوتے ہیں)",
      unsyncedCount: "آؤٹ باکس قطار میں التوا میں واقعات",
      syncBtn: "آؤٹ باکس اپ لوڈ شروع کریں",
      logsTitle: "مقامی آؤٹ باکس لاگ"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
