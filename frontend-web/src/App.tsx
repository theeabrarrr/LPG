import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import './i18n';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard as DashboardIcon,
  Users as UsersIcon,
  Navigation as NavigationIcon,
  ClipboardCheck as ClipboardIcon,
  DollarSign as DollarIcon,
  Layers as LayersIcon,
  Languages,
  ShieldCheck,
  Package,
  LogOut,
} from 'lucide-react';

import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { CustomerRegistry } from './components/CustomerRegistry';
import { TripDispatchConsole } from './components/TripDispatchConsole';
import { ShiftReconciliation } from './components/ShiftReconciliation';
import { ExpenseManager } from './components/ExpenseManager';
import { FinancialLedger } from './components/FinancialLedger';
import { InventoryManager } from './components/InventoryManager';
import { StaffRegistry } from './components/StaffRegistry';

const API_BASE = 'http://localhost:3000';
const SESSION_KEY = 'lpg_session';

type Tab = 'dashboard' | 'customers' | 'trips' | 'reconcile' | 'expenses' | 'ledger' | 'inventory' | 'staff';

interface Session {
  userId: string;
  tenantId: string;
  role: string;
  name: string;
  companyName: string;
}

// Map backend roles to frontend access roles
const mapRole = (backendRole: string): 'Owner' | 'Manager' | 'Accountant' | 'Inventory' | 'Operator' => {
  switch (backendRole) {
    case 'BUSINESS_OWNER': return 'Owner';
    case 'SUPER_ADMIN':    return 'Owner';
    case 'BACK_OFFICE':    return 'Operator';
    case 'ACCOUNTANT':     return 'Accountant';
    case 'WAREHOUSE_MANAGER': return 'Inventory';
    default:               return 'Manager';
  }
};

// Get initials from a name
const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

