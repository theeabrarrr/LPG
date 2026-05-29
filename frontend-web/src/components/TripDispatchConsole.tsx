import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Navigation, UserCheck } from 'lucide-react';

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  quantity: number;
  totalAmount: number;
  status: string;
  paymentTerms: string;
  warehouseId?: string;
  address?: string;
}

interface Driver {
  id: string;
  name: string;
}

interface TripDispatchConsoleProps {
  draftOrders: Order[];
  drivers: Driver[];
  activeShifts: any[];
  customers: any[];
  warehouses: any[];
  onCreateOrder: (dto: any) => Promise<void>;
  onDispatchTrip: (dto: {
    driverId: string;
    truckId: string;
    startFullCylinders: number;
    startEmptyCylinders: number;
    orderIds: string[];
  }) => Promise<void>;
}

export const TripDispatchConsole: React.FC<TripDispatchConsoleProps> = ({
  draftOrders,
  drivers,
  activeShifts,
  customers,
  warehouses,
  onCreateOrder,
  onDispatchTrip
}) => {
  const { t } = useTranslation();

  // Dispatch states
  const [selectedDriver, setSelectedDriver] = useState('');
  const [truckId, setTruckId] = useState('TRK-987-ISL');
  const [startFullCylinders, setStartFullCylinders] = useState(10);
  const [startEmptyCylinders] = useState(0);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Order creation states
  const [orderCustomerId, setOrderCustomerId] = useState('');
  const [orderWarehouseId, setOrderWarehouseId] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(5);
  const [orderUnitPrice, setOrderUnitPrice] = useState(80);
  const [orderPaymentTerms, setOrderPaymentTerms] = useState<'CASH_ON_DELIVERY' | 'CHEQUE_ON_DELIVERY' | 'CREDIT'>('CREDIT');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);

  const toggleOrderSelection = (id: string) => {
    setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCustomerId || !orderWarehouseId) { alert('Please select a customer and warehouse.'); return; }
    setOrderLoading(true);
    try {
      await onCreateOrder({ customerId: orderCustomerId, warehouseId: orderWarehouseId, quantity: parseInt(orderQuantity.toString()), unitPrice: parseFloat(orderUnitPrice.toString()), paymentTerms: orderPaymentTerms, notes: orderNotes });
      setOrderNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to create order');
    } finally {
      setOrderLoading(false);
    }
  };

  const handleDispatch = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!selectedDriver || selectedOrders.length === 0) { alert('Please select a driver and at least one order.'); return; }
    setLoading(true);
    try {
      await onDispatchTrip({ driverId: selectedDriver, truckId, startFullCylinders: parseInt(startFullCylinders.toString()), startEmptyCylinders, orderIds: selectedOrders });
      setSelectedOrders([]);
      setSelectedDriver('');
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch route');
    } finally {
      setLoading(false);
    }
  };

  const buildableOrders = draftOrders.filter(o => o.status === 'DRAFT' || o.status === 'BLOCKED');

  const getPriority = (o: Order) => {
    if (o.status === 'BLOCKED') return { label: 'High', color: 'var(--color-danger)' };
    if (o.quantity >= 30) return { label: 'High', color: 'var(--color-danger)' };
    if (o.quantity >= 15) return { label: 'Medium', color: 'var(--color-warning)' };
    return { label: 'Normal', color: 'var(--color-success)' };
  };

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Dispatch Console</h1>
          <p className="page-subtitle">Build and dispatch customer delivery routes</p>
        </div>
        <button className="btn btn-primary">Dispatch Route</button>
      </div>

      <div className="main-grid main-grid-3" style={{ alignItems: 'start' }}>

        {/* ── Column 1: PENDING ORDERS ── */}
        <div className="glass-panel">
          <div className="panel-header">
            <h2 className="panel-title"><ClipboardList size={13} />Draft Sales Orders</h2>
          </div>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '0.4rem 1.25rem', borderBottom: '1px solid var(--border-card)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</span>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '340px' }}>
            {buildableOrders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1.5rem 1.25rem' }}>No draft sales orders.</p>
            ) : (
              buildableOrders.map((o) => {
                const pri = getPriority(o);
                const isSelected = selectedOrders.includes(o.id);
                return (
                  <div key={o.id} onClick={() => toggleOrderSelection(o.id)} style={{
                    padding: '0.85rem 1.25rem',
                    borderBottom: '1px solid rgba(42,45,56,0.4)',
                    cursor: 'pointer', transition: 'all 0.1s ease',
                    background: isSelected ? 'rgba(0,122,255,0.06)' : 'transparent',
                    borderLeft: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 700 }}>#{o.id.slice(0,6).toUpperCase()}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: pri.color }}>{pri.label}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.2rem' }}>{o.customerName}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>📍 {o.address || 'No address'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>🔵 {o.quantity} | {pri.label}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Inline Create Order Form */}
          <div style={{ borderTop: '1px solid var(--border-card)', padding: '1rem 1.25rem' }}>
            <details>
              <summary style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', cursor: 'pointer', listStyle: 'none', marginBottom: '0.75rem' }}>
                + Create New Order
              </summary>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Customer *</label>
                  <select className="dropdown-select" required value={orderCustomerId} onChange={(e) => setOrderCustomerId(e.target.value)}>
                    <option value="">Select customer…</option>
                    {customers.filter(c => c.status === 'ACTIVE').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Warehouse *</label>
                  <select className="dropdown-select" required value={orderWarehouseId} onChange={(e) => setOrderWarehouseId(e.target.value)}>
                    <option value="">Select warehouse…</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Qty *</label>
                    <input type="number" className="form-input" required min={1} value={orderQuantity} onChange={(e) => setOrderQuantity(parseInt(e.target.value))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Unit Price</label>
                    <input type="number" step="0.01" className="form-input" required min={0.01} value={orderUnitPrice} onChange={(e) => setOrderUnitPrice(parseFloat(e.target.value))} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Terms</label>
                  <select className="dropdown-select" value={orderPaymentTerms} onChange={(e) => setOrderPaymentTerms(e.target.value as any)}>
                    <option value="CREDIT">Credit Account</option>
                    <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                    <option value="CHEQUE_ON_DELIVERY">Cheque on Delivery</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={orderLoading}>
                  {orderLoading ? 'Saving…' : 'Save & Debit Stock'}
                </button>
              </form>
            </details>
          </div>
        </div>

        {/* ── Column 2: DRIVER FLEET ── */}
        <div className="glass-panel">
          <div className="panel-header">
            <h2 className="panel-title"><Navigation size={13} />Driver Roster</h2>
          </div>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '0.4rem 1.25rem', borderBottom: '1px solid var(--border-card)' }}>
            {['Status', 'Vehicle', 'Location'].map(h => (
              <span key={h} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '340px' }}>
            {drivers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1.5rem 1.25rem' }}>No drivers found. Add via Staff Registry.</p>
            ) : (
              drivers.map((d: any) => {
                const shift = activeShifts.find((s: any) => s.driverId === d.id);
                const isOnRoute = !!shift;
                return (
                  <div key={d.id} onClick={() => !isOnRoute && setSelectedDriver(d.id)} style={{
                    padding: '1rem 1.25rem', borderBottom: '1px solid rgba(42,45,56,0.4)',
                    cursor: isOnRoute ? 'default' : 'pointer',
                    background: selectedDriver === d.id ? 'rgba(0,122,255,0.05)' : 'transparent',
                    borderLeft: selectedDriver === d.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                    transition: 'all 0.1s ease',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.18rem' }}>{d.name}</div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isOnRoute ? 'var(--color-warning)' : 'var(--color-success)' }}>
                          {isOnRoute ? `En Route (${shift?.truckId})` : 'Available'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{shift?.truckId || '—'}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isOnRoute ? 'On Route' : '—'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Dispatch form for selected driver */}
          {selectedDriver && (
            <div style={{ borderTop: '1px solid var(--border-card)', padding: '1rem 1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                Dispatching: <strong style={{ color: 'var(--text-main)' }}>{drivers.find((d: any) => d.id === selectedDriver)?.name}</strong>
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Truck ID *</label>
                  <input type="text" className="form-input" value={truckId} onChange={(e) => setTruckId(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Cylinders Loaded *</label>
                  <input type="number" className="form-input" value={startFullCylinders} onChange={(e) => setStartFullCylinders(parseInt(e.target.value))} />
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading || selectedOrders.length === 0} onClick={handleDispatch}>
                {loading ? 'Dispatching…' : `Dispatch Route · ${selectedOrders.length} Order${selectedOrders.length !== 1 ? 's' : ''}`}
              </button>
              {selectedOrders.length === 0 && (
                <p style={{ fontSize: '0.72rem', color: 'var(--color-warning)', marginTop: '0.4rem', textAlign: 'center' }}>← Select orders from Pending Orders</p>
              )}
            </div>
          )}
        </div>

        {/* ── Column 3: ACTIVE DISPATCH WORKFLOW ── */}
        <div className="glass-panel">
          <div className="panel-header">
            <h2 className="panel-title"><UserCheck size={13} />Active Route Dispatches</h2>
          </div>
          <p style={{ padding: '0.5rem 1.25rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-card)' }}>
            Routes assigned and awaiting driver departure.
          </p>
          <div style={{ padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '440px' }}>
            {activeShifts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active dispatches yet.</p>
            ) : (
              activeShifts.map((s: any) => (
                <div key={s.id} style={{ border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.015)', padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', rowGap: '0.18rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.73rem' }}>Driver</span>
                    <span style={{ fontWeight: 600 }}>{s.driverName || '—'}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.73rem' }}>Order</span>
                    <span>{s.orders?.[0]?.customer?.name || 'Multiple Orders'}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.73rem' }}>Status</span>
                    <span>{s.status}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.73rem' }}>Full Cylinders</span>
                    <span>{s.startFullCylinders} FC</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.73rem' }}>Shift Status</span>
                    <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>In Transit</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>Dispatch Route</button>
                    <button className="btn btn-danger btn-sm" style={{ flex: 1 }}>Cancel Assignment</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
