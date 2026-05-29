import React from 'react';
import { Package, CheckCircle, Clock, MapPin, Truck, AlertCircle } from 'lucide-react';

interface Stop {
  id: string;
  customerName: string;
  address: string;
  quantity: number;
  totalAmount: number;
  status: string;
  paymentTerms?: string;
}

interface DriverDashboardProps {
  driverName: string;
  activeShift: any | null;
  stops: Stop[];
  onSelectStop: (stopId: string) => void;
  onGoToExpenses: () => void;
  onGoToShiftClose: () => void;
}

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    ASSIGNED:              { label: 'Assigned',   color: '#ff9f0a', bg: 'rgba(255,159,10,0.12)'  },
    IN_TRANSIT:            { label: 'In Transit', color: '#007aff', bg: 'rgba(0,122,255,0.12)'   },
    DELIVERED_UNVERIFIED:  { label: 'Delivered',  color: '#34c759', bg: 'rgba(52,199,89,0.12)'   },
    COMPLETED:             { label: 'Completed',  color: '#8e8e93', bg: 'rgba(142,142,147,0.10)' },
  };
  const s = map[status] || { label: status, color: '#8e8e93', bg: 'rgba(142,142,147,0.1)' };
  return (
    <span style={{
      fontSize: '0.7rem',
      fontWeight: 700,
      letterSpacing: '0.03em',
      color: s.color,
      background: s.bg,
      borderRadius: '4px',
      padding: '2px 7px',
      textTransform: 'uppercase'
    }}>{s.label}</span>
  );
};

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  driverName,
  activeShift,
  stops,
  onSelectStop,
  onGoToExpenses,
  onGoToShiftClose
}) => {
  const pending   = stops.filter(s => s.status === 'ASSIGNED' || s.status === 'IN_TRANSIT');
  const delivered = stops.filter(s => s.status === 'DELIVERED_UNVERIFIED' || s.status === 'COMPLETED');

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header greeting */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>My Orders</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{driverName}</p>
      </div>

      {/* No active shift state */}
      {!activeShift ? (
        <div className="m-card" style={{ textAlign: 'center', padding: '2rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <AlertCircle size={36} color="var(--color-warning)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>No Active Dispatch</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', lineHeight: 1.5 }}>
            You have no active dispatch session. Contact your back-office operator to dispatch your route for today.
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Shift Info Banner */}
          <div className="m-card" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(0,122,255,0.06)',
            borderColor: 'rgba(0,122,255,0.3)',
            marginBottom: '0.75rem',
            padding: '0.75rem 1rem'
          }}>
            <Truck size={20} color="var(--color-primary)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                {activeShift.truckId}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {activeShift.startFullCylinders} FC loaded · {activeShift.startEmptyCylinders || 0} EC on board
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Expected Cash</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Rs. {(activeShift.expectedCash || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Summary pills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            {[
              { label: 'Total', val: stops.length, icon: <Package size={14} />, color: '#007aff' },
              { label: 'Pending', val: pending.length, icon: <Clock size={14} />, color: '#ff9f0a' },
              { label: 'Delivered', val: delivered.length, icon: <CheckCircle size={14} />, color: '#34c759' },
            ].map(({ label, val, icon, color }) => (
              <div key={label} className="m-card" style={{ textAlign: 'center', padding: '0.6rem 0.25rem', borderRadius: '10px' }}>
                <div style={{ color, marginBottom: '2px' }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{val}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            <button className="m-btn m-btn-secondary" style={{ padding: '0.6rem', fontSize: '0.82rem', fontWeight: 600 }} onClick={onGoToExpenses}>
              Log Expense
            </button>
            <button className="m-btn m-btn-danger" style={{ padding: '0.6rem', fontSize: '0.82rem', fontWeight: 600 }} onClick={onGoToShiftClose}>
              End of Day
            </button>
          </div>

          {/* Stop List */}
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Delivery Stops
          </h3>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stops.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No delivery stops assigned to this dispatch.
              </div>
            ) : (
              stops.map((s, index) => {
                const isActionable = s.status === 'ASSIGNED' || s.status === 'IN_TRANSIT';
                const isDone = s.status === 'DELIVERED_UNVERIFIED' || s.status === 'COMPLETED';
                return (
                  <div
                    key={s.id}
                    className="m-card"
                    style={{
                      opacity: isDone ? 0.55 : 1,
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: isDone ? 'rgba(52,199,89,0.15)' : 'rgba(0,122,255,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: isDone ? '#34c759' : '#007aff',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {isDone ? <CheckCircle size={12} /> : index + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.customerName}
                        </h4>
                        {statusBadge(s.status)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '0.4rem' }}>
                        <MapPin size={10} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.address}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                          {s.quantity} × 45.2 KG Cylinders
                        </span>
                        {isActionable && (
                          <button
                            className="m-btn m-btn-primary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', width: 'auto', fontWeight: 700 }}
                            onClick={() => onSelectStop(s.id)}
                          >
                            Arrive
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
