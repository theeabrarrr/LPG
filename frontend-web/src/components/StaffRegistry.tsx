import React, { useState, useEffect } from 'react';
import { UserCheck, ShieldAlert, UserPlus, ToggleLeft, ToggleRight, Key, X, Copy, CheckCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phoneNumber?: string;
  pin?: string;
  isActive: boolean;
}

interface StaffRegistryProps {
  tenantId: string;
  backendActive: boolean;
  API_BASE: string;
}

interface CreatedStaffInfo {
  name: string;
  email: string;
  role: string;
  credential: string;       // temp password or PIN value
  credentialType: 'password' | 'pin';
}

const ROLES = [
  { value: 'BUSINESS_OWNER', label: 'Business Owner' },
  { value: 'BACK_OFFICE', label: 'Back-Office Operator' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'WAREHOUSE_MANAGER', label: 'Warehouse Manager' },
  { value: 'DRIVER', label: 'Driver' },
  { value: 'RECOVERY_AGENT', label: 'Recovery Agent' }
];

const ROLE_LABELS: Record<string, string> = {
  BUSINESS_OWNER: 'Business Owner',
  BACK_OFFICE: 'Back-Office Operator',
  ACCOUNTANT: 'Accountant',
  WAREHOUSE_MANAGER: 'Warehouse Manager',
  DRIVER: 'Driver',
  RECOVERY_AGENT: 'Recovery Agent',
  SUPER_ADMIN: 'Super Admin'
};

const DRIVER_ROLES = new Set(['DRIVER', 'RECOVERY_AGENT']);

