import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, ShieldAlert, Check, X, FileText } from 'lucide-react';

interface ExpenseClaim {
  id: string;
  driverName: string;
  category: string;
  amount: number;
  description: string | null;
  receiptUrl: string | null;
  receiptHash: string | null;
  odometer: number | null;
  status: string;
  createdAt: string;
}

interface ExpenseManagerProps {
  expenses: ExpenseClaim[];
  onApproveExpense: (id: string, decision: 'APPROVED' | 'REJECTED') => Promise<void>;
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  expenses,
  onApproveExpense
}) => {
  const { t } = useTranslation();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDecision = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    setLoadingId(id);
    try {
      await onApproveExpense(id, decision);
      alert(`Expense claim successfully ${decision.toLowerCase()}!`);
    } catch (err) {
      console.error(err);
      alert('Failed to update expense status');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">{t('expenseManager')}</h1>
        <p className="page-subtitle">Verify fuel odometer counts, receipt watermarks, and check duplicates</p>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 className="panel-title">
          <ClipboardList size={20} />
          {t('expenseClaims')}
        </h2>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Details</th>
                <th>Odometer (Fuel)</th>
                <th>Receipt Audit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No expense claims submitted. Driver mobile logs will appear here.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => {
                  const isDuplicate = expenses.some((other) => other.id !== e.id && other.receiptHash === e.receiptHash && e.receiptHash !== null);
                  return (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>{e.driverName}</td>
                      <td>
                        <span className="badge badge-muted">{e.category}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        Rs. {e.amount.toLocaleString()}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{e.description || '-'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Submitted: {new Date(e.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td>
                        {e.category === 'FUEL' ? (
                          <div style={{ fontWeight: 600 }}>{e.odometer ? `${e.odometer} km` : 'Missing Odometer!'}</div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {e.receiptUrl ? (
                            <a 
                              href={e.receiptUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ 
                                color: 'var(--color-primary)', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.25rem',
                                fontSize: '0.8rem',
                                textDecoration: 'none'
                              }}
                            >
                              <FileText size={12} />
                              View Photo Scan
                            </a>
                          ) : (
                            <span style={{ color: e.amount >= 10 ? 'var(--color-danger)' : 'var(--text-muted)', fontSize: '0.8rem' }}>
                              {e.amount >= 10 ? 'No Receipt (Violation!)' : 'No Receipt (Micro)'}
                            </span>
                          )}
                          
                          {isDuplicate && (
                            <div 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.25rem', 
                                color: 'var(--color-danger)', 
                                fontSize: '0.7rem',
                                fontWeight: 600
                              }}
                            >
                              <ShieldAlert size={10} />
                              DUPLICATE DETECTED
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${
                          e.status === 'APPROVED' ? 'success' : e.status === 'REJECTED' ? 'danger' : 'warning'
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td>
                        {e.status === 'AWAITING_APPROVAL' ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="btn btn-success" 
                              style={{ padding: '0.35rem 0.6rem' }}
                              disabled={loadingId === e.id}
                              onClick={() => handleDecision(e.id, 'APPROVED')}
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '0.35rem 0.6rem' }}
                              disabled={loadingId === e.id}
                              onClick={() => handleDecision(e.id, 'REJECTED')}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Decision Logged
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
