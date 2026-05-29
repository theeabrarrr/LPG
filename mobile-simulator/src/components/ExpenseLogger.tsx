import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Camera, DollarSign } from 'lucide-react';

interface ExpenseLoggerProps {
  onBack: () => void;
  onSubmitExpense: (dto: {
    category: string;
    amount: number;
    description: string;
    receiptUrl?: string;
    receiptHash?: string;
  }) => Promise<void>;
  loggedExpenses: any[];
}

export const ExpenseLogger: React.FC<ExpenseLoggerProps> = ({
  onBack,
  onSubmitExpense,
  loggedExpenses
}) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState('TOLL');
  const [amount, setAmount] = useState('500');
  const [description, setDescription] = useState('M-2 Highway Toll fee');
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCameraScan = () => {
    setPhotoUploaded(true);
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    
    // Validations
    if (parsedAmount >= 1000 && !photoUploaded) {
      alert('Payment Receipt Capture is mandatory for claims of Rs. 1000 or more (Macro-expenses).');
      return;
    }
    
    setLoading(true);
    try {
      await onSubmitExpense({
        category,
        amount: parsedAmount,
        description,
        receiptUrl: photoUploaded ? 'https://images.bucket/receipt-' + Date.now() + '.jpg' : undefined,
        receiptHash: photoUploaded ? 'hash-abc-123' : undefined // Standard mock test hash
      });
      // Reset
      setAmount('500');
      setDescription('M-2 Highway Toll fee');
      setPhotoUploaded(false);
      alert('Expense logged successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to submit expense claim');
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
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{t('logExpense')}</h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <form onSubmit={handleExpenseSubmit} className="m-card">
          <div className="form-group">
            <label className="form-label">{t('expenseCategory')}</label>
            <select 
              className="dropdown-select" 
              style={{ width: '100%', padding: '0.85rem', background: 'var(--bg-input)' }}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (e.target.value === 'FUEL') {
                  setDescription('Diesel refueling station');
                  setAmount('3000');
                } else if (e.target.value === 'TOLL') {
                  setDescription('M-2 Highway Toll fee');
                  setAmount('500');
                } else {
                  setDescription('');
                  setAmount('');
                }
              }}
            >
              <option value="FUEL">Fuel Station (refill)</option>
              <option value="TOLL">Road Tolls</option>
              <option value="MAINTENANCE">Maintenance / Repairs</option>
              <option value="MEALS">Meals / Lodging</option>
              <option value="MISC">Misc / Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('expenseAmount')} *</label>
            <input 
              type="number" 
              className="form-input" 
              style={{ background: 'var(--bg-input)', fontSize: '1.1rem', padding: '0.85rem' }}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input 
              type="text" 
              className="form-input" 
              style={{ background: 'var(--bg-input)' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>



          {/* Conditional receipt upload */}
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label className="form-label">
              {t('receiptPhoto')} {parseFloat(amount) >= 10 ? '*' : ''}
            </label>
            <button 
              type="button" 
              className="m-btn m-btn-secondary" 
              style={{ borderStyle: 'dashed', padding: '0.85rem' }}
              onClick={handleCameraScan}
            >
              <Camera size={16} />
              {photoUploaded ? 'Receipt Image captured ✓' : 'Perform Payment Receipt Capture'}
            </button>
            {parseFloat(amount) >= 1000 && !photoUploaded && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.7rem', marginTop: '0.25rem', fontWeight: 600 }}>
                Payment Receipt Capture is mandatory for claims of Rs. 1000 or more (Macro-expenses).
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="m-btn m-btn-primary" 
            style={{ marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Logging Claim...' : t('submitExpense')}
          </button>
        </form>

        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
          {t('expenseList')}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '1rem' }}>
          {loggedExpenses.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem', textAlign: 'center' }}>
              No expenses recorded in this shift.
            </p>
          ) : (
            loggedExpenses.map((exp, idx) => (
              <div key={idx} className="m-card" style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{exp.category}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {exp.description || 'Road Expense'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                    Rs. {exp.amount}
                  </span>
                  <span className="badge badge-muted" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>
                    {exp.status || 'PENDING'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
