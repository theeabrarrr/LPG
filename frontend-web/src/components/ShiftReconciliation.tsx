import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, ShieldAlert, Award } from 'lucide-react';

interface ActiveShift {
  id: string;
  driverId: string;
  driverName: string;
  truckId: string;
  status: string;
  startOdometer: number;
  startFullCylinders: number;
  startEmptyCylinders: number;
  expectedCash: number;
  expenses: { id: string; amount: number; category: string; status: string }[];
}

interface ShiftReconciliationProps {
  shifts: ActiveShift[];
  onReconcile: (id: string, dto: {
    physicalCashCollected: number;
    endFullCylinders: number;
    endEmptyCylinders: number;
    reconciliationNotes?: string;
  }) => Promise<any>;
}

export const ShiftReconciliation: React.FC<ShiftReconciliationProps> = ({
  shifts,
  onReconcile
}) => {
  const { t } = useTranslation();
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [physicalCashCollected, setPhysicalCashCollected] = useState(0);
  const [endFullCylinders, setEndFullCylinders] = useState(0);
  const [endEmptyCylinders, setEndEmptyCylinders] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const activeShift = shifts.find((s) => s.id === selectedShiftId);

  const calculateExpectedEmpties = () => {
    if (!activeShift) return 0;
    // Simple mock calculation: startEmpties + recovered - swapped (mock value 0 in MVP test)
    return activeShift.startEmptyCylinders;
  };

  const handleSelectShift = (id: string) => {
    setSelectedShiftId(id);
    const s = shifts.find((x) => x.id === id);
    if (s) {
      setPhysicalCashCollected(s.expectedCash);
      setEndFullCylinders(s.startFullCylinders - 5); // Default guess for UI convenience
      setEndEmptyCylinders(4); // Default guess
      setNotes('');
      setResult(null);
    }
  };

  const handleApproveReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftId) return;
    setLoading(true);
    try {
      const res = await onReconcile(selectedShiftId, {
        physicalCashCollected: parseFloat(physicalCashCollected.toString()),
        endFullCylinders: parseInt(endFullCylinders.toString()),
        endEmptyCylinders: parseInt(endEmptyCylinders.toString()),
        reconciliationNotes: notes
      });
      setResult(res);
      alert('Shift reconciled successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to reconcile shift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">{t('shiftReconciliation')}</h1>
        <p className="page-subtitle">Reconcile returned cylinders, variance balances, and cash collected by the driver</p>
      </div>

      <div className="main-grid" style={{ gridTemplateColumns: activeShift ? '1.2fr 1.8fr' : '1fr' }}>
        {/* Left Side: Select Active Shift */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 className="panel-title">
            <ClipboardCheck size={20} />
            Select Active Check-out / Dispatch Session
          </h2>
          
          {shifts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
              No check-out / dispatch sessions are currently active or awaiting reconciliation.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {shifts.map((s) => (
                <div 
                  key={s.id}
                  onClick={() => handleSelectShift(s.id)}
                  style={{ 
                    padding: '1rem', 
                    background: selectedShiftId === s.id ? 'rgba(0, 122, 255, 0.08)' : 'rgba(255, 255, 255, 0.01)', 
                    border: selectedShiftId === s.id ? '1px solid var(--color-primary)' : '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700 }}>{s.truckId}</span>
                    <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>{s.status}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Driver: {s.driverName} | Expected Cash: Rs. {s.expectedCash.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Reconcile Shift Form */}
        {activeShift && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h2 className="panel-title">
              <Award size={20} />
              Driver Settlement / Shift Reconciliation Details: {activeShift.truckId} ({activeShift.driverName})
            </h2>

            <form onSubmit={handleApproveReconciliation}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Loaded Full Cylinders</label>
                  <input type="text" className="form-input" disabled value={activeShift.startFullCylinders} />
                </div>
                <div className="form-group">
                  <label className="form-label">Returned Full Cylinders *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    value={endFullCylinders} 
                    onChange={(e) => setEndFullCylinders(parseInt(e.target.value))} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Loaded Empty Cylinders</label>
                  <input type="text" className="form-input" disabled value={activeShift.startEmptyCylinders} />
                </div>
                <div className="form-group">
                  <label className="form-label">Returned Empty Cylinders *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    value={endEmptyCylinders} 
                    onChange={(e) => setEndEmptyCylinders(parseInt(e.target.value))} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expected Cash (Rs.)</label>
                  <input type="text" className="form-input" disabled value={`Rs. ${activeShift.expectedCash.toLocaleString()}`} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('physicalCash')} *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    value={physicalCashCollected} 
                    onChange={(e) => setPhysicalCashCollected(parseFloat(e.target.value))} 
                  />
                </div>
              </div>

              {/* Real-time Variance Analysis */}
              <div 
                style={{ 
                  padding: '1rem', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem'
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                  Live Inventory / Cash Variance Calculations
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span>Inventory / Cash Variance:</span>
                  <span style={{ 
                    fontWeight: 700, 
                    color: (physicalCashCollected - activeShift.expectedCash) < 0 ? 'var(--color-danger)' : 'var(--color-success)'
                  }}>
                    Rs. {(physicalCashCollected - activeShift.expectedCash).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Empty Cylinder / Shells Variance:</span>
                  <span style={{ 
                    fontWeight: 700, 
                    color: (endEmptyCylinders - calculateExpectedEmpties()) === 0 ? 'var(--color-success)' : 'var(--color-warning)'
                  }}>
                    {(endEmptyCylinders - calculateExpectedEmpties())} Empty Shells
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Driver Settlement / Shift Reconciliation Notes</label>
                <textarea 
                  className="form-input" 
                  style={{ height: '70px', resize: 'none' }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain any variance shortages/overages here..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Reconciling...' : t('reconcileShift')}
                </button>
              </div>
            </form>

            {/* Reconciliation results journal log */}
            {result && (
              <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid var(--color-success)' }}>
                <h3 style={{ color: 'var(--color-success)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={16} />
                  Double-entry Journal Posted!
                </h3>
                <div style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  <div>Batch ID: {result.ledgerResult?.batchId || 'N/A'}</div>
                  {result.ledgerResult?.entries?.map((e: any, idx: number) => (
                    <div key={idx} style={{ marginTop: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      Account: {e.accountId} | Debit: Rs. {e.debit} | Credit: Rs. {e.credit}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
