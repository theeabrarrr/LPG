import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Camera, ShieldAlert } from 'lucide-react';

interface Stop {
  id: string;
  customerName: string;
  totalAmount: number;
}

interface PaymentCaptureProps {
  stop: Stop;
  deliveredQuantity: number;
  recoveredQuantity: number;
  signature: string;
  onBack: () => void;
  onSubmit: (data: {
    paymentMethod: 'CASH_ON_DELIVERY' | 'CHEQUE_ON_DELIVERY' | 'CREDIT';
    collectedAmount: number;
    chequeNumber?: string;
    receiptUrl?: string;
  }) => Promise<void>;
}

export const PaymentCapture: React.FC<PaymentCaptureProps> = ({
  stop,
  deliveredQuantity,
  recoveredQuantity,
  signature,
  onBack,
  onSubmit
}) => {
  const { t } = useTranslation();
  const [method, setMethod] = useState<'CASH_ON_DELIVERY' | 'CHEQUE_ON_DELIVERY' | 'CREDIT'>('CREDIT');
  const [collectedAmount, setCollectedAmount] = useState(stop.totalAmount);
  const [chequeNumber, setChequeNumber] = useState('');
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCameraScan = () => {
    setPhotoUploaded(true);
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (method === 'CHEQUE_ON_DELIVERY') {
      if (!chequeNumber) {
        alert('Please enter the Cheque Number.');
        return;
      }
      if (!photoUploaded) {
        alert('Please perform Cheque Image Capture.');
        return;
      }
    }
    setLoading(true);
    try {
      await onSubmit({
        paymentMethod: method,
        collectedAmount: method === 'CREDIT' ? 0 : parseFloat(collectedAmount.toString()),
        chequeNumber: method === 'CHEQUE_ON_DELIVERY' ? chequeNumber : undefined,
        receiptUrl: photoUploaded ? 'https://images.bucket/receipt-' + Date.now() + '.jpg' : undefined
      });
    } catch (err) {
      console.error(err);
      alert('Failed to log delivery details');
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
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Payment: {stop.customerName}</h2>
      </div>

      <form onSubmit={handleConfirmSubmit} className="m-card" style={{ flex: 1 }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
          Order Value: Rs. {stop.totalAmount} (Qty: {deliveredQuantity})
        </h3>

        {/* Option Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button 
            type="button"
            className="m-btn" 
            style={{ 
              background: method === 'CREDIT' ? 'rgba(0, 122, 255, 0.08)' : 'var(--bg-input)',
              border: method === 'CREDIT' ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
              color: 'var(--text-main)',
              justifyContent: 'flex-start',
              padding: '0.75rem 1rem'
            }}
            onClick={() => setMethod('CREDIT')}
          >
            {t('credit')}
          </button>
          <button 
            type="button"
            className="m-btn" 
            style={{ 
              background: method === 'CASH_ON_DELIVERY' ? 'rgba(0, 122, 255, 0.08)' : 'var(--bg-input)',
              border: method === 'CASH_ON_DELIVERY' ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
              color: 'var(--text-main)',
              justifyContent: 'flex-start',
              padding: '0.75rem 1rem'
            }}
            onClick={() => {
              setMethod('CASH_ON_DELIVERY');
              setCollectedAmount(stop.totalAmount);
            }}
          >
            {t('cash')}
          </button>
          <button 
            type="button"
            className="m-btn" 
            style={{ 
              background: method === 'CHEQUE_ON_DELIVERY' ? 'rgba(0, 122, 255, 0.08)' : 'var(--bg-input)',
              border: method === 'CHEQUE_ON_DELIVERY' ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
              color: 'var(--text-main)',
              justifyContent: 'flex-start',
              padding: '0.75rem 1rem'
            }}
            onClick={() => {
              setMethod('CHEQUE_ON_DELIVERY');
              setCollectedAmount(stop.totalAmount);
            }}
          >
            {t('cheque')}
          </button>
        </div>

        {/* Conditional inputs */}
        {method === 'CASH_ON_DELIVERY' && (
          <div className="form-group">
            <label className="form-label">{t('collectCash')}</label>
            <input 
              type="number" 
              className="form-input" 
              style={{ background: 'var(--bg-input)', fontSize: '1.2rem', padding: '0.85rem' }}
              value={collectedAmount}
              onChange={(e) => setCollectedAmount(parseFloat(e.target.value))}
            />
          </div>
        )}

        {method === 'CHEQUE_ON_DELIVERY' && (
          <div>
            <div className="form-group">
              <label className="form-label">{t('chequeNum')} *</label>
              <input 
                type="text" 
                className="form-input" 
                style={{ background: 'var(--bg-input)' }}
                required
                value={chequeNumber}
                onChange={(e) => setChequeNumber(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">{t('chequePhoto')} *</label>
              <button 
                type="button" 
                className="m-btn m-btn-secondary" 
                style={{ borderStyle: 'dashed' }}
                onClick={handleCameraScan}
              >
                <Camera size={16} />
                {photoUploaded ? 'Cheque Image Captured ✓' : 'Perform Cheque Image Capture'}
              </button>
            </div>
          </div>
        )}
      </form>

      <button 
        type="submit" 
        className="m-btn m-btn-primary" 
        style={{ marginTop: '1rem' }}
        disabled={loading}
        onClick={handleConfirmSubmit}
      >
        {loading ? 'Submitting...' : t('confirmDelivery')}
      </button>
    </div>
  );
};
