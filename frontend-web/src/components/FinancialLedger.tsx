import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, BookOpen, Layers } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  code: string;
  type: string;
  balance: number;
}

interface LedgerEntry {
  id: string;
  batchId: string;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
  transactionType: string;
  createdAt: string;
}

interface FinancialLedgerProps {
  accounts: Account[];
  entries: LedgerEntry[];
}

export const FinancialLedger: React.FC<FinancialLedgerProps> = ({
  accounts,
  entries
}) => {
  const { t } = useTranslation();

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">{t('financialLedgers')}</h1>
        <p className="page-subtitle">Immutable double-entry general ledger logs and chart of accounts</p>
      </div>

      <div 
        style={{ 
          background: 'rgba(255, 88, 88, 0.05)', 
          border: '1px solid rgba(255, 88, 88, 0.15)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}
      >
        <ShieldAlert size={24} color="var(--color-danger)" />
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-danger)' }}>
            Zero-Tolerance Fraud Controls Active
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Standard database UPDATE and DELETE commands are blocked at the application level on all FinancialLedger entries. 
            Audits and adjustments must be posted as correction journal batches.
          </p>
        </div>
      </div>

      <div className="main-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Left Side: Chart of Accounts */}
        <div className="glass-panel" style={{ padding: '1.5rem', alignSelf: 'start' }}>
          <h2 className="panel-title">
            <Layers size={20} />
            {t('accountBalance')}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {accounts.map((a) => (
              <div 
                key={a.id}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.85rem 1rem', 
                  background: 'rgba(255,255,255,0.01)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Code: {a.code} | Type: {a.type}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  Rs. {a.balance.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Ledger Log */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 className="panel-title">
            <BookOpen size={20} />
            {t('ledgerEntries')}
          </h2>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Account</th>
                  <th>{t('debit')}</th>
                  <th>{t('credit')}</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No ledger postings logged yet. Complete shifts to generate ledger transactions.
                    </td>
                  </tr>
                ) : (
                  entries.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{e.description}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Batch: {e.batchId}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>
                          {e.accountName}
                        </span>
                      </td>
                      <td style={{ color: e.debit > 0 ? 'var(--color-success)' : 'inherit' }}>
                        {e.debit > 0 ? `Rs. ${e.debit.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ color: e.credit > 0 ? 'var(--color-warning)' : 'inherit' }}>
                        {e.credit > 0 ? `Rs. ${e.credit.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(e.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
