import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, ShieldAlert, Award, X, AlertTriangle, CheckCircle } from 'lucide-react';

interface ActiveShift {
  id: string;
  driverId: string;
  driverName: string;
  truckId: string;
  status: string;
  startOdometer: number;
  startFullCylinders: number;
  startEmptyCylinders: number;
  expectedCash: number;
  expenses: { id: string; amount: number; category: string; status: string }[];
}

interface ShiftReconciliationProps {
  shifts: ActiveShift[];
  onReconcile: (id: string, dto: {
    physicalCashCollected: number;
    endFullCylinders: number;
    endEmptyCylinders: number;
    reconciliationNotes?: string;
  }) => Promise<any>;
  API_BASE?: string;
}

export const ShiftReconciliation: React.FC<ShiftReconciliationProps> = ({
  shifts,
  onReconcile,
  API_BASE
}) => {
  const { t } = useTranslation();
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [physicalCashCollected, setPhysicalCashCollected] = useState(0);
  const [endFullCylinders, setEndFullCylinders] = useState(0);
  const [endEmptyCylinders, setEndEmptyCylinders] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [detailedShift, setDetailedShift] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const handlePrintInvoice = (o: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>DELIVERY CHALLAN & INVOICE - #${o.id.slice(0,8).toUpperCase()}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #333; padding: 30px; line-height: 1.4; }
            .header-table { width: 100%; border: none; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; color: #007aff; }
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .meta-table td { padding: 5px 0; font-size: 13px; }
            .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }
            .invoice-table th { background: #f2f2f2; font-size: 12px; font-weight: bold; text-transform: uppercase; padding: 10px; border: 1px solid #ddd; text-align: left; }
            .invoice-table td { font-size: 13px; padding: 10px; border: 1px solid #ddd; }
            .total-row { font-weight: bold; background: #fafafa; }
            .notes-box { background: #f9f9f9; border: 1px solid #eee; padding: 15px; border-radius: 5px; font-size: 12px; margin-bottom: 40px; }
            .footer { display: flex; justify-content: space-between; margin-top: 50px; font-size: 13px; text-align: center; }
            .sig-line { border-top: 1px solid #333; width: 200px; margin-top: 50px; padding-top: 5px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <table class="header-table">
            <tr>
              <td>
                <div class="title">Raza Gas Pvt Ltd</div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">Karachi, Pakistan</div>
                <div style="font-size: 12px; color: #666;">Phone: 0340-2696414 | Email: accounts@razagas.com</div>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <h2 style="margin: 0; font-size: 18px; color: #555;">DELIVERY CHALLAN & INVOICE</h2>
                <div style="font-size: 13px; font-weight: bold; margin-top: 5px;">No: DC-${o.id.slice(0,8).toUpperCase()}</div>
              </td>
            </tr>
          </table>

          <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />

          <table style="width: 100%; margin-bottom: 30px; font-size: 13px;">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <h4 style="margin: 0 0 5px 0; color: #666; font-size: 11px; text-transform: uppercase;">Customer Details</h4>
                <strong>${o.customer?.name || 'Walk-in Customer'}</strong><br />
                Address: ${o.customer?.address || 'N/A'}<br />
                Phone: ${o.customer?.phoneNumber || 'N/A'}
              </td>
              <td style="width: 50%; vertical-align: top; text-align: right;">
                <h4 style="margin: 0 0 5px 0; color: #666; font-size: 11px; text-transform: uppercase;">Delivery Information</h4>
                <strong>Date:</strong> ${o.deliveredAt ? new Date(o.deliveredAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}<br />
                <strong>Driver Name:</strong> ${detailedShift?.driverName || 'N/A'}<br />
                <strong>Payment Method:</strong> ${o.paymentTerms || 'CREDIT'}
              </td>
            </tr>
          </table>

          <table class="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty (45.2 KG LPG)</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>LPG Commercial Cylinder Refill (45.2 KG)</td>
                <td style="text-align: center;">${o.quantity}</td>
                <td style="text-align: right;">Rs. ${o.unitPrice ? o.unitPrice.toLocaleString() : (o.totalAmount / o.quantity).toLocaleString()}</td>
                <td style="text-align: right;">Rs. ${o.totalAmount.toLocaleString()}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3" style="text-align: right;">Net Amount Payable:</td>
                <td style="text-align: right; color: #007aff;">Rs. ${o.totalAmount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          ${o.notes ? `
            <div class="notes-box">
              <strong>Delivery Notes / Details:</strong> ${o.notes}
            </div>
          ` : ''}

          <div class="footer">
            <div>
              <div class="sig-line">Prepared By (Driver/Rep)</div>
            </div>
            <div>
              <div class="sig-line">Customer Signature & Stamp</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const activeShift = shifts.find((s) => s.id === selectedShiftId);

  const calculateExpectedEmpties = () => {
    if (!detailedShift) return activeShift?.startEmptyCylinders || 0;
    const recoveredEmpties = detailedShift.cylinderLedgers?.reduce((sum: number, l: any) => {
      if (l.transactionType === 'EMPTY_RECOVERY_FROM_CUSTOMER') {
        return sum + l.emptyDelta;
      }
      return sum;
    }, 0) || 0;
    return (detailedShift.startEmptyCylinders || 0) + recoveredEmpties;
  };

  const calculateExpectedFulls = () => {
    if (!detailedShift) return activeShift?.startFullCylinders || 0;
    const deliveredFulls = detailedShift.orders?.reduce((sum: number, o: any) => {
      if (o.status === 'DELIVERED_UNVERIFIED' || o.status === 'COMPLETED') {
        return sum + o.quantity;
      }
      return sum;
    }, 0) || 0;
    return Math.max(0, (detailedShift.startFullCylinders || 0) - deliveredFulls);
  };

  const handleSelectShift = async (id: string) => {
    setSelectedShiftId(id);
    const s = shifts.find((x) => x.id === id);
    if (s) {
      setPhysicalCashCollected(s.expectedCash);
      setEndFullCylinders(s.startFullCylinders); 
      setEndEmptyCylinders(s.startEmptyCylinders);
      setNotes('');
      setResult(null);
      setDetailedShift(null);
    }

    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/shifts/${id}`);
        if (res.ok) {
          const data = await res.json();
          setDetailedShift(data);
        }
      } catch (err) {
        console.error('Error fetching shift details:', err);
      }
    }
  };

  // Pre-populate input fields dynamically when detailed shift is loaded
  React.useEffect(() => {
    if (detailedShift) {
      setEndFullCylinders(calculateExpectedFulls());
      setEndEmptyCylinders(calculateExpectedEmpties());
    }
  }, [detailedShift]);

  const handleApproveReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftId) return;
    setLoading(true);
    try {
      const res = await onReconcile(selectedShiftId, {
        physicalCashCollected: parseFloat(physicalCashCollected.toString()),
        endFullCylinders: parseInt(endFullCylinders.toString()),
        endEmptyCylinders: parseInt(endEmptyCylinders.toString()),
        reconciliationNotes: notes
      });
      setResult(res);
      alert('Shift reconciled successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to reconcile shift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">{t('shiftReconciliation')}</h1>
        <p className="page-subtitle">Reconcile returned cylinders, variance balances, and cash collected by the driver</p>
      </div>

      <div className="main-grid" style={{ gridTemplateColumns: activeShift ? '1.2fr 1.8fr' : '1fr' }}>
        {/* Left Side: Select Active Shift */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 className="panel-title">
            <ClipboardCheck size={20} />
            Select Active Check-out / Dispatch Session
          </h2>
          
          {shifts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
              No check-out / dispatch sessions are currently active or awaiting reconciliation.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {shifts.map((s) => (
                <div 
                  key={s.id}
                  onClick={() => handleSelectShift(s.id)}
                  style={{ 
                    padding: '1rem', 
                    background: selectedShiftId === s.id ? 'rgba(0, 122, 255, 0.08)' : 'rgba(255, 255, 255, 0.01)', 
                    border: selectedShiftId === s.id ? '1px solid var(--color-primary)' : '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700 }}>{s.truckId}</span>
                    <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>{s.status}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Driver: {s.driverName} | Expected Cash: Rs. {s.expectedCash.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Reconcile Shift Form */}
        {activeShift && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h2 className="panel-title">
              <Award size={20} />
              Driver Settlement / Shift Reconciliation Details: {activeShift.truckId} ({activeShift.driverName})
            </h2>

            <form onSubmit={handleApproveReconciliation}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Loaded Full Cylinders</label>
                  <input type="text" className="form-input" disabled value={activeShift.startFullCylinders} />
                </div>
                <div className="form-group">
                  <label className="form-label">Returned Full Cylinders *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    value={endFullCylinders} 
                    onChange={(e) => setEndFullCylinders(parseInt(e.target.value))} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Loaded Empty Cylinders</label>
                  <input type="text" className="form-input" disabled value={activeShift.startEmptyCylinders} />
                </div>
                <div className="form-group">
                  <label className="form-label">Returned Empty Cylinders *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    value={endEmptyCylinders} 
                    onChange={(e) => setEndEmptyCylinders(parseInt(e.target.value))} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expected Cash (Rs.)</label>
                  <input type="text" className="form-input" disabled value={`Rs. ${activeShift.expectedCash.toLocaleString()}`} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('physicalCash')} *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    value={physicalCashCollected} 
                    onChange={(e) => setPhysicalCashCollected(parseFloat(e.target.value))} 
                  />
                </div>
              </div>

              {/* Order Deliveries with Geofence Alerts */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                  Dispatched Deliveries Geofence Verification
                </h3>
                {detailedShift?.orders ? (
                  detailedShift.orders.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No orders dispatched in this shift.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {detailedShift.orders.map((o: any) => (
                        <div 
                          key={o.id}
                          style={{
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.01)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
                              Order to: {o.customer?.name || o.customerId.slice(0, 8)}
                              <button
                                type="button"
                                className="btn"
                                onClick={() => handlePrintInvoice(o)}
                                style={{ 
                                  padding: '0.15rem 0.4rem', 
                                  fontSize: '0.65rem', 
                                  marginLeft: '0.5rem', 
                                  background: 'rgba(255,255,255,0.05)', 
                                  border: '1px solid var(--border-color)', 
                                  color: 'var(--text-main)',
                                  borderRadius: '4px',
                                  cursor: 'pointer' 
                                }}
                              >
                                Print Invoice
                              </button>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Quantity: {o.quantity} Cylinders | Payment: {o.paymentTerms}
                            </div>
                          </div>
                          <div>
                            {o.geofenceViolated ? (
                              <span 
                                className="badge"
                                style={{
                                  background: 'rgba(255, 59, 48, 0.1)',
                                  color: 'var(--color-danger)',
                                  borderColor: 'rgba(255, 59, 48, 0.2)',
                                  fontSize: '0.7rem',
                                  fontWeight: 700
                                }}
                              >
                                ⚠️ Geofence Breach: {o.geofenceDistance ? `${Math.round(o.geofenceDistance)}m` : '???'} offsite
                              </span>
                            ) : (
                              <span 
                                className="badge"
                                style={{
                                  background: 'rgba(52, 199, 89, 0.1)',
                                  color: 'var(--color-success)',
                                  borderColor: 'rgba(52, 199, 89, 0.2)',
                                  fontSize: '0.7rem',
                                  fontWeight: 700
                                }}
                              >
                                ✓ Within Geofence
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Syncing shift deliveries...
                  </div>
                )}
              </div>

              {/* Expense Claims & Receipt Audit */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                  Field Expense Claims Audit
                </h3>
                {detailedShift?.expenseClaims ? (
                  detailedShift.expenseClaims.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No expense claims submitted.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {detailedShift.expenseClaims.map((ec: any) => (
                        <div 
                          key={ec.id}
                          style={{
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.01)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                              {ec.category} Claim: Rs. {ec.amount.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Status: <span style={{ fontWeight: 600, color: ec.status === 'APPROVED' ? 'var(--color-success)' : ec.status === 'REJECTED' ? 'var(--color-danger)' : 'var(--color-warning)' }}>{ec.status}</span>
                            </div>
                          </div>
                          <div>
                            {ec.receiptUrl ? (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', width: 'auto' }}
                                onClick={() => {
                                  setSelectedReceipt(ec);
                                  setShowReceiptModal(true);
                                }}
                              >
                                View Receipt
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No Receipt URL</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Syncing field expense claims...
                  </div>
                )}
              </div>

              {/* Real-time Variance Analysis */}
              <div 
                style={{ 
                  padding: '1rem', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem'
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                  Live Inventory / Cash Variance Calculations
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span>Cash Variance:</span>
                  <span style={{ 
                    fontWeight: 700, 
                    color: (physicalCashCollected - activeShift.expectedCash) < 0 ? 'var(--color-danger)' : (physicalCashCollected - activeShift.expectedCash) > 0 ? 'var(--color-warning)' : 'var(--color-success)'
                  }}>
                    Rs. {(physicalCashCollected - activeShift.expectedCash).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span>Full Cylinders Variance:</span>
                  <span style={{ 
                    fontWeight: 700, 
                    color: (endFullCylinders - calculateExpectedFulls()) === 0 ? 'var(--color-success)' : 'var(--color-warning)'
                  }}>
                    {(endFullCylinders - calculateExpectedFulls()) > 0 ? `+${endFullCylinders - calculateExpectedFulls()}` : endFullCylinders - calculateExpectedFulls()} Full
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Empty Cylinder / Shells Variance:</span>
                  <span style={{ 
                    fontWeight: 700, 
                    color: (endEmptyCylinders - calculateExpectedEmpties()) === 0 ? 'var(--color-success)' : 'var(--color-warning)'
                  }}>
                    {(endEmptyCylinders - calculateExpectedEmpties()) > 0 ? `+${endEmptyCylinders - calculateExpectedEmpties()}` : endEmptyCylinders - calculateExpectedEmpties()} Empty Shells
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Driver Settlement / Shift Reconciliation Notes</label>
                <textarea 
                  className="form-input" 
                  style={{ height: '70px', resize: 'none' }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain any variance shortages/overages here..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Reconciling...' : t('reconcileShift')}
                </button>
              </div>
            </form>

            {/* Reconciliation results journal log */}
            {result && (
              <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid var(--color-success)' }}>
                <h3 style={{ color: 'var(--color-success)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={16} />
                  Double-entry Journal Posted!
                </h3>
                <div style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  <div>Batch ID: {result.ledgerResult?.batchId || 'N/A'}</div>
                  {result.ledgerResult?.entries?.map((e: any, idx: number) => (
                    <div key={idx} style={{ marginTop: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      Account: {e.accountId} | Debit: Rs. {e.debit} | Credit: Rs. {e.credit}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Watermarked Expense Receipt Modal */}
      {showReceiptModal && selectedReceipt && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}
        >
          <div 
            className="glass-panel" 
            style={{ 
              width: '100%', 
              maxWidth: '850px', 
              display: 'grid', 
              gridTemplateColumns: '1.2fr 0.8fr', 
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
              background: 'var(--bg-card)'
            }}
          >
            {/* Close button */}
            <button 
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                zIndex: 1001
              }}
              onClick={() => {
                setShowReceiptModal(false);
                setSelectedReceipt(null);
              }}
            >
              <X size={16} />
            </button>

            {/* Left Column: Image with watermarks */}
            <div 
              style={{ 
                background: '#09090b', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '2rem',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '400px'
              }}
            >
              <img 
                src={selectedReceipt.receiptUrl} 
                alt="Expense Receipt" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '420px', 
                  objectFit: 'contain',
                  borderRadius: '8px',
                  opacity: 0.8
                }} 
              />
              
              {/* Secure Watermark Overlay */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                  opacity: 0.12,
                  color: 'var(--color-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  userSelect: 'none'
                }}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      transform: 'rotate(-25deg)', 
                      whiteSpace: 'nowrap',
                      width: '130%',
                      textAlign: 'center',
                      background: 'rgba(0,0,0,0.05)',
                      padding: '4px 0'
                    }}
                  >
                    LPG SYSTEM SECURE AUDIT • LAT: {selectedReceipt.latitude?.toFixed(5) || 'N/A'} LON: {selectedReceipt.longitude?.toFixed(5) || 'N/A'} • HASH: {selectedReceipt.receiptHash?.slice(0, 10) || 'N/A'}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Metadata details */}
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(20,20,25,0.4)', borderLeft: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Audit Logged</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{selectedReceipt.category} Category</span>
                </div>

                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                  Rs. {selectedReceipt.amount.toLocaleString()}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                  "{selectedReceipt.description || 'No description provided.'}"
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GPS Verification Coordinates</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: 'var(--text-light)' }}>
                      📍 {selectedReceipt.latitude && selectedReceipt.longitude ? (
                        `${selectedReceipt.latitude.toFixed(6)}, ${selectedReceipt.longitude.toFixed(6)}`
                      ) : (
                        'No GPS location verification metadata'
                      )}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cryptographic Hash Verification</div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '2px', background: 'rgba(255,255,255,0.01)', padding: '0.25rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-light)' }}>
                      {selectedReceipt.receiptHash || 'unhashed-legacy-data'}
                    </div>
                  </div>

                  {selectedReceipt.odometer && (
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Odometer at Refuel</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '2px', color: 'var(--text-light)' }}>
                        {selectedReceipt.odometer} km
                      </div>
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Timestamp Uploaded</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '2px', color: 'var(--text-light)' }}>
                      {new Date(selectedReceipt.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', marginTop: '2rem' }}
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedReceipt(null);
                }}
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
