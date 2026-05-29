import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSignature, ChevronLeft } from 'lucide-react';

interface Stop {
  id: string;
  customerName: string;
  quantity: number;
  totalAmount: number;
}

interface DeliveryLogProps {
  stop: Stop;
  onBack: () => void;
  onGoToPayment: (data: {
    deliveredQuantity: number;
    recoveredQuantity: number;
    signature: string;
  }) => void;
}

export const DeliveryLog: React.FC<DeliveryLogProps> = ({
  stop,
  onBack,
  onGoToPayment
}) => {
  const { t } = useTranslation();
  const [delivered, setDelivered] = useState(stop.quantity);
  const [recovered, setRecovered] = useState(stop.quantity); // assume 1:1 default swap
  const [signed, setSigned] = useState(false);

  const incrementDelivered = () => setDelivered(prev => prev + 1);
  const decrementDelivered = () => setDelivered(prev => Math.max(1, prev - 1));

  const incrementRecovered = () => setRecovered(prev => prev + 1);
  const decrementRecovered = () => setRecovered(prev => Math.max(0, prev - 1));

  const handleNextStep = () => {
    if (!signed) {
      alert('Please obtain customer signature to confirm delivery.');
      return;
    }
    onGoToPayment({
      deliveredQuantity: delivered,
      recoveredQuantity: recovered,
      signature: 'http://signatures.bucket/sig-' + Date.now() + '.png'
    });
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
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{stop.customerName}</h2>
      </div>

      <div className="m-card" style={{ flex: 1 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
          {t('deliveryDetails')}
        </h3>

        {/* Fulls Delivered */}
        <div className="counter-row">
          <span>{t('fullsDelivered')}</span>
          <div className="counter-controls">
            <button type="button" className="counter-btn" onClick={decrementDelivered}>-</button>
            <span className="counter-value">{delivered}</span>
            <button type="button" className="counter-btn" onClick={incrementDelivered}>+</button>
          </div>
        </div>

        {/* Empties Recovered */}
        <div className="counter-row" style={{ marginBottom: '1.5rem' }}>
          <span>{t('emptiesRecovered')}</span>
          <div className="counter-controls">
            <button type="button" className="counter-btn" onClick={decrementRecovered}>-</button>
            <span className="counter-value">{recovered}</span>
            <button type="button" className="counter-btn" onClick={incrementRecovered}>+</button>
          </div>
        </div>

        {/* Customer Signature simulation */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <FileSignature size={14} />
            {t('customerSign')} *
          </label>
          <div 
            className="sig-canvas"
            onClick={() => setSigned(true)}
            style={{ borderColor: signed ? 'var(--color-success)' : 'var(--border-color)' }}
          >
            {signed ? (
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                ✓ Customer Signature Captured
              </span>
            ) : (
              <span>{t('signHere')}</span>
            )}
          </div>
          {signed && (
            <button 
              type="button" 
              style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', cursor: 'pointer' }}
              onClick={() => setSigned(false)}
            >
              {t('clearSign')}
            </button>
          )}
        </div>
      </div>

      <button 
        className="m-btn m-btn-primary" 
        style={{ marginTop: '1rem' }}
        onClick={handleNextStep}
      >
        {t('paymentCapture')}
      </button>
    </div>
  );
};