/** Generate a random 10-char alphanumeric password */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export const StaffRegistry: React.FC<StaffRegistryProps> = ({
  tenantId,
  backendActive,
  API_BASE
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // New staff form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('BACK_OFFICE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Success modal state
  const [createdStaff, setCreatedStaff] = useState<CreatedStaffInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const isDriverRole = DRIVER_ROLES.has(role);

  // Load staff list
  const loadStaff = async () => {
    setLoading(true);
    try {
      if (backendActive) {
        const res = await fetch(`${API_BASE}/staff/tenant/${tenantId}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } else {
        // Fallback mock users
        setUsers([
          { id: 'superadmin-user-id', name: 'Super Admin', email: 'superadmin@lpg.com', role: 'SUPER_ADMIN', phoneNumber: '11223344', isActive: true },
          { id: 'backoffice-user-id', name: 'Back-Office Operator', email: 'backoffice@lpg.com', role: 'BACK_OFFICE', phoneNumber: '55667788', isActive: true },
          { id: 'accountant-user-id', name: 'Accountant', email: 'accountant@lpg.com', role: 'ACCOUNTANT', phoneNumber: '99001122', isActive: true },
          { id: '29082fa5-47ec-4559-b3ee-d6ede823181a', name: 'driver1', email: 'driver1@lpg.com', role: 'DRIVER', pin: '1234', phoneNumber: '33445566', isActive: true },
          { id: 'warehousemanager-user-id', name: 'Warehouse Manager', email: 'warehousemanager@lpg.com', role: 'WAREHOUSE_MANAGER', phoneNumber: '77889900', isActive: true }
        ]);
      }
    } catch (err) {
      console.error('Failed to load staff list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [backendActive, tenantId]);

  // Register new staff
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role) {
      alert('Please fill in Name, Email and Role.');
      return;
    }

    // For driver roles, validate PIN if provided
    if (isDriverRole && pin && !/^\d{4}$/.test(pin)) {
      alert('PIN must be exactly 4 digits.');
      return;
    }

    // Determine credential for display — auto-generate password if not driver role and left blank
    const resolvedPassword = !isDriverRole ? (password.trim() || generateTempPassword()) : undefined;

    setFormLoading(true);
    try {
      const payload: Record<string, string | undefined> = {
        tenantId,
        name,
        email,
        role,
        phoneNumber: phoneNumber || undefined,
        pin: isDriverRole ? (pin || undefined) : undefined,
        password: !isDriverRole ? resolvedPassword : undefined
      };

      if (backendActive) {
        const res = await fetch(`${API_BASE}/staff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Staff registration failed');
        }
      } else {
        // Mock add user
        const newUser: User = {
          id: 'user-mock-' + Date.now(),
          name,
          email,
          role,
          phoneNumber: phoneNumber || undefined,
          pin: isDriverRole ? (pin || undefined) : undefined,
          isActive: true
        };
        setUsers(prev => [...prev, newUser]);
      }

      // Show success modal with credential info
      setCreatedStaff({
        name,
        email,
        role,
        credential: isDriverRole ? (pin || '(not set)') : resolvedPassword!,
        credentialType: isDriverRole ? 'pin' : 'password'
      });

      // Reset form
      setName('');
      setEmail('');
      setRole('BACK_OFFICE');
      setPhoneNumber('');
      setPin('');
      setPassword('');
      loadStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to register staff');
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      if (backendActive) {
        const res = await fetch(`${API_BASE}/staff/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: nextStatus })
        });
        if (!res.ok) throw new Error('Status update failed');
      }
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: nextStatus } : u));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  // Update role
  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      if (backendActive) {
        const res = await fetch(`${API_BASE}/staff/${id}/role`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole })
        });
        if (!res.ok) throw new Error('Role update failed');
      }
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  // Update PIN
  const handlePinUpdate = async (id: string) => {
    const newPin = prompt('Enter new 4-digit PIN:');
    if (newPin === null) return;
    if (!/^\d{4}$/.test(newPin)) {
      alert('PIN must be exactly 4 digits.');
      return;
    }
    try {
      if (backendActive) {
        const res = await fetch(`${API_BASE}/staff/${id}/pin`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: newPin })
        });
        if (!res.ok) throw new Error('PIN update failed');
      }
      setUsers(prev => prev.map(u => u.id === id ? { ...u, pin: newPin } : u));
      alert('PIN updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update PIN');
    }
  };

  const handleCopyCredential = () => {
    if (createdStaff) {
      navigator.clipboard.writeText(createdStaff.credential).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleCloseModal = () => {
    setCreatedStaff(null);
    setCopied(false);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Staff Registry &amp; Access Control</h1>
        <p className="page-subtitle">Manage company staff accounts, define roles, and configure PIN permissions for drivers/agents</p>
      </div>

      {/* ── Success Modal ── */}
      {createdStaff && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}
          onClick={handleCloseModal}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '1rem',
              padding: '2rem',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <CheckCircle size={22} color="var(--color-success)" />
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  Staff Account Created
                </span>
              </div>
              <button
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '0.125rem' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Warning banner */}
            <div
              style={{
                background: 'rgba(251, 191, 36, 0.12)',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ShieldAlert size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', color: '#fbbf24', lineHeight: 1.4 }}>
                Share this with the staff member. <strong>This will not be shown again.</strong>
              </span>
            </div>

            {/* Staff Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Name</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{createdStaff.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{createdStaff.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Role</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{ROLE_LABELS[createdStaff.role] ?? createdStaff.role}</span>
              </div>
            </div>

            {/* Credential box */}
            <div
              style={{
                background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.875rem 1rem',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {createdStaff.credentialType === 'pin' ? 'Mobile App PIN' : 'Temporary Password'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: createdStaff.credentialType === 'pin' ? '2rem' : '1.15rem',
                    fontWeight: 700,
                    letterSpacing: createdStaff.credentialType === 'pin' ? '0.5em' : '0.1em',
                    color: 'var(--color-primary)'
                  }}
                >
                  {createdStaff.credential}
                </span>
                <button
                  onClick={handleCopyCredential}
                  className="btn btn-secondary"
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.78rem', gap: '0.25rem', display: 'flex', alignItems: 'center' }}
                >
                  <Copy size={13} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }}
              onClick={handleCloseModal}
            >
              I've shared this — Close
            </button>
          </div>
        </div>
      )}

      <div className="main-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Register Staff Form */}
        <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <h2 className="panel-title">
            <UserPlus size={20} />
            Register Staff Account
          </h2>

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Muhammad Bilal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. bilal@lpg.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role Profile *</label>
              <select
                className="dropdown-select"
                style={{ width: '100%', padding: '0.75rem' }}
                value={role}
                onChange={(e) => { setRole(e.target.value); setPin(''); setPassword(''); }}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. +923001234567"
              />
            </div>

            {/* Driver/Recovery Agent → PIN field */}
            {isDriverRole && (
              <div className="form-group">
                <label className="form-label">Mobile App Access PIN (4 Digits)</label>
                <input
                  type="text"
                  maxLength={4}
                  className="form-input"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 1234"
                />
              </div>
            )}

            {/* Office roles → Password field */}
            {!isDriverRole && (
              <div className="form-group">
                <label className="form-label">
                  Temporary Password
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>(leave blank to auto-generate)</span>
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters recommended"
                  autoComplete="new-password"
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              disabled={formLoading}
            >
              {formLoading ? 'Registering...' : 'Register Staff'}
            </button>
          </form>
        </div>

        {/* Staff Members List */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 className="panel-title">
            <UserCheck size={20} />
            Active Staff Profiles
          </h2>

          <div className="table-container" style={{ marginTop: '0.5rem' }}>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem' }}>Loading staff registry...</p>
            ) : users.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem' }}>No staff profiles found.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Staff Name / Email</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>PIN</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.55 }}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td>
                        <select
                          className="dropdown-select"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="SUPER_ADMIN">Super Admin</option>
                          <option value="BUSINESS_OWNER">Owner</option>
                          <option value="BACK_OFFICE">Operator</option>
                          <option value="ACCOUNTANT">Accountant</option>
                          <option value="WAREHOUSE_MANAGER">Inventory</option>
                          <option value="DRIVER">Driver</option>
                          <option value="RECOVERY_AGENT">Agent</option>
                        </select>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{u.phoneNumber || 'N/A'}</span>
                      </td>
                      <td>
                        {(u.role === 'DRIVER' || u.role === 'RECOVERY_AGENT') ? (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem' }}
                            onClick={() => handlePinUpdate(u.id)}
                          >
                            <Key size={12} />
                            {u.pin ? `PIN: ${u.pin}` : 'Set PIN'}
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No App Access</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleStatus(u.id, u.isActive)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: u.isActive ? 'var(--color-success)' : 'var(--text-muted)' }}
                        >
                          {u.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
