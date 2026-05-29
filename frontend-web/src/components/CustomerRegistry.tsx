import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, ShieldAlert } from 'lucide-react';

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
  tenantId: string;
}

export const CustomerRegistry: React.FC<CustomerRegistryProps> = ({
  customers,
  onAddCustomer,
  onUpdateStatus,
  tenantId
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(1000);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
        <form className="glass-panel" onSubmit={handleSubmit} style={{ padding: '1.5rem', marginBottom: '2rem' }}>
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
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
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
                      {c.status === 'ACTIVE' ? (
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => onUpdateStatus(c.id, 'BLOCKED')}
                        >
                          {t('blockCustomer')}
                        </button>
                      ) : (
                        <button 
                          className="btn btn-success" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => onUpdateStatus(c.id, 'ACTIVE')}
                        >
                          {t('unblockCustomer')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