export default function App() {
  const { t, i18n } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [lang, setLang] = useState('en');

  // Derived from real session
  const tenantId  = session?.tenantId || '';
  const role      = session ? mapRole(session.role) : 'Owner';

  // Core data — always empty until loaded from backend
  const [customers,     setCustomers]     = useState<any[]>([]);
  const [orders,        setOrders]        = useState<any[]>([]);
  const [drivers,       setDrivers]       = useState<any[]>([]);
  const [activeShifts,  setActiveShifts]  = useState<any[]>([]);
  const [expenses,      setExpenses]      = useState<any[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [accounts,      setAccounts]      = useState<any[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [warehouses,    setWarehouses]    = useState<any[]>([]);
  const [warehouseStock,setWarehouseStock]= useState<any>(null);
  const [backendActive, setBackendActive] = useState(false);
  const [dataLoading,   setDataLoading]   = useState(false);

  // ── Restore session from localStorage ──
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try { setSession(JSON.parse(saved)); } catch {}
    }
  }, []);

  // ── Handle login ──
  const handleLogin = (sess: Session) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
    setSession(sess);
    setActiveTab('dashboard');
  };

  // ── Handle logout ──
  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setCustomers([]); setOrders([]); setDrivers([]);
    setActiveShifts([]); setExpenses([]); setLedgerEntries([]);
    setAccounts([]); setNotifications([]); setWarehouses([]);
    setWarehouseStock(null);
  };

  // ── Role access guard ──
  const canAccessTab = (tab: Tab) => {
    if (role === 'Owner' || role === 'Manager') return true;
    if (role === 'Accountant')  return ['dashboard', 'reconcile', 'expenses', 'ledger'].includes(tab);
    if (role === 'Inventory')   return ['dashboard', 'inventory'].includes(tab);
    if (role === 'Operator')    return ['dashboard', 'customers', 'trips'].includes(tab);
    return false;
  };

  // ── Stats from real data ──
  const getStats = () => {
    const globalSales = accounts.find((a: any) => a.code === '4000')?.balance || 0;
    const receivables  = accounts.find((a: any) => a.code === '1200')?.balance || 0;
    const activeTrucks = activeShifts.filter((s: any) => s.status === 'ACTIVE').length;
    const disputes     = activeShifts.filter((s: any) => s.status === 'DISPUTED').length;
    return { globalSales, activeTrucks, receivables, disputes };
  };

  // ── Language toggle ──
  const handleLanguageToggle = () => {
    const nextLang = lang === 'en' ? 'ur' : 'en';
    setLang(nextLang);
    i18n.changeLanguage(nextLang);
    document.body.dir = nextLang === 'ur' ? 'rtl' : 'ltr';
  };

  // ── Load all real data from backend ──
  const loadData = useCallback(async () => {
    if (!tenantId) return;
    try {
      setDataLoading(true);

      // Customers
      const customerRes = await fetch(`${API_BASE}/customer/tenant/${tenantId}`).then(r => r.json());
      setCustomers(Array.isArray(customerRes) ? customerRes : []);
      setBackendActive(true);

      // Warehouses + stock
      const warehousesRes = await fetch(`${API_BASE}/orders/warehouses/tenant/${tenantId}`).then(r => r.json());
      const whs = Array.isArray(warehousesRes) ? warehousesRes : [];
      setWarehouses(whs);
      if (whs.length > 0) {
        const pw = whs[0];
        setWarehouseStock({ id: pw.id, name: pw.name, fullCylinders: pw.fullCylinderStock, emptyCylinders: pw.emptyCylinderStock, damagedCylinders: pw.damagedCylinderStock });
      }

      // Orders
      const ordersRes = await fetch(`${API_BASE}/orders/tenant/${tenantId}`).then(r => r.json());
      setOrders((Array.isArray(ordersRes) ? ordersRes : []).map((o: any) => ({ ...o, customerName: o.customer?.name || 'Unknown' })));

      // Financial accounts & ledger
      const accountsRes = await fetch(`${API_BASE}/ledger/accounts/${tenantId}`).then(r => r.json());
      const accList = Array.isArray(accountsRes) ? accountsRes : [];
      setAccounts(accList);

      const ledgerRes = await fetch(`${API_BASE}/ledger/entries/${tenantId}`).then(r => r.json());
      setLedgerEntries((Array.isArray(ledgerRes) ? ledgerRes : []).map((e: any) => {
        const acc = accList.find((a: any) => a.id === e.accountId);
        return { ...e, accountName: acc?.name || e.accountId };
      }));

      // Expenses
      const expensesRes = await fetch(`${API_BASE}/expenses/tenant/${tenantId}`).then(r => r.json());
      setExpenses(Array.isArray(expensesRes) ? expensesRes : []);

      // Staff / Drivers (from real staff registry)
      const staffRes = await fetch(`${API_BASE}/staff/tenant/${tenantId}`).then(r => r.json());
      const staffList = Array.isArray(staffRes) ? staffRes : [];
      const realDrivers = staffList.filter((u: any) => u.role === 'DRIVER' && u.isActive).map((u: any) => ({ id: u.id, name: u.name }));
      setDrivers(realDrivers);

      // Active shifts for each driver
      const shiftsList: any[] = [];
      for (const d of realDrivers) {
        try {
          const s = await fetch(`${API_BASE}/shifts/active/${d.id}`);
          if (s.ok) {
            const sd = await s.json();
            if (sd) shiftsList.push({ ...sd, driverName: d.name });
          }
        } catch {}
      }
      setActiveShifts(shiftsList);

    } catch (err) {
      console.error('Backend error:', err);
      setBackendActive(false);
    } finally {
      setDataLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      loadData();
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [tenantId, loadData]);

  // ── Actions ── (all real API calls, no mock fallbacks)
  const handleAddCustomer = async (dto: any) => {
    const res = await fetch(`${API_BASE}/customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...dto, tenantId }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Customer registration failed'); }
    setNotifications(prev => [`New customer "${dto.name}" registered.`, ...prev]);
    loadData();
  };

  const handleUpdateCustomerStatus = async (id: string, status: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED') => {
    const res = await fetch(`${API_BASE}/customer/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Status update failed'); }
    loadData();
  };

  const handleCreateOrder = async (dto: any) => {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, customerId: dto.customerId, warehouseId: dto.warehouseId, quantity: parseInt(dto.quantity), unitPrice: parseFloat(dto.unitPrice), paymentTerms: dto.paymentTerms, notes: dto.notes || null }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Order creation failed'); }
    setNotifications(prev => ['New order created — stock debited.', ...prev]);
    loadData();
  };

  const handleDispatchTrip = async (dto: any) => {
    const firstOrder = orders.find((o: any) => o.id === dto.orderIds[0]);
    const resolvedWarehouseId = firstOrder?.warehouseId || warehouses[0]?.id;
    const res = await fetch(`${API_BASE}/shifts/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, driverId: dto.driverId, truckId: dto.truckId, startFullCylinders: dto.startFullCylinders, startEmptyCylinders: dto.startEmptyCylinders, warehouseId: resolvedWarehouseId, orderIds: dto.orderIds }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Dispatch failed'); }
    setNotifications(prev => [`Route dispatched — Truck ${dto.truckId} is on the road.`, ...prev]);
    loadData();
  };

  const handleReconcileShift = async (id: string, dto: any) => {
    const res = await fetch(`${API_BASE}/shifts/${id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Reconciliation failed'); }
    const data = await res.json();
    setNotifications(prev => ['Shift reconciliation complete — ledger posted.', ...prev]);
    loadData();
    return data;
  };

  const handleApproveExpense = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    const res = await fetch(`${API_BASE}/expenses/${id}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: decision, approvedById: session?.userId, approvalNotes: 'Approved via management console' }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Expense update failed'); }
    loadData();
  };

  const handleUpdateStock = async (dto: any) => {
    if (!warehouseStock?.id) return;
    const res = await fetch(`${API_BASE}/orders/warehouses/${warehouseStock.id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        fullChange: dto.fullChange || 0,
        emptyChange: dto.emptyChange || 0,
        damagedChange: dto.damagedChange || 0
      }),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.message || 'Failed to update stock');
    }
    loadData();
  };

  const handleVerifyGatePass = async (tripId: string) => {
    setActiveShifts(prev => prev.map((s: any) => s.id === tripId ? { ...s, status: 'ACTIVE' } : s));
    setNotifications(prev => [`Gate pass verified for Route Session: ${tripId.slice(0, 8)}`, ...prev]);
  };

  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // ── Not logged in → show login page ──
  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // ── Main ERP App ──
  return (
    <div className="mac-window">

      {/* macOS Title Bar */}
      <div className="mac-titlebar">
        <span className="mac-dot mac-dot-red" onClick={handleLogout} title="Sign Out" style={{ cursor: 'pointer' }} />
        <span className="mac-dot mac-dot-yellow" />
        <span className="mac-dot mac-dot-green" />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem', opacity: 0.6 }}>
          {session.companyName}
        </span>
      </div>

      <div className="app-container">

        {/* ── Sidebar ── */}
        <aside className="sidebar">

          {/* Logo + company */}
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2C6 2 3 8 3 12c0 6 5 10 9 10s9-4 9-10c0-4-3-10-9-10z" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div>
              <span className="sidebar-logo-text">{session.companyName}</span>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '1px' }}>LPG ERP Platform</div>
            </div>
          </div>

          {/* CORE OPERATIONS */}
          <span className="nav-category">Core Operations</span>
          <nav>
            {canAccessTab('dashboard') && (
              <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <DashboardIcon size={15} />Dashboard
              </button>
            )}
            {canAccessTab('customers') && (
              <button className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
                <UsersIcon size={15} />Customer Registry
              </button>
            )}
            {canAccessTab('trips') && (
              <button className={`nav-item ${activeTab === 'trips' ? 'active' : ''}`} onClick={() => setActiveTab('trips')}>
                <NavigationIcon size={15} />Route Dispatch
              </button>
            )}
          </nav>

          {/* INVENTORY & ASSETS */}
          <span className="nav-category">Inventory &amp; Assets</span>
          <nav>
            {canAccessTab('inventory') && (
              <button className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
                <Package size={15} />Warehouse Stock
              </button>
            )}
          </nav>

          {/* FINANCE & SETTLEMENT */}
          <span className="nav-category">Finance &amp; Settlement</span>
          <nav>
            {canAccessTab('reconcile') && (
              <button className={`nav-item ${activeTab === 'reconcile' ? 'active' : ''}`} onClick={() => setActiveTab('reconcile')}>
                <ClipboardIcon size={15} />Shift Reconciliation
              </button>
            )}
            {canAccessTab('expenses') && (
              <button className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
                <DollarIcon size={15} />Expense Manager
              </button>
            )}
            {canAccessTab('ledger') && (
              <button className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>
                <LayersIcon size={15} />Financial Ledgers
              </button>
            )}
          </nav>

          {/* STAFF & ACCESS */}
          {(role === 'Owner' || role === 'Manager') && (
            <>
              <span className="nav-category">Staff &amp; Access</span>
              <nav>
                <button className={`nav-item ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>
                  <ShieldCheck size={15} />Staff Registry
                </button>
              </nav>
            </>
          )}

          {/* Sidebar footer */}
          <div className="sidebar-footer">
            <div className="backend-status">
              <span className="status-dot" style={{ background: backendActive ? 'var(--color-success)' : 'var(--color-warning)' }} />
              <span>{backendActive ? 'Live · Connected' : 'Connecting…'}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: '0.25rem 0', marginTop: '0.5rem' }}
            >
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        </aside>

        {/* ── Right: topbar + content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Top Bar */}
          <header className="topbar">
            <div className="topbar-left">
              <div className="topbar-date">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {today}
              </div>
              {dataLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: '6px', height: '6px', background: 'var(--color-primary)', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                  Syncing…
                </div>
              )}
            </div>

            <div className="topbar-right">
              <button className="topbar-icon-btn" onClick={handleLanguageToggle} title="Toggle Language">
                <Languages size={15} />
              </button>

              <button className="topbar-icon-btn" title="Notifications">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {notifications.length > 0 && <span className="notif-badge">{notifications.length > 9 ? '9+' : notifications.length}</span>}
              </button>

              {/* Real user pill */}
              <div className="user-pill">
                <div className="user-avatar">{getInitials(session.name)}</div>
                <span className="user-name">{session.name}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-muted)' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="main-content">
            <div className="main-content-inner fade-in">
              {activeTab === 'dashboard'  && canAccessTab('dashboard')  && <Dashboard stats={getStats()} notifications={notifications} />}
              {activeTab === 'customers'  && canAccessTab('customers')  && <CustomerRegistry customers={customers} onAddCustomer={handleAddCustomer} onUpdateStatus={handleUpdateCustomerStatus} tenantId={tenantId} />}
              {activeTab === 'trips'      && canAccessTab('trips')      && <TripDispatchConsole draftOrders={orders} drivers={drivers} activeShifts={activeShifts} onDispatchTrip={handleDispatchTrip} customers={customers} warehouses={warehouses} onCreateOrder={handleCreateOrder} />}
              {activeTab === 'inventory'  && canAccessTab('inventory')  && <InventoryManager stock={warehouseStock} activeTrips={activeShifts} onUpdateStock={handleUpdateStock} onVerifyGatePass={handleVerifyGatePass} />}
              {activeTab === 'reconcile'  && canAccessTab('reconcile')  && <ShiftReconciliation shifts={activeShifts} onReconcile={handleReconcileShift} />}
              {activeTab === 'expenses'   && canAccessTab('expenses')   && <ExpenseManager expenses={expenses} onApproveExpense={handleApproveExpense} />}
              {activeTab === 'ledger'     && canAccessTab('ledger')     && <FinancialLedger accounts={accounts} entries={ledgerEntries} />}
              {activeTab === 'staff'      && (role === 'Owner' || role === 'Manager') && <StaffRegistry tenantId={tenantId} backendActive={backendActive} API_BASE={API_BASE} />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
