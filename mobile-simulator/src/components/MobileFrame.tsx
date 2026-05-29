import React from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff, Battery, Shield } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  isOffline: boolean;
  onToggleOffline: () => void;
  syncQueueCount: number;
  onSync: () => Promise<void>;
  syncLogs: string[];
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  isOffline,
  onToggleOffline,
  syncQueueCount,
  onSync,
  syncLogs
}) => {
  const { t } = useTranslation();

  return (
    <div className="simulator-layout">
      {/* 1. Phone Frame wrapper */}
      <div className="phone-wrapper">
        <div className="phone-notch">
          <div className="notch-camera"></div>
          <div className="notch-speaker"></div>
        </div>

        {/* Status Bar */}
        <div className="phone-status-bar">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="status-icons">
            {isOffline ? <WifiOff size={12} color="var(--color-danger)" /> : <Wifi size={12} color="var(--color-success)" />}
            <Battery size={12} />
          </div>
        </div>

        {/* Screen Content */}
        <div className="phone-screen">
          {/* Offline/Online toggle Switch Inside Screen */}
          <div className={`offline-switch-container ${isOffline ? 'offline' : 'online'}`}>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Shield size={14} color={isOffline ? 'var(--color-warning)' : 'var(--color-success)'} />
              {isOffline ? t('offlineStatus') : t('onlineStatus')}
            </span>
            <label className="switch-toggle">
              <input 
                type="checkbox" 
                checked={!isOffline} 
                onChange={onToggleOffline} 
              />
              <span className="slider"></span>
            </label>
          </div>

          {children}
        </div>
      </div>

      {/* 2. Side Panel showing background Sync details (Offline Outbox Log console) */}
      <div className="sync-logger-panel">
        <div className="logger-header">
          <h2 className="logger-title">{t('syncStatus')}</h2>
          <span className="badge badge-warning">{syncQueueCount} pending</span>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Simulates WatermelonDB event outbox queuing. Click Trigger Upload Sync to upload event sequence sequentially.
        </p>

        <button 
          className="m-btn m-btn-primary" 
          style={{ padding: '0.6rem', fontSize: '0.9rem', marginBottom: '1.25rem' }}
          disabled={isOffline || syncQueueCount === 0}
          onClick={onSync}
        >
          {t('syncBtn')}
        </button>

        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          {t('logsTitle')}
        </h3>

        <div className="logger-content">
          {syncLogs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>
              No synchronization activity. Sync is completely clear.
            </p>
          ) : (
            syncLogs.map((log, index) => (
              <div key={index} className="log-row">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
