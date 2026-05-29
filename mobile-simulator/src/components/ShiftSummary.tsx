import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Landmark } from 'lucide-react';

interface ShiftSummaryProps {
  activeShift: any;
  onBack: () => void;
  onCloseShift: (dto: {
    endFull: number;
    endEmpty: number;
  }) => Promise<void>;
}

export const ShiftSummary: React.FC<ShiftSummaryProps> = ({
  activeShift,
  onBack,
  onCloseShift
}) => {
  const { t } = useTranslation();
  const [endFull, setEndFull] = useState(activeShift.startFullCylinders - 5);
  const [endEmpty, setEndEmpty] = useState(4);
  const [loading, setLoading] = useState(false);

  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCloseShift({
        endFull: parseInt(endFull.toString()),
        endEmpty: parseInt(endEmpty.toString())
      });
      alert('Driver settlement request submitted successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to submit driver settlement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button 
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <ChevronLeft size={24} />
        </button>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Driver Settlement / Shift Reconciliation</h2>
      </div>

      <form onSubmit={handleCloseShiftSubmit} className="m-card" style={{ flex: 1 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Landmark size={18} color="var(--color-primary)" />
          {t('shiftClose')}
        </h3>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Starting Full Cylinders:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{activeShift.startFullCylinders} FC</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Expected Cash:</span>
            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Rs. {activeShift.expectedCash.toLocaleString()}</span>
          </div>
        </div>



        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Returned Full Cylinders *</label>
            <input 
              type="number" 
              className="form-input" 
              style={{ background: 'var(--bg-input)' }}
              required
              value={endFull}
              onChange={(e) => setEndFull(parseInt(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Returned Empty Cylinders/Shells *</label>
            <input 
              type="number" 
              className="form-input" 
              style={{ background: 'var(--bg-input)' }}
              required
              value={endEmpty}
              onChange={(e) => setEndEmpty(parseInt(e.target.value))}
            />
          </div>
        </div>
      </form>

      <button 
        type="submit" 
        className="m-btn m-btn-danger" 
        style={{ marginTop: '1rem' }}
        disabled={loading}
        onClick={handleCloseShiftSubmit}
      >
        {loading ? 'Submitting Request...' : t('closeShiftBtn')}
      </button>
    </div>
  );
};
