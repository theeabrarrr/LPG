import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, X, Printer, Edit2, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  creditLimit: number;
  creditBalance: number;
  emptyCylinderLiability: number;
  status: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED';
}

interface CustomerRegistryProps {
  customers: Customer[];
  onAddCustomer: (dto: any) => Promise<void>;
  onUpdateStatus: (id: string, status: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED') => Promise<void>;
  onUpdateCustomer: (id: string, dto: any) => Promise<void>;
  ledgerEntries: any[];
  tenantId: string;
}

export const CustomerRegistry: React.FC<CustomerRegistryProps> = ({
  customers,
  onAddCustomer,
  onUpdateStatus,
  onUpdateCustomer,
  ledgerEntries,
  tenantId
}) => {
  const { t } = useTranslation();
  
  // Create Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(1000);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Detail Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'profile' | 'statement'>('profile');

  // Edit Customer Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLimit, setEditLimit] = useState(0);
  const [editLoading, setEditLoading] = useState(false);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleOpenDetails = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setModalTab('profile');
    setEditName(c.name);
    setEditEmail(c.email || '');
    setEditPhone(c.phoneNumber || '');
    setEditAddress(c.address || '');
    setEditLimit(c.creditLimit);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    try {
      await onAddCustomer({
        tenantId,
        name,
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        address: address || undefined,
        creditLimit: parseFloat(creditLimit.toString()),
        status: 'ACTIVE'
      });
      // Reset form
      setName('');
      setEmail('');
      setPhoneNumber('');
      setAddress('');
      setCreditLimit(1000);
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      alert('Failed to register customer');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !editName) return;
    setEditLoading(true);
    try {
      await onUpdateCustomer(selectedCustomerId, {
        name: editName,
        email: editEmail || null,
        phoneNumber: editPhone || null,
        address: editAddress || null,
        creditLimit: parseFloat(editLimit.toString())
      });
      alert('Customer profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update customer details');
    } finally {
      setEditLoading(false);
    }
  };

