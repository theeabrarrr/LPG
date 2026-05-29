import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, PlusCircle, CheckSquare, ShieldAlert } from 'lucide-react';

interface WarehouseStock {
  id: string;
  name: string;
  fullCylinders: number;
  emptyCylinders: number;
  damagedCylinders: number;
}

interface ActiveTrip {
  id: string;
  truckId: string;
  driverName: string;
  startFullCylinders: number;
  startEmptyCylinders: number;
  status: string;
}

interface InventoryManagerProps {
  stock: WarehouseStock | null;
  activeTrips: ActiveTrip[];
  onUpdateStock: (dto: {
    fullChange: number;
    emptyChange: number;
    damagedChange: number;
  }) => Promise<void>;
  onVerifyGatePass: (tripId: string) => Promise<void>;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  stock,
  activeTrips,
  onUpdateStock,
  onVerifyGatePass
}) => {
  const { t } = useTranslation();
  const [fullDiff, setFullDiff] = useState(50);
  const [emptyDiff, setEmptyDiff] = useState(-50);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdateStock({
        fullChange: parseInt(fullDiff.toString()),
        emptyChange: parseInt(emptyDiff.toString()),
        damagedChange: 0
      });
      alert('Inventory adjusted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update warehouse stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Warehouse Stock</h1>
        <p className="page-subtitle">Track central hub stock, approve truck load outs, and record plant intake</p>
      </div>

      {stock && (
        <div className="grid-stats" style={{ marginBottom: '2rem' }}>
          <div className="glass-panel stat-card">
            <div className="stat-header">
              <span>Full Cylinders</span>
              <Layers size={18} color="var(--color-success)" />
            </div>
            <div className="stat-val" style={{ color: 'var(--color-success)' }}>{stock.fullCylinders}</div>
            <div className="stat-trend">Full & ready to dispatch</div>
          </div>

          <div className="glass-panel stat-card">
            <div className="stat-header">
              <span>Empty Shells</span>
              <Layers size={18} color="var(--text-muted)" />
            </div>
            <div className="stat-val" style={{ color: 'var(--text-muted)' }}>{stock.emptyCylinders}</div>
            <div className="stat-trend">Returned from field / awaiting plant refill</div>
          </div>

          <div className="glass-panel stat-card">
            <div className="stat-header">
              <span>Damaged Cylinders</span>
              <Layers size={18} color="var(--color-danger)" />
            </div>
            <div className="stat-val" style={{ color: 'var(--color-danger)' }}>{stock.damagedCylinders}</div>
            <div className="stat-trend">Failed safety dunk tests</div>
          </div>
        </div>
      )}

      <div className="main-grid">
        {/* Dispatched Gate Pass Verification */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 className="panel-title">
            <CheckSquare size={20} />
            Gate Pass Dispatch Verifications
          </h2>
          
          {activeTrips.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
              No routes awaiting gate verification.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeTrips.map((trip) => (
                <div 
                  key={trip.id}
                  style={{ 
                    padding: '1.25rem', 
                    background: 'rgba(255,255,255,0.01)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {trip.truckId} ({trip.driverName})
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Load Sheet: {trip.startFullCylinders} Full Cylinders | {trip.startEmptyCylinders} Empty Shells
                    </p>
                  </div>
                  <div>
                    {trip.status === 'ACTIVE' ? (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => onVerifyGatePass(trip.id)}
                      >
                        Sign Gate Pass
                      </button>
                    ) : (
                      <span className="badge badge-success">Gate Pass Verified</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refill Plant Intake Form */}
        <div className="glass-panel" style={{ padding: '1.5rem', alignSelf: 'start' }}>
          <h2 className="panel-title">
            <PlusCircle size={20} />
            Plant Refill Intake Logs
          </h2>

          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label className="form-label">Receive Filled Cylinders from Refill Plant</label>
              <input 
                type="number" 
                className="form-input"
                required
                value={fullDiff}
                onChange={(e) => setFullDiff(parseInt(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Return Empty Shells to Plant Refilling Pool</label>
              <input 
                type="number" 
                className="form-input"
                required
                value={emptyDiff}
                onChange={(e) => setEmptyDiff(parseInt(e.target.value))}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Recording intake...' : 'Record Warehouse Intake'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
