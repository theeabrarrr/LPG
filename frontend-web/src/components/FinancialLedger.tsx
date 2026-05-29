import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, BookOpen, Layers, BarChart3, AlertTriangle, TrendingUp } from 'lucide-react';

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

interface AgingRecord {
  customerId: string;
  customerName: string;
  creditLimit: number;
  totalOutstanding: number;
  current: number;
  thirtyToSixty: number;
  sixtyToNinety: number;
  overNinety: number;
}

interface FinancialLedgerProps {
  accounts: Account[];
  entries: LedgerEntry[];
  tenantId?: string;
  API_BASE?: string;
}

export const FinancialLedger: React.FC<FinancialLedgerProps> = ({
  accounts,
  entries,
  tenantId,
  API_BASE
}) => {
  const { t } = useTranslation();
  const [agingData, setAgingData] = useState<AgingRecord[]>([]);
  const [loadingAging, setLoadingAging] = useState(false);

  useEffect(() => {
    if (!tenantId || !API_BASE) return;
    
    const fetchAging = async () => {
      try {
        setLoadingAging(true);
        const res = await fetch(`${API_BASE}/ledger/ar-aging/${tenantId}`);
        if (res.ok) {
          const data = await res.json();
          setAgingData(data);
        }
      } catch (err) {
        console.error('Error fetching aging data:', err);
      } finally {
        setLoadingAging(false);
      }
    };

    fetchAging();
    const interval = setInterval(fetchAging, 5000);
    return () => clearInterval(interval);
  }, [tenantId, API_BASE]);

  // Aggregate aging calculations
  const totalCurrent = agingData.reduce((acc, curr) => acc + curr.current, 0);
  const total30To60 = agingData.reduce((acc, curr) => acc + curr.thirtyToSixty, 0);
  const total60To90 = agingData.reduce((acc, curr) => acc + curr.sixtyToNinety, 0);
  const totalOver90 = agingData.reduce((acc, curr) => acc + curr.overNinety, 0);
  const grandTotalOutstanding = agingData.reduce((acc, curr) => acc + curr.totalOutstanding, 0);

  const currentPct = grandTotalOutstanding > 0 ? (totalCurrent / grandTotalOutstanding) * 100 : 0;
  const pct30To60 = grandTotalOutstanding > 0 ? (total30To60 / grandTotalOutstanding) * 100 : 0;
  const pct60To90 = grandTotalOutstanding > 0 ? (total60To90 / grandTotalOutstanding) * 100 : 0;
  const pctOver90 = grandTotalOutstanding > 0 ? (totalOver90 / grandTotalOutstanding) * 100 : 0;

  // Determine Risk Category
  let riskStatus = 'No Risk';
  let riskColor = 'var(--color-success)';
  if (grandTotalOutstanding > 0) {
    if (totalOver90 > 0.1 * grandTotalOutstanding || totalOver90 > 250000) {
      riskStatus = 'High Risk';
      riskColor = 'var(--color-danger)';
    } else if (totalOver90 + total60To90 > 0.15 * grandTotalOutstanding || totalOver90 + total60To90 > 100000) {
      riskStatus = 'Medium Risk';
      riskColor = 'var(--color-warning)';
    } else {
      riskStatus = 'Low Risk';
      riskColor = 'var(--color-success)';
    }
  }

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

      {/* Premium Accounts Receivable (AR) Aging Widget */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 className="panel-title" style={{ margin: 0 }}>
              <BarChart3 size={20} />
              {t('outstandingReceivables')}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Real-time aged debtor distribution and credit exposure risk evaluation
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Risk Profile</div>
              <span 
                className="badge" 
                style={{ 
                  background: `${riskColor}15`, 
                  color: riskColor, 
                  borderColor: `${riskColor}30`,
                  fontSize: '0.75rem', 
                  fontWeight: 700 
                }}
              >
                {riskStatus}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Receivable Balance</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                Rs. {grandTotalOutstanding.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* HSL Segmented Bar Chart */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', height: '16px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
            {grandTotalOutstanding === 0 ? (
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                No active outstanding receivables
              </div>
            ) : (
              <>
                {totalCurrent > 0 && (
                  <div 
                    style={{ width: `${currentPct}%`, background: 'hsl(142, 70%, 45%)', transition: 'width 0.3s ease' }} 
                    title={`Current (0-30 Days): Rs. ${totalCurrent.toLocaleString()} (${currentPct.toFixed(1)}%)`} 
                  />
                )}
                {total30To60 > 0 && (
                  <div 
                    style={{ width: `${pct30To60}%`, background: 'hsl(48, 96%, 53%)', transition: 'width 0.3s ease' }} 
                    title={`31-60 Days: Rs. ${total30To60.toLocaleString()} (${pct30To60.toFixed(1)}%)`} 
                  />
                )}
                {total60To90 > 0 && (
                  <div 
                    style={{ width: `${pct60To90}%`, background: 'hsl(27, 96%, 61%)', transition: 'width 0.3s ease' }} 
                    title={`61-90 Days: Rs. ${total60To90.toLocaleString()} (${pct60To90.toFixed(1)}%)`} 
                  />
                )}
                {totalOver90 > 0 && (
                  <div 
                    style={{ width: `${pctOver90}%`, background: 'hsl(346, 84%, 61%)', transition: 'width 0.3s ease' }} 
                    title={`>90 Days: Rs. ${totalOver90.toLocaleString()} (${pctOver90.toFixed(1)}%)`} 
                  />
                )}
              </>
            )}
          </div>

          {/* Chart Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(142, 70%, 45%)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>0-30 Days (Current)</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Rs. {totalCurrent.toLocaleString()} <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)' }}>({currentPct.toFixed(1)}%)</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(48, 96%, 53%)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>31-60 Days</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Rs. {total30To60.toLocaleString()} <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)' }}>({pct30To60.toFixed(1)}%)</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(27, 96%, 61%)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>61-90 Days</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Rs. {total60To90.toLocaleString()} <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)' }}>({pct60To90.toFixed(1)}%)</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(346, 84%, 61%)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>&gt;90 Days</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: totalOver90 > 0 ? 'var(--color-danger)' : 'inherit' }}>Rs. {totalOver90.toLocaleString()} <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)' }}>({pctOver90.toFixed(1)}%)</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Aging Breakdowns Table */}
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Aged Debtor Breakdown by Customer</h3>
        <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Credit Limit</th>
                <th>Total Outstanding</th>
                <th>0-30 Days</th>
                <th>31-60 Days</th>
                <th>61-90 Days</th>
                <th>&gt;90 Days</th>
              </tr>
            </thead>
            <tbody>
              {agingData.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No debtor records found.
                  </td>
                </tr>
              ) : (
                agingData.map((rec) => {
                  const limitViolation = rec.totalOutstanding > rec.creditLimit;
                  const hasBadDebt = rec.overNinety > 0;
                  return (
                    <tr 
                      key={rec.customerId}
                      style={{ 
                        background: limitViolation ? 'rgba(255, 88, 88, 0.03)' : hasBadDebt ? 'rgba(255, 171, 0, 0.02)' : 'inherit'
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{rec.customerName}</div>
                        {limitViolation && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '1px' }}>
                            <AlertTriangle size={10} /> Exceeds Credit Limit
                          </div>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>Rs. {rec.creditLimit.toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: limitViolation ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                        Rs. {rec.totalOutstanding.toLocaleString()}
                      </td>
                      <td style={{ color: rec.current > 0 ? 'var(--text-muted)' : 'rgba(255,255,255,0.1)' }}>
                        {rec.current > 0 ? `Rs. ${rec.current.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ color: rec.thirtyToSixty > 0 ? 'hsl(48, 96%, 53%)' : 'rgba(255,255,255,0.1)', fontWeight: rec.thirtyToSixty > 0 ? 600 : 400 }}>
                        {rec.thirtyToSixty > 0 ? `Rs. ${rec.thirtyToSixty.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ color: rec.sixtyToNinety > 0 ? 'hsl(27, 96%, 61%)' : 'rgba(255,255,255,0.1)', fontWeight: rec.sixtyToNinety > 0 ? 600 : 400 }}>
                        {rec.sixtyToNinety > 0 ? `Rs. ${rec.sixtyToNinety.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ color: rec.overNinety > 0 ? 'var(--color-danger)' : 'rgba(255,255,255,0.1)', fontWeight: rec.overNinety > 0 ? 700 : 400 }}>
                        {rec.overNinety > 0 ? `Rs. ${rec.overNinety.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