  // Filter and compute running ledger statement entries
  const customerEntries = ledgerEntries
    .filter(e => e.customerId === selectedCustomerId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Running balance calculator helper for view
  let viewRunningBalance = 0;

  const handlePrintStatement = () => {
    if (!selectedCustomer) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let runningBal = 0;
    const tableRows = customerEntries.map((e) => {
      runningBal += (e.debit || 0) - (e.credit || 0);
      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${new Date(e.createdAt).toLocaleDateString('en-GB')}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${e.description}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${e.debit > 0 ? 'Rs. ' + e.debit.toLocaleString() : '—'}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${e.credit > 0 ? 'Rs. ' + e.credit.toLocaleString() : '—'}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Rs. ${runningBal.toLocaleString()}</td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="5" style="padding: 8px; text-align: center;">No transactions logged</td></tr>';

    printWindow.document.write(`
      <html>
        <head>
          <title>CUSTOMER ACCOUNT STATEMENT - ${selectedCustomer.name.toUpperCase()}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #333; padding: 25px; line-height: 1.4; }
            .header-table { width: 100%; border: none; margin-bottom: 25px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; color: #007aff; }
            .meta-box { background: #f9f9f9; padding: 15px; border-radius: 5px; border: 1px solid #eee; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f2f2f2; font-size: 11px; font-weight: bold; text-transform: uppercase; padding: 10px; border: 1px solid #ddd; text-align: left; }
            td { font-size: 12px; padding: 8px 10px; border: 1px solid #ddd; }
            .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #777; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <table class="header-table">
            <tr>
              <td>
                <div class="title">Raza Gas Pvt Ltd</div>
                <div style="font-size: 12px; color: #666;">Karachi, Pakistan</div>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <h2 style="margin: 0; font-size: 16px; color: #555;">CUSTOMER ACCOUNT STATEMENT</h2>
                <div style="font-size: 11px; color: #777; margin-top: 3px;">Generated on: ${new Date().toLocaleDateString('en-GB')}</div>
              </td>
            </tr>
          </table>

          <div class="meta-box">
            <div>
              <strong>Customer Name:</strong> ${selectedCustomer.name}<br />
              <strong>Contact Phone:</strong> ${selectedCustomer.phoneNumber || 'N/A'}<br />
              <strong>Billing Address:</strong> ${selectedCustomer.address || 'N/A'}
            </div>
            <div>
              <strong>Credit Limit:</strong> Rs. ${selectedCustomer.creditLimit.toLocaleString()}<br />
              <strong>Current Credit Balance:</strong> Rs. ${selectedCustomer.creditBalance.toLocaleString()}<br />
              <strong>Cylinder Exchange Liability:</strong> ${selectedCustomer.emptyCylinderLiability} Empty Shells
            </div>
          </div>

          <h3>Accounts Receivable Transactions Ledger</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th style="text-align: right;">Debit (charges)</th>
                <th style="text-align: right;">Credit (payments)</th>
                <th style="text-align: right;">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="footer">
            <p>This is a computer generated system statement. For billing discrepancies, contact accounts@razagas.com.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">{t('customerRegistry')}</h1>
          <p className="page-subtitle">Manage customer limits, credit terms, and cylinder balances</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={16} />
          {showAddForm ? 'Close Form' : t('registerCustomer')}
        </button>
      </div>

      {showAddForm && (
        <form className="glass-panel" onSubmit={handleAddSubmit} style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 className="panel-title">{t('registerCustomer')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{t('name')} *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('email')}</label>
              <input 
                type="email" 
                className="form-input" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('phone')}</label>
              <input 
                type="text" 
                className="form-input" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('address')}</label>
              <input 
                type="text" 
                className="form-input" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('creditLimit')}</label>
              <input 
                type="number" 
                min="0" 
                className="form-input" 
                value={creditLimit} 
                onChange={(e) => setCreditLimit(parseInt(e.target.value))} 
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : t('saveCustomer')}
            </button>
          </div>
        </form>
      )}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 className="panel-title">
          <Users size={20} />
          {t('customerList')}
        </h2>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('phone')}</th>
                <th>{t('creditLimit')}</th>
                <th>{t('creditBalance')}</th>
                <th>{t('availableCredit')}</th>
                <th>{t('cylinderLiability')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const available = Math.max(0, c.creditLimit - c.creditBalance);
                return (
                  <tr key={c.id}>
                    <td 
                      style={{ fontWeight: 600, color: 'var(--color-primary)', cursor: 'pointer' }}
                      onClick={() => handleOpenDetails(c)}
                      title="View Details & Ledger Statement"
                    >
                      {c.name}
                    </td>
                    <td>{c.phoneNumber || '-'}</td>
                    <td>Rs. {c.creditLimit.toLocaleString()}</td>
                    <td style={{ color: c.creditBalance > c.creditLimit ? 'var(--color-danger)' : 'inherit' }}>
                      Rs. {c.creditBalance.toLocaleString()}
                    </td>
                    <td>Rs. {available.toLocaleString()}</td>
                    <td style={{ fontWeight: 600, color: c.emptyCylinderLiability > 0 ? 'var(--color-warning)' : 'inherit' }}>
                      {c.emptyCylinderLiability} Empty Shells
                    </td>
                    <td>
                      <span className={`badge badge-${
                        c.status === 'ACTIVE' ? 'success' : c.status === 'BLOCKED' ? 'danger' : 'warning'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button 
                          className="btn" 
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                          onClick={() => handleOpenDetails(c)}
                        >
                          <Edit2 size={12} style={{ marginRight: '3px' }} /> Edit / Details
                        </button>
                        {c.status === 'ACTIVE' ? (
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => onUpdateStatus(c.id, 'BLOCKED')}
                          >
                            {t('blockCustomer')}
                          </button>
                        ) : (
                          <button 
                            className="btn btn-success" 
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => onUpdateStatus(c.id, 'ACTIVE')}
                          >
                            {t('unblockCustomer')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CUSTOMER DETAILS & STATEMENT TABBED MODAL ── */}
      {selectedCustomerId && selectedCustomer && (
        <div 
          className="fade-in"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="glass-panel" 
            style={{
              width: '720px',
              maxWidth: '95%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-card)'
            }}
          >
            {/* Modal Title bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={22} color="var(--color-primary)" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                  {selectedCustomer.name} Profile &amp; Statement
                </h2>
              </div>
              <button 
                onClick={() => setSelectedCustomerId(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tab Controls */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem', paddingBottom: '0.25rem' }}>
              <button 
                type="button"
                onClick={() => setModalTab('profile')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'profile' ? '2px solid var(--color-primary)' : '2px solid transparent',
                  color: modalTab === 'profile' ? 'var(--color-primary)' : 'var(--text-muted)',
                  padding: '0.5rem 1rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <Edit2 size={13} style={{ marginRight: '5px', display: 'inline-block', verticalAlign: 'middle' }} />
                Profile &amp; Credit Limits
              </button>
              <button 
                type="button"
                onClick={() => setModalTab('statement')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'statement' ? '2px solid var(--color-primary)' : '2px solid transparent',
                  color: modalTab === 'statement' ? 'var(--color-primary)' : 'var(--text-muted)',
                  padding: '0.5rem 1rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <FileText size={13} style={{ marginRight: '5px', display: 'inline-block', verticalAlign: 'middle' }} />
                Ledger Statement
              </button>
            </div>

            {/* Modal Tab Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              
              {/* TAB 1: PROFILE EDIT */}
              {modalTab === 'profile' && (
                <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Customer Name *</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        value={editEmail} 
                        onChange={(e) => setEditEmail(e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={editPhone} 
                        onChange={(e) => setEditPhone(e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Credit Limit (Rs.)</label>
                      <input 
                        type="number" 
                        min="0"
                        className="form-input" 
                        value={editLimit} 
                        onChange={(e) => setEditLimit(parseInt(e.target.value))} 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Billing Address</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editAddress} 
                      onChange={(e) => setEditAddress(e.target.value)} 
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Registered ID: <span style={{ fontFamily: 'monospace' }}>{selectedCustomer.id}</span>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={editLoading}>
                      {editLoading ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: LEDGER STATEMENT */}
              {modalTab === 'statement' && (
                <div>
                  {/* Account Metrics header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Credit Limit</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                        Rs. {selectedCustomer.creditLimit.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Credit Balance</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: selectedCustomer.creditBalance > selectedCustomer.creditLimit ? 'var(--color-danger)' : 'var(--text-main)', marginTop: '0.2rem' }}>
                        Rs. {selectedCustomer.creditBalance.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Cylinder Liability</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: selectedCustomer.emptyCylinderLiability > 0 ? 'var(--color-warning)' : 'var(--text-main)', marginTop: '0.2rem' }}>
                        {selectedCustomer.emptyCylinderLiability} Empties
                      </div>
                    </div>
                  </div>

                  {/* Transaction history log table */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>Receivables Ledger History</h3>
                    <button 
                      type="button" 
                      className="btn" 
                      onClick={handlePrintStatement}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--color-primary)', color: '#fff', border: 'none' }}
                    >
                      <Printer size={12} /> Print Statement
                    </button>
                  </div>

                  <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table className="data-table" style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th style={{ textAlign: 'right' }}>Debit (Charges)</th>
                          <th style={{ textAlign: 'right' }}>Credit (Payments)</th>
                          <th style={{ textAlign: 'right' }}>Running Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerEntries.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                              No ledger transactions recorded for this customer.
                            </td>
                          </tr>
                        ) : (
                          customerEntries.map((e) => {
                            viewRunningBalance += (e.debit || 0) - (e.credit || 0);
                            return (
                              <tr key={e.id}>
                                <td>{new Date(e.createdAt).toLocaleDateString('en-GB')}</td>
                                <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.description}>
                                  {e.description}
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                                  {e.debit > 0 ? `Rs. ${e.debit.toLocaleString()}` : '—'}
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--color-success)' }}>
                                  {e.credit > 0 ? `Rs. ${e.credit.toLocaleString()}` : '—'}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                  Rs. {viewRunningBalance.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer controls */}
            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <button className="btn" onClick={() => setSelectedCustomerId(null)} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
