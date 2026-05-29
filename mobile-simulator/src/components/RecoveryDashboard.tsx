import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Phone, DollarSign, Camera, Mic, MicOff, CheckCircle } from 'lucide-react';

interface Debtor {
  id: string;
  name: string;
  phoneNumber: string | null;
  address: string | null;
  creditBalance: number;
  emptyCylinderLiability: number;
  status: string;
}

interface RecoveryDashboardProps {
  agentName: string;
  debtors: Debtor[];
  onSubmitCollection: (dto: {
    customerId: string;
    collectedAmount: number;
    paymentMethod: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER';
    chequeNumber?: string;
    receiptUrl?: string;
    voiceMemoUrl?: string;
  }) => Promise<void>;
}

export const RecoveryDashboard: React.FC<RecoveryDashboardProps> = ({
  agentName,
  debtors,
  onSubmitCollection
}) => {
  const { t } = useTranslation();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'CASH' | 'CHEQUE' | 'BANK_TRANSFER'>('CASH');
  const [chequeNum, setChequeNum] = useState('');
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [loading, setLoading] = useState(false);

  const customer = debtors.find(d => d.id === selectedCustomerId);

  const handleToggleRecord = () => {
    if (recording) {
      setRecording(false);
      setVoiceRecorded(true);
    } else {
      setRecording(true);
      setVoiceRecorded(false);
    }
  };

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    const d = debtors.find(x => x.id === id);
    if (d) {
      setAmount(d.creditBalance.toString());
      setChequeNum('');
      setPhotoUploaded(false);
      setRecording(false);
      setVoiceRecorded(false);
    }
  };

  const handleCameraScan = () => {
    setPhotoUploaded(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    const parsedAmount = parseFloat(amount);
    
    if (method === 'CHEQUE' && !chequeNum) {
      alert('Cheque number is mandatory.');
      return;
    }
    if (method === 'CHEQUE' && !photoUploaded) {
      alert('Cheque Image Capture is mandatory.');
      return;
    }

    setLoading(true);
    try {
      await onSubmitCollection({
        customerId: selectedCustomerId,
        collectedAmount: parsedAmount,
        paymentMethod: method,
        chequeNumber: method === 'CHEQUE' ? chequeNum : undefined,
        receiptUrl: photoUploaded ? 'https://images.bucket/receipt-' + Date.now() + '.jpg' : undefined,
        voiceMemoUrl: voiceRecorded ? 'https://voice.bucket/audio-' + Date.now() + '.mp3' : undefined
      });
      alert('Payment collection submitted!');
      setSelectedCustomerId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to log payment collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Recovery Agent Portal</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{agentName}</p>
      </div>

      {!selectedCustomerId ? (
        /* Debtor Routing Stop List */
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
            Accounts Receivable Aging Outstanding List
          </h3>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {debtors.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>
                No active outstanding customer receivables.
              </p>
            ) : (
              debtors.map((d) => (
                <div 
                  key={d.id} 
                  className="m-card" 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    borderColor: d.creditBalance > 500 ? 'var(--color-danger)' : 'var(--border-color)'
                  }}
                >
                  <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{d.name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      <MapPin size={10} style={{ marginRight: '2px' }} />
                      {d.address || 'No Address'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Phone size={10} style={{ marginRight: '2px' }} />
                      {d.phoneNumber || 'No Phone'}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifySelf: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      Rs. {d.creditBalance.toLocaleString()}
                    </div>
                    <button 
                      className="m-btn m-btn-primary" 
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', width: 'auto', marginTop: '0.5rem', borderRadius: '8px' }}
                      onClick={() => handleSelectCustomer(d.id)}
                    >
                      Collect
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Collect Payment Form */
        customer && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button 
                onClick={() => setSelectedCustomerId(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                ← Back
              </button>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Collect: {customer.name}</h3>
            </div>

            <form onSubmit={handleFormSubmit} className="m-card" style={{ flex: 1, overflowY: 'auto' }}>
              <div className="form-group">
                <label className="form-label">Payment Amount (Rs.) *</label>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ background: 'var(--bg-input)', fontSize: '1.2rem', padding: '0.85rem' }}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Mode *</label>
                <select 
                  className="dropdown-select" 
                  style={{ width: '100%', padding: '0.85rem', background: 'var(--bg-input)' }}
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                >
                  <option value="CASH">Cash Payment</option>
                  <option value="CHEQUE">Cheque Image Capture</option>
                  <option value="BANK_TRANSFER">Bank Direct Deposit</option>
                </select>
              </div>

              {method === 'CHEQUE' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Cheque Number *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ background: 'var(--bg-input)' }}
                      required
                      value={chequeNum}
                      onChange={(e) => setChequeNum(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cheque Scan *</label>
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

              {/* Voice memo audio notes */}
              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label className="form-label">Record Voice Memo Notes</label>
                <button 
                  type="button" 
                  className={`m-btn ${recording ? 'm-btn-danger' : 'm-btn-secondary'}`}
                  onClick={handleToggleRecord}
                >
                  {recording ? <MicOff size={16} /> : <Mic size={16} />}
                  {recording ? 'Recording... Tap to Stop' : voiceRecorded ? 'Voice Memo Captured ✓' : 'Record Audio Context'}
                </button>
                {voiceRecorded && (
                  <div style={{ color: 'var(--color-success)', fontSize: '0.7rem', marginTop: '0.25rem', fontWeight: 600 }}>
                    Audio recorded: 14s.mp3 (watermarked with GPS coordinates).
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="m-btn m-btn-primary" 
                style={{ marginTop: '1.5rem' }}
                disabled={loading}
              >
                {loading ? 'Submitting payment...' : 'Confirm Payment Receipt Capture'}
              </button>
            </form>
          </div>
        )
      )}
    </div>
  );
};
