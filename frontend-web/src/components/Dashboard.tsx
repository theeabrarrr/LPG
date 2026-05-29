import React from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Truck, ClipboardList, AlertTriangle, Bell } from 'lucide-react';

interface DashboardProps {
  stats: {
    globalSales: number;
    activeTrucks: number;
    receivables: number;
    disputes: number;
  };
  notifications: string[];
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, notifications }) => {
  const { t } = useTranslation();

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t('dashboard')}</h1>
          <p className="page-subtitle">Real-time enterprise overview &amp; operational health metrics</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-stats">
        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-label">{t('globalSales')}</span>
            <DollarSign size={16} color="var(--color-success)" />
          </div>
          <div className="stat-val">Rs. {stats.globalSales.toLocaleString()}</div>
          <div className="stat-trend trend-up">↑ 12.5% from yesterday</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-label">{t('activeTrucks')}</span>
            <Truck size={16} color="var(--color-primary)" />
          </div>
          <div className="stat-val">{stats.activeTrucks}</div>
          <div className="stat-trend">Active routes today</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-label">{t('outstandingReceivables')}</span>
            <DollarSign size={16} color="var(--color-warning)" />
          </div>
          <div className="stat-val">Rs. {stats.receivables.toLocaleString()}</div>
          <div className="stat-trend trend-down">↓ 3.2% debt aging</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-label">{t('openDisputes')}</span>
            <AlertTriangle size={16} color={stats.disputes > 0 ? 'var(--color-danger)' : 'var(--text-muted)'} />
          </div>
          <div className="stat-val" style={{ color: stats.disputes > 0 ? 'var(--color-danger)' : undefined }}>
            {stats.disputes}
          </div>
          <div className="stat-trend" style={{ color: stats.disputes > 0 ? 'var(--color-danger)' : undefined }}>
            {stats.disputes > 0 ? 'Requires immediate action' : 'Zero asset leakage'}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="main-grid main-grid-1">
        <div className="glass-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <Bell size={14} />
              {t('recentNotifications')}
            </h2>
            {notifications.length > 0 && (
              <span className="badge badge-info">{notifications.length} new</span>
            )}
          </div>
          <div style={{ padding: '0.75rem 1.25rem' }}>
            {notifications.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>
                No recent system notifications.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.25rem' }}>
                {notifications.map((note, index) => (
                  <li
                    key={index}
                    style={{
                      padding: '0.7rem 0.85rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-card)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      fontSize: '0.855rem',
                    }}
                  >
                    <Bell size={12} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
