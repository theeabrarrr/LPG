import React from 'react';
import { CheckCircle2, Clock, XCircle, Package, Calendar, DollarSign } from 'lucide-react';

interface OrderHistoryProps {
  stops: any[];
  activeShift: any | null;
}

const paymentLabel: Record<string, string> = {
  CASH_ON_DELIVERY:   'Cash',
  CHEQUE_ON_DELIVERY: 'Cheque',
  CREDIT:             'Credit',
};

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  COMPLETED:             { icon: <CheckCircle2 size={14} />, color: '#34c759', label: 'Completed'  },
  DELIVERED_UNVERIFIED:  { icon: <Clock size={14} />,        color: '#ff9f0a', label: 'Pending Verify' },
  ASSIGNED:              { icon: <Clock size={14} />,        color: '#007aff', label: 'Assigned'   },
  IN_TRANSIT:            { icon: <Clock size={14} />,        color: '#007aff', label: 'In Transit' },
  BLOCKED:               { icon: <XCircle size={14} />,      color: '#ff3b30', label: 'Blocked'    },
};

export const OrderHistory: React.FC<OrderHistoryProps> = ({ stops, activeShift }) => {
  const completedStops = stops.filter(s => s.status === 'COMPLETED' || s.status === 'DELIVERED_UNVERIFIED');
  const totalRevenue   = completedStops.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalCylinders = completedStops.reduce((sum, s) => sum + (s.quantity || 0), 0);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Order History</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          {activeShift
            ? `Dispatch: ${activeShift.truckId} · Session ${activeShift.id?.slice(0, 8) || '—'}`
            : 'No active dispatch session'}
        </p>
      </div>

      {/* Summary Cards */}
      {completedStops.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
          <div className="m-card" style={{ padding: '0.75rem', textAlign: 'center', borderRadius: '10px' }}>
            <div style={{ color: '#34c759', marginBottom: '4px' }}><Package size={16} /></div>
            <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{totalCylinders}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cylinders Delivered</div>
          </div>
          <div className="m-card" style={{ padding: '0.75rem', textAlign: 'center', borderRadius: '10px' }}>
            <div style={{ color: '#007aff', marginBottom: '4px' }}><DollarSign size={16} /></div>
            <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>Rs. {totalRevenue.toLocaleString()}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Revenue</div>
          </div>
        </div>
      )}

      {/* List */}
      <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
        Today's Deliveries
      </h3>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {stops.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Calendar size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.9rem' }}>No deliveries yet today.</p>
          </div>
        ) : (
          stops.map((s) => {
            const cfg = statusConfig[s.status] || { icon: <Clock size={14} />, color: '#8e8e93', label: s.status };
            return (
              <div key={s.id} className="m-card" style={{ padding: '0.85rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{s.customerName}</h4>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: cfg.color,
                    background: `${cfg.color}18`,
                    borderRadius: '4px',
                    padding: '2px 7px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    flexShrink: 0,
                  }}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{s.address}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 600 }}>{s.quantity} × 45.2 KG FC</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {paymentLabel[s.paymentTerms] || '—'} · <strong style={{ color: 'var(--text-main)' }}>Rs. {(s.totalAmount || 0).toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
