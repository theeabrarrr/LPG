import React from 'react';
import { User, Truck, Package, DollarSign, Clock, LogOut, Shield } from 'lucide-react';

interface DriverProfileProps {
  driver: any;
  activeShift: any | null;
  stops: any[];
  loggedExpenses: any[];
  onLogout: () => void;
}

export const DriverProfile: React.FC<DriverProfileProps> = ({
  driver,
  activeShift,
  stops,
  loggedExpenses,
  onLogout,
}) => {
  const delivered  = stops.filter(s => s.status === 'COMPLETED' || s.status === 'DELIVERED_UNVERIFIED').length;
  const totalCyl   = stops.filter(s => s.status === 'COMPLETED' || s.status === 'DELIVERED_UNVERIFIED').reduce((sum, s) => sum + (s.quantity || 0), 0);
  const totalExp   = loggedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingExp = loggedExpenses.filter(e => e.status === 'AWAITING_APPROVAL').length;

  const infoRow = (label: string, value: string, icon?: React.ReactNode, color?: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        {icon && <span style={{ color: color || 'var(--text-muted)' }}>{icon}</span>}
        {label}
      </span>
      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: color || 'var(--text-main)' }}>{value}</span>
    </div>
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Profile</h2>
      </div>

      {/* Avatar Card */}
      <div className="m-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', padding: '1rem' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: 'rgba(0,122,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <User size={24} color="#007aff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {driver?.name || 'Driver'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '2px' }}>
            Driver · Field Operations
          </div>
        </div>
        <div style={{
          background: activeShift ? 'rgba(52,199,89,0.12)' : 'rgba(142,142,147,0.1)',
          color: activeShift ? '#34c759' : '#8e8e93',
          borderRadius: '999px',
          padding: '3px 10px',
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}>
          {activeShift ? 'On Duty' : 'Off Duty'}
        </div>
      </div>

      {/* Shift Stats */}
      {activeShift && (
        <div className="m-card" style={{ marginBottom: '1rem', padding: '1rem' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Today's Dispatch
          </h3>
          {infoRow('Truck ID', activeShift.truckId, <Truck size={14} />, '#007aff')}
          {infoRow('Orders Delivered', `${delivered} / ${stops.length}`, <Package size={14} />, '#34c759')}
          {infoRow('Cylinders Delivered', `${totalCyl} FC`, <Package size={14} />)}
          {infoRow('Expected Cash', `Rs. ${(activeShift.expectedCash || 0).toLocaleString()}`, <DollarSign size={14} />, '#ff9f0a')}
          {infoRow('Shift Status', activeShift.status, <Shield size={14} />)}
        </div>
      )}

      {/* Expenses */}
      <div className="m-card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          Expenses
        </h3>
        {infoRow('Logged Today', `${loggedExpenses.length} claims`, <Clock size={14} />)}
        {infoRow('Total Claimed', `Rs. ${totalExp.toLocaleString()}`, <DollarSign size={14} />)}
        {infoRow('Awaiting Approval', `${pendingExp} pending`, <Clock size={14} />, pendingExp > 0 ? '#ff9f0a' : undefined)}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Logout */}
      <button
        onClick={onLogout}
        className="m-btn m-btn-danger"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem' }}
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  );
};
