import React, { useState, useEffect } from 'react';
import './App.css';
import './i18n';
import { useTranslation } from 'react-i18next';
import { MobileFrame } from './components/MobileFrame';
import { LoginScreen } from './components/LoginScreen';
import { DriverDashboard } from './components/DriverDashboard';
import { OrderHistory } from './components/OrderHistory';
import { DriverProfile } from './components/DriverProfile';
import { DeliveryLog } from './components/DeliveryLog';
import { PaymentCapture } from './components/PaymentCapture';
import { ExpenseLogger } from './components/ExpenseLogger';
import { ShiftSummary } from './components/ShiftSummary';
import { RecoveryDashboard } from './components/RecoveryDashboard';
import {
  Package,
  ClipboardList,
  User,
  Coins,
  LogOut,
} from 'lucide-react';

const API_BASE = 'http://localhost:3000';
const MOBILE_SESSION_KEY = 'lpg_mobile_session';


interface SyncEvent {
  event: string;
  seq: number;
  uuid: string;
  endpoint: string;
  method: 'POST' | 'PATCH';
  body: any;
}

type DriverTab = 'orders' | 'history' | 'profile';

export default function App() {
  const { t, i18n } = useTranslation();

  // Auth
  const [driver, setDriver]     = useState<any | null>(null);
  const [role, setRole]         = useState<'DRIVER' | 'RECOVERY_AGENT' | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tenantId, setTenantId] = useState<string>('');
  const [loginError, setLoginError] = useState('');


  // Navigation
  const [view, setView]         = useState<'login' | 'delivery' | 'payment' | 'expenses' | 'close_summary' | 'recovery'>('login');
  const [driverTab, setDriverTab] = useState<DriverTab>('orders');

  // Operational data
  const [activeShift, setActiveShift]     = useState<any | null>(null);
  const [stops, setStops]                 = useState<any[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [debtors, setDebtors]             = useState<any[]>([]);
  const [loggedExpenses, setLoggedExpenses] = useState<any[]>([]);
  const [deliveryData, setDeliveryData]   = useState<any>(null);

  // Language
  const [lang, setLang] = useState('en');

  // Offline / sync engine
  const [isOffline, setIsOffline]   = useState(false);
  const [outbox, setOutbox]         = useState<SyncEvent[]>([]);
  const [syncLogs, setSyncLogs]     = useState<string[]>([]);
  const [backendActive, setBackendActive] = useState(false);

  // ────────────────────────────────────────────────
  // BACKEND HEALTH CHECK
  // ────────────────────────────────────────────────
  const checkBackend = async () => {
    try {
      // Use auth/status endpoint which doesn't need tenantId
      const ping = await fetch(`${API_BASE}/auth/status`);
      setBackendActive(ping.ok);
    } catch {
      setBackendActive(false);
    }
  };

  // Restore session on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(MOBILE_SESSION_KEY);
    if (saved) {
      try {
        const sess = JSON.parse(saved);
        setDriver({ id: sess.userId, name: sess.name });
        setRole(sess.role);
        setTenantId(sess.tenantId);
        setIsLoggedIn(true);
        if (sess.role === 'DRIVER') setDriverTab('orders');
        else setView('recovery');
      } catch {}
    }
  }, []);


  useEffect(() => {
    checkBackend();
    const id = setInterval(checkBackend, 5000);
    return () => clearInterval(id);
  }, []);

  // ────────────────────────────────────────────────
  // FETCH STOPS & DEBTORS after login
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchData = async () => {
      try {
        if (role === 'DRIVER' && driver) {
          // Fetch active shift
          const sRes = await fetch(`${API_BASE}/shifts/active/${driver.id}`);
          if (sRes.ok) {
            const shiftData = await sRes.json();
            setActiveShift(shiftData);

            // Fetch orders assigned to this shift
            const oRes = await fetch(`${API_BASE}/orders/tenant/${tenantId}`);
            if (oRes.ok) {
              const allOrders = await oRes.json();
              const myOrders = allOrders.filter((o: any) => o.shiftSessionId === shiftData?.id || o.status === 'ASSIGNED');
              setStops(myOrders.map((o: any) => ({
                id: o.id, customerName: o.customer?.name || 'Unknown Customer',
                address: o.customer?.address || 'No Address', quantity: o.quantity,
                totalAmount: o.totalAmount, status: o.status, paymentTerms: o.paymentTerms,
              })));
            }

            // Fetch expenses for this shift
            const eRes = await fetch(`${API_BASE}/expenses/shift/${shiftData.id}`);
            if (eRes.ok) setLoggedExpenses(await eRes.json());
          } else {
            setActiveShift(null);
            setStops([]);
          }
        } else if (role === 'RECOVERY_AGENT') {
          const cRes = await fetch(`${API_BASE}/customer/tenant/${tenantId}`);
          if (cRes.ok) {
            const allCustomers = await cRes.json();
            setDebtors(allCustomers.filter((c: any) => c.creditBalance > 0));
          }
        }
      } catch (err) {
        console.error('Fetch failed, staying in cached state:', err);
      }

    };



    fetchData();
    const id = setInterval(fetchData, 5000);
    return () => clearInterval(id);
  }, [isLoggedIn, role, driver, backendActive]);

  // ────────────────────────────────────────────────
  // LANGUAGE TOGGLE
  // ────────────────────────────────────────────────
  const handleLanguageToggle = () => {
    const next = lang === 'en' ? 'ur' : 'en';
    setLang(next);
    i18n.changeLanguage(next);
  };

  // ────────────────────────────────────────────────
  // AUTH — PIN LOGIN
  // ────────────────────────────────────────────────
  const handleLogin = async (pin: string): Promise<boolean> => {
    setLoginError('');
    try {
      // First get the tenant list (works for single-tenant deployment)
      let tid = tenantId;
      if (!tid) {
        const tRes = await fetch(`${API_BASE}/auth/tenants`);
        if (tRes.ok) {
          const tenants = await tRes.json();
          if (tenants.length > 0) tid = tenants[0].id;
        }
      }
      if (!tid) { setLoginError('No company found. Ask your admin to complete setup.'); return false; }

      const res = await fetch(`${API_BASE}/auth/login/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, tenantId: tid }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setLoginError(errData.message || 'Invalid PIN. Please try again.');
        return false;
      }

      const data = await res.json();
      const user = data.user;

      // Store session
      const sess = { userId: user.id, name: user.name, role: user.role, tenantId: user.tenantId };
      sessionStorage.setItem(MOBILE_SESSION_KEY, JSON.stringify(sess));

      setDriver({ id: user.id, name: user.name });
      setRole(user.role as 'DRIVER' | 'RECOVERY_AGENT');
      setTenantId(user.tenantId);
      setIsLoggedIn(true);

      if (user.role === 'DRIVER') setDriverTab('orders');
      else setView('recovery');
      return true;

    } catch {
      setLoginError('Cannot connect to server. Check your connection.');
      return false;
    }
  };


  // ────────────────────────────────────────────────
  // DELIVERY FLOW
  // ────────────────────────────────────────────────
  const handleGoToPayment = (data: any) => {
    setDeliveryData(data);
    setView('payment');
  };

  const handleDeliverySubmit = async (pmtDto: any) => {
    const stop = stops.find(s => s.id === selectedStopId);
    if (!stop) return;

    const deliveryPayload = {
      orderId:           stop.id,
      deliveredQuantity: deliveryData.deliveredQuantity,
      recoveredQuantity: deliveryData.recoveredQuantity,
      customerSignature: deliveryData.signature,
      paymentTerms:      pmtDto.paymentMethod,
      collectedAmount:   pmtDto.collectedAmount,
      receiptUrl:        pmtDto.receiptUrl,
      chequeNumber:      pmtDto.chequeNumber,
    };

    if (isOffline) {
      const evt: SyncEvent = {
        event: 'LOG_DELIVERY', seq: outbox.length + 1,
        uuid: 'evt-' + Date.now(), endpoint: '/shifts/delivery', method: 'POST',
        body: deliveryPayload,
      };
      setOutbox([...outbox, evt]);
      setSyncLogs(p => [`[Outbox] LOG_DELIVERY queued — Seq ${evt.seq}`, ...p]);
      setStops(stops.map(s => s.id === selectedStopId ? { ...s, status: 'DELIVERED_UNVERIFIED' } : s));
    } else {
      const res = await fetch(`${API_BASE}/shifts/delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deliveryPayload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Delivery logging failed');
      }
      setStops(stops.map(s => s.id === selectedStopId ? { ...s, status: 'DELIVERED_UNVERIFIED' } : s));
      if (activeShift && (pmtDto.paymentMethod === 'CASH_ON_DELIVERY' || pmtDto.paymentMethod === 'CHEQUE_ON_DELIVERY')) {
        setActiveShift((prev: any) => prev ? { ...prev, expectedCash: prev.expectedCash + pmtDto.collectedAmount } : null);
      }
      setSyncLogs(p => [`[API] Delivery confirmed for ${stop.customerName}. Status → DELIVERED_UNVERIFIED`, ...p]);
    }

    setView('login'); // return to driver bottom-nav context
    setDriverTab('orders');
  };

  // ────────────────────────────────────────────────
  // EXPENSE FLOW
  // ────────────────────────────────────────────────
  const handleExpenseSubmit = async (expDto: any) => {
    const payload = {
      tenantId:       tenantId,

      shiftSessionId: activeShift?.id,
      category:       expDto.category,
      amount:         expDto.amount,
      description:    expDto.description,
      receiptUrl:     expDto.receiptUrl,
      receiptHash:    expDto.receiptHash,
    };

    if (isOffline) {
      const evt: SyncEvent = {
        event: 'LOG_EXPENSE', seq: outbox.length + 1,
        uuid: 'evt-' + Date.now(), endpoint: '/expenses', method: 'POST', body: payload,
      };
      setOutbox([...outbox, evt]);
      setSyncLogs(p => [`[Outbox] LOG_EXPENSE queued — Rs. ${expDto.amount}`, ...p]);
      setLoggedExpenses([...loggedExpenses, { ...payload, id: 'exp-' + Date.now(), status: 'AWAITING_APPROVAL', createdAt: new Date().toISOString() }]);
    } else {
      const res = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Expense submission failed');
      }
      const data = await res.json();
      setLoggedExpenses([...loggedExpenses, data]);
      setSyncLogs(p => [`[API] Expense logged — Rs. ${data.amount}. Awaiting approval.`, ...p]);
    }

    setView('login');
    setDriverTab('orders');
  };

  // ────────────────────────────────────────────────
  // SHIFT CLOSE (EOD)
  // ────────────────────────────────────────────────
  const handleCloseShift = async (dto: { endFull: number; endEmpty: number }) => {
    if (!activeShift) return;

    const payload = {
      physicalCashCollected: activeShift.expectedCash,
      endFullCylinders:      dto.endFull,
      endEmptyCylinders:     dto.endEmpty,
      reconciliationNotes:   'Driver EOD Settlement submitted via mobile app.',
    };

    if (isOffline) {
      const evt: SyncEvent = {
        event: 'CLOSE_SHIFT', seq: outbox.length + 1,
        uuid: 'evt-' + Date.now(), endpoint: `/shifts/${activeShift.id}/close`, method: 'POST', body: payload,
      };
      setOutbox([...outbox, evt]);
      setSyncLogs(p => [`[Outbox] CLOSE_SHIFT queued — Seq ${evt.seq}`, ...p]);
      setActiveShift(null);
    } else {
      const res = await fetch(`${API_BASE}/shifts/${activeShift.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Shift closing failed');
      }
      setSyncLogs(p => [`[API] Driver Settlement complete. Session RECONCILED.`, ...p]);
      setActiveShift(null);
      setStops([]);
      setLoggedExpenses([]);
    }

    setView('login');
    setDriverTab('orders');
  };

  // ────────────────────────────────────────────────
  // RECOVERY AGENT COLLECTION
  // ────────────────────────────────────────────────
  const onSubmitCollection = async (dto: any) => {
    const payload = {
      tenantId:        tenantId,

      description:     `AR Collection: ${dto.paymentMethod} — Rs. ${dto.collectedAmount}`,
      transactionType: 'GENERAL_ADJUSTMENT',
      entries: [
        { accountId: 'acc-1', debit: dto.collectedAmount, credit: 0 },
        { accountId: 'acc-2', debit: 0, credit: dto.collectedAmount, customerId: dto.customerId },
      ],
    };

    if (isOffline) {
      const evt: SyncEvent = {
        event: 'RECOVERY_COLLECTION', seq: outbox.length + 1,
        uuid: 'evt-' + Date.now(), endpoint: '/ledger/entries', method: 'POST', body: payload,
      };
      setOutbox([...outbox, evt]);
      setSyncLogs(p => [`[Outbox] RECOVERY_COLLECTION queued — Rs. ${dto.collectedAmount}`, ...p]);
      setDebtors(debtors.map(d => d.id === dto.customerId ? { ...d, creditBalance: d.creditBalance - dto.collectedAmount } : d));
    } else {
      const res = await fetch(`${API_BASE}/ledger/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Collection failed');
      }
      setDebtors(debtors.map(d => d.id === dto.customerId ? { ...d, creditBalance: Math.max(0, d.creditBalance - dto.collectedAmount) } : d));
      setSyncLogs(p => [`[API] Collection posted — Rs. ${dto.collectedAmount} credited.`, ...p]);
    }
  };

  // ────────────────────────────────────────────────
  // OUTBOX SYNC ENGINE
  // ────────────────────────────────────────────────
  const handleSyncOutbox = async () => {
    if (isOffline || outbox.length === 0) return;
    setSyncLogs(p => [`[Sync Engine] Starting outbox upload...`, ...p]);

    const sorted = [...outbox].sort((a, b) => a.seq - b.seq);
    let ok = 0;

    for (const evt of sorted) {
      setSyncLogs(p => [`[Sync Engine] Uploading seq ${evt.seq} (${evt.event})...`, ...p]);
      try {
        const res = await fetch(`${API_BASE}${evt.endpoint}`, {
          method: evt.method,
          headers: { 'Content-Type': 'application/json', 'x-idempotency-key': evt.uuid },
          body: JSON.stringify(evt.body),
        });
        if (res.ok) {
          ok++;
          setSyncLogs(p => [`[Sync Engine] Seq ${evt.seq} → OK`, ...p]);
        } else {
          const text = await res.text();
          setSyncLogs(p => [`[Sync Engine Error] Seq ${evt.seq} failed: ${text}`, ...p]);
          break;
        }
      } catch {
        setSyncLogs(p => [`[Sync Engine] Connection lost. Will retry.`, ...p]);
        break;
      }
    }

    setOutbox(outbox.slice(ok));
  };

  const handleToggleOffline = () => {
    const next = !isOffline;
    setIsOffline(next);
    if (!next) setTimeout(handleSyncOutbox, 500);
  };

  // ────────────────────────────────────────────────
  // LOGOUT
  // ────────────────────────────────────────────────
  const handleLogout = () => {
    setDriver(null);
    setRole(null);
    setIsLoggedIn(false);
    setActiveShift(null);
    setStops([]);
    setDebtors([]);
    setLoggedExpenses([]);
    setOutbox([]);
    setSyncLogs([]);
    setView('login');
    setDriverTab('orders');
  };

  // ────────────────────────────────────────────────
  // RENDER DRIVER BOTTOM-NAV SCREEN
  // ────────────────────────────────────────────────
  const renderDriverScreen = () => {
    if (view === 'delivery' && selectedStopId) {
      return (
        <DeliveryLog
          stop={stops.find(s => s.id === selectedStopId)!}
          onBack={() => { setView('login'); setDriverTab('orders'); }}
          onGoToPayment={handleGoToPayment}
        />
      );
    }

    if (view === 'payment' && selectedStopId) {
      return (
        <PaymentCapture
          stop={stops.find(s => s.id === selectedStopId)!}
          deliveredQuantity={deliveryData?.deliveredQuantity}
          recoveredQuantity={deliveryData?.recoveredQuantity}
          signature={deliveryData?.signature}
          onBack={() => setView('delivery')}
          onSubmit={handleDeliverySubmit}
        />
      );
    }

    if (view === 'expenses') {
      return (
        <ExpenseLogger
          onBack={() => { setView('login'); setDriverTab('orders'); }}
          onSubmitExpense={handleExpenseSubmit}
          loggedExpenses={loggedExpenses}
        />
      );
    }

    if (view === 'close_summary' && activeShift) {
      return (
        <ShiftSummary
          activeShift={activeShift}
          onBack={() => { setView('login'); setDriverTab('orders'); }}
          onCloseShift={handleCloseShift}
        />
      );
    }

    // Bottom-nav tabs
    if (driverTab === 'orders') {
      return (
        <DriverDashboard
          driverName={driver?.name || 'Driver'}
          activeShift={activeShift}
          stops={stops}
          onSelectStop={(id) => { setSelectedStopId(id); setView('delivery'); }}
          onGoToExpenses={() => setView('expenses')}
          onGoToShiftClose={() => setView('close_summary')}
        />
      );
    }

    if (driverTab === 'history') {
      return <OrderHistory stops={stops} activeShift={activeShift} />;
    }

    if (driverTab === 'profile') {
      return (
        <DriverProfile
          driver={driver}
          activeShift={activeShift}
          stops={stops}
          loggedExpenses={loggedExpenses}
          onLogout={handleLogout}
        />
      );
    }

    return null;
  };

  // ────────────────────────────────────────────────
  // BOTTOM NAVIGATION BAR
  // ────────────────────────────────────────────────
  const isSubView = ['delivery', 'payment', 'expenses', 'close_summary'].includes(view);

  const DriverBottomNav = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: '52px',
      borderTop: '1px solid var(--border-color)',
      background: 'rgba(28,28,30,0.95)',
      backdropFilter: 'blur(10px)',
      margin: 'auto -16px -20px -16px',
      paddingBottom: '4px',
    }}>
      {([
        { tab: 'orders',  label: 'Orders',  icon: <Package  size={20} /> },
        { tab: 'history', label: 'History', icon: <ClipboardList size={20} /> },
        { tab: 'profile', label: 'Profile', icon: <User size={20} /> },
      ] as { tab: DriverTab; label: string; icon: React.ReactNode }[]).map(({ tab, label, icon }) => {
        const isActive = driverTab === tab && !isSubView;
        return (
          <button
            key={tab}
            onClick={() => { setView('login'); setDriverTab(tab); }}
            style={{
              background: 'none',
              border: 'none',
              color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              fontSize: '0.6rem',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              padding: '0 0.5rem',
              letterSpacing: '0.02em',
              transition: 'color 0.15s ease',
            }}
          >
            {icon}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );

  const RecoveryBottomNav = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: '52px',
      borderTop: '1px solid var(--border-color)',
      background: 'rgba(28,28,30,0.95)',
      margin: 'auto -16px -20px -16px',
      paddingBottom: '4px',
    }}>
      <button
        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer' }}
      >
        <Coins size={20} />
        <span>Collections</span>
      </button>
      <button
        onClick={handleLogout}
        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.6rem', fontWeight: 600, cursor: 'pointer' }}
      >
        <LogOut size={20} />
        <span>Sign Out</span>
      </button>
    </div>
  );

  // ────────────────────────────────────────────────
  // MAIN RENDER
  // ────────────────────────────────────────────────
  return (
    <MobileFrame
      isOffline={isOffline}
      onToggleOffline={handleToggleOffline}
      syncQueueCount={outbox.length}
      onSync={handleSyncOutbox}
      syncLogs={syncLogs}
    >
      {/* LOGIN */}
      {!isLoggedIn && (
        <LoginScreen
          onLogin={handleLogin}
          onLanguageToggle={handleLanguageToggle}
          currentLang={lang}
        />
      )}

      {/* DRIVER SCREENS */}
      {isLoggedIn && role === 'DRIVER' && (
        <>
          {renderDriverScreen()}
          {!isSubView && <DriverBottomNav />}
        </>
      )}

      {/* RECOVERY AGENT SCREENS */}
      {isLoggedIn && role === 'RECOVERY_AGENT' && (
        <>
          <RecoveryDashboard
            agentName={driver?.name || 'Recovery Agent'}
            debtors={debtors}
            onSubmitCollection={onSubmitCollection}
          />
          <RecoveryBottomNav />
        </>
      )}
    </MobileFrame>
  );
}
