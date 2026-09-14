import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone,
  Building2,
  Handshake,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Lock,
  Printer,
  MessageSquare,
  MapPin,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export default function PaymentModal({ product, onClose, onSuccess }) {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Step state
  const [selectedMethod, setSelectedMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'handover'
  const [deliveryLocation, setDeliveryLocation] = useState(
    product.location || 'South Campus Shopping Complex'
  );
  const [customLocation, setCustomLocation] = useState('');

  // UPI State
  const [upiSubTab, setUpiSubTab] = useState('apps'); // 'apps' | 'qr'
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [upiId, setUpiId] = useState('');
  const [upiVerified, setUpiVerified] = useState(false);
  const [qrTimer, setQrTimer] = useState(300); // 5 minutes

  // Card State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [cardBrand, setCardBrand] = useState('generic'); // 'visa' | 'mastercard' | 'rupay' | 'generic'

  // Bank OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(45);

  // Net Banking State
  const [selectedBank, setSelectedBank] = useState('sbi');

  // Flow & Result State
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);
  const [handoverPin, setHandoverPin] = useState('');

  const price = parseFloat(product.price);
  const platformFee = 0.00;
  const total = price + platformFee;

  const campusSpots = [
    'South Campus Shopping Complex',
    'Men\'s Hostel J (MH-J) Gate',
    'Men\'s Hostel K (MH-K) Entrance',
    'Ladies Hostel B (LH-B) Common Room',
    'Ladies Hostel A (LH-A) Reception',
    'Indira Gandhi Memorial (IGM) Library Steps',
    'SCIS Building Ground Floor',
    'School of Chemistry Foyer',
    'School of Physics Gate',
    'Campus Lake Road Cafeteria',
    'Custom Campus Location'
  ];

  // Dynamic QR Code Countdown timer
  useEffect(() => {
    if (selectedMethod === 'upi' && upiSubTab === 'qr') {
      const interval = setInterval(() => {
        setQrTimer((prev) => (prev > 0 ? prev - 1 : 300));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedMethod, upiSubTab]);

  // 3DS OTP Countdown timer
  useEffect(() => {
    if (showOtpModal && otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showOtpModal, otpTimer]);

  // Card formatting & live brand detection
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    // Brand detection
    if (val.startsWith('4')) {
      setCardBrand('visa');
    } else if (/^(5[1-5]|2[2-7])/.test(val)) {
      setCardBrand('mastercard');
    } else if (/^(60|65|81|82|508)/.test(val)) {
      setCardBrand('rupay');
    } else {
      setCardBrand('generic');
    }

    // Format 4-4-4-4
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    setCardExpiry(val);
  };

  // Final delivery spot
  const finalLocation = deliveryLocation === 'Custom Campus Location'
    ? (customLocation.trim() || 'UoH Campus Central Point')
    : deliveryLocation;

  // Verification & Execution
  const executePayment = async (methodName, detailsObj) => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      // 1. Create order on backend
      const orderData = await api.createOrder(product.id);

      // 2. Simulated secure signature
      const simulatedPaymentId = `pay_${methodName.toLowerCase()}_${Date.now()}`;
      const simulatedSig = `sandbox_sig_${Date.now()}`;

      // 3. Verify on backend with atomic transaction locking
      const verifyRes = await api.verifyPayment({
        productId: product.id,
        deliveryLocation: finalLocation,
        razorpayOrderId: orderData.orderId,
        razorpayPaymentId: simulatedPaymentId,
        razorpaySignature: simulatedSig,
        paymentMethod: methodName,
        paymentDetails: detailsObj
      });

      // Generate a 4-digit campus security handover PIN
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      setHandoverPin(pin);

      setCompletedOrder(verifyRes.order);
      showToast(`Payment successful via ${methodName}!`, 'success');
      if (onSuccess) onSuccess(verifyRes.order);
    } catch (err) {
      console.error('Payment failure:', err);
      setErrorMsg(err.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
      setShowOtpModal(false);
    }
  };

  // Submit trigger
  const handleProceedPayment = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (selectedMethod === 'upi') {
      const upiHandle = upiSubTab === 'apps'
        ? (upiId || `${selectedUpiApp}_student@upi`)
        : 'Instant_QR_Scan@uohyd';
      executePayment('UPI', { upiId: upiHandle, app: selectedUpiApp });
    } else if (selectedMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 15) {
        setErrorMsg('Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setErrorMsg('Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setErrorMsg('Please enter a valid CVV.');
        return;
      }
      // Open 3DS Bank OTP verification modal!
      setShowOtpModal(true);
      setOtpTimer(45);
      setOtpCode('482910'); // Auto fill demo OTP
    } else if (selectedMethod === 'netbanking') {
      const bankNames = {
        sbi: 'State Bank of India',
        hdfc: 'HDFC Bank',
        icici: 'ICICI Bank',
        axis: 'Axis Bank',
        pnb: 'Punjab National Bank',
        kotak: 'Kotak Mahindra Bank'
      };
      executePayment('NETBANKING', { bank: bankNames[selectedBank] || selectedBank });
    } else if (selectedMethod === 'handover') {
      executePayment('CAMPUS_HANDOVER', { type: 'Cash / Spot UPI on Meetup', verifiedSpot: finalLocation });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '820px', width: '95%', maxHeight: '92vh' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ background: 'var(--primary)', color: '#fff', borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
              <ShieldCheck size={20} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>Secure Campus Checkout</h3>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>256-Bit Encrypted Peer-to-Peer Gateway</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {completedOrder ? (
            /* Post-Payment Success View */
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <CheckCircle2 size={64} color="var(--accent)" style={{ margin: '0 auto 1rem auto' }} />
              <h2 style={{ fontSize: '1.6rem', color: 'var(--primary)', marginBottom: '0.4rem' }}>
                Payment Confirmed!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Order <strong>#{completedOrder.order_number}</strong> is successfully placed. The seller has been alerted.
              </p>

              {/* Handover PIN Badge */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0c2340 0%, #163660 100%)',
                  color: '#fff',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  maxWidth: '420px',
                  margin: '0 auto 1.5rem auto',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38bdf8', marginBottom: '0.3rem' }}>
                  Handover Safety Exchange PIN
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '0.2em' }}>
                  {handoverPin || '8492'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '0.3rem' }}>
                  Share this 4-digit code with the seller when inspecting and receiving your item at <strong>{finalLocation}</strong>.
                </div>
              </div>

              {/* Order Receipt Details */}
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '1.2rem',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  fontSize: '0.88rem',
                  maxWidth: '480px',
                  margin: '0 auto 1.75rem auto',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Product:</span>
                  <strong>{product.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Amount Paid:</span>
                  <strong style={{ color: 'var(--primary)' }}>₹{total.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
                  <span className="badge badge-active">{selectedMethod.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Handover Spot:</span>
                  <span>{finalLocation}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/orders');
                  }}
                  className="btn btn-primary"
                >
                  View My Orders & Invoices
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/messages?conv=new&seller=${product.seller_id}`);
                  }}
                  className="btn btn-accent"
                >
                  <MessageSquare size={16} />
                  <span>Message Seller</span>
                </button>
              </div>
            </div>
          ) : (
            /* Multi-Payment Interface */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: '1.75rem' }}>
              {/* Left Column: Handover Point & Payment Methods */}
              <div>
                {errorMsg && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Step 1: Campus Handover Location */}
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                    <MapPin size={16} color="var(--primary)" />
                    <span>1. Select Campus Handover Spot</span>
                  </label>
                  <select
                    className="form-control"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                  >
                    {campusSpots.map((spot) => (
                      <option key={spot} value={spot}>{spot}</option>
                    ))}
                  </select>

                  {deliveryLocation === 'Custom Campus Location' && (
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter specific hostel room, department lab, or landmark..."
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      style={{ marginTop: '0.5rem' }}
                      required
                    />
                  )}
                </div>

                {/* Step 2: Payment Method Tabs */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                    <CreditCard size={16} color="var(--primary)" />
                    <span>2. Select Payment Option</span>
                  </label>

                  {/* Method Selectors */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    {/* UPI */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('upi')}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: selectedMethod === 'upi' ? '2px solid var(--teal)' : '1px solid var(--border)',
                        background: selectedMethod === 'upi' ? 'rgba(8, 145, 178, 0.08)' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'var(--transition)'
                      }}
                    >
                      <Smartphone size={20} color={selectedMethod === 'upi' ? 'var(--teal)' : 'var(--text-secondary)'} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: selectedMethod === 'upi' ? 'var(--teal)' : 'var(--text-primary)' }}>
                        UPI / Apps
                      </span>
                    </button>

                    {/* Cards */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('card')}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: selectedMethod === 'card' ? '2px solid var(--teal)' : '1px solid var(--border)',
                        background: selectedMethod === 'card' ? 'rgba(8, 145, 178, 0.08)' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'var(--transition)'
                      }}
                    >
                      <CreditCard size={20} color={selectedMethod === 'card' ? 'var(--teal)' : 'var(--text-secondary)'} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: selectedMethod === 'card' ? 'var(--teal)' : 'var(--text-primary)' }}>
                        Debit / Credit
                      </span>
                    </button>

                    {/* Net Banking */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('netbanking')}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: selectedMethod === 'netbanking' ? '2px solid var(--teal)' : '1px solid var(--border)',
                        background: selectedMethod === 'netbanking' ? 'rgba(8, 145, 178, 0.08)' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'var(--transition)'
                      }}
                    >
                      <Building2 size={20} color={selectedMethod === 'netbanking' ? 'var(--teal)' : 'var(--text-secondary)'} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: selectedMethod === 'netbanking' ? 'var(--teal)' : 'var(--text-primary)' }}>
                        Net Banking
                      </span>
                    </button>

                    {/* Pay on Handover */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('handover')}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: selectedMethod === 'handover' ? '2px solid var(--teal)' : '1px solid var(--border)',
                        background: selectedMethod === 'handover' ? 'rgba(8, 145, 178, 0.08)' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'var(--transition)'
                      }}
                    >
                      <Handshake size={20} color={selectedMethod === 'handover' ? 'var(--teal)' : 'var(--text-secondary)'} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: selectedMethod === 'handover' ? 'var(--teal)' : 'var(--text-primary)' }}>
                        Handover Pay
                      </span>
                    </button>
                  </div>

                  {/* Method Content Panel */}
                  <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    {/* 1. UPI Interface */}
                    {selectedMethod === 'upi' && (
                      <div>
                        {/* UPI Subtabs */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                          <button
                            type="button"
                            onClick={() => setUpiSubTab('apps')}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              border: upiSubTab === 'apps' ? '1px solid var(--teal)' : '1px solid var(--border)',
                              background: upiSubTab === 'apps' ? '#fff' : 'transparent',
                              color: upiSubTab === 'apps' ? 'var(--teal)' : 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}
                          >
                            UPI Apps & ID
                          </button>
                          <button
                            type="button"
                            onClick={() => setUpiSubTab('qr')}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              border: upiSubTab === 'qr' ? '1px solid var(--teal)' : '1px solid var(--border)',
                              background: upiSubTab === 'qr' ? '#fff' : 'transparent',
                              color: upiSubTab === 'qr' ? 'var(--teal)' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <QrCode size={13} />
                            <span>Scan QR Code</span>
                          </button>
                        </div>

                        {upiSubTab === 'apps' ? (
                          <>
                            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                              {[
                                { id: 'gpay', label: 'Google Pay', color: '#4285F4' },
                                { id: 'phonepe', label: 'PhonePe', color: '#5f259f' },
                                { id: 'paytm', label: 'Paytm', color: '#00BAF2' },
                                { id: 'bhim', label: 'BHIM UPI', color: '#008744' }
                              ].map((app) => (
                                <button
                                  key={app.id}
                                  type="button"
                                  onClick={() => setSelectedUpiApp(app.id)}
                                  style={{
                                    padding: '0.45rem 0.85rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: selectedUpiApp === app.id ? `2px solid ${app.color}` : '1px solid var(--border)',
                                    background: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    color: selectedUpiApp === app.id ? app.color : 'var(--text-secondary)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {app.label}
                                </button>
                              ))}
                            </div>

                            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                              <label className="form-label" style={{ fontSize: '0.82rem' }}>
                                Enter your UPI ID / VPA
                              </label>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="e.g. 25mca01@okhdfcbank"
                                  value={upiId}
                                  onChange={(e) => {
                                    setUpiId(e.target.value);
                                    setUpiVerified(false);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (upiId.includes('@')) {
                                      setUpiVerified(true);
                                      showToast('UPI ID verified successfully!', 'success');
                                    } else {
                                      showToast('Please enter a valid UPI format (name@bank)', 'error');
                                    }
                                  }}
                                  className="btn btn-outline btn-sm"
                                  style={{ flexShrink: 0 }}
                                >
                                  {upiVerified ? 'Verified' : 'Verify'}
                                </button>
                              </div>
                              {upiVerified && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.3rem' }}>
                                  <CheckCircle2 size={13} />
                                  <span>Verified UoH Student VPA</span>
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          /* Dynamic Scan QR View */
                          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                            <div
                              style={{
                                width: '150px',
                                height: '150px',
                                background: '#fff',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                margin: '0 auto 0.75rem auto',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: 'var(--shadow-sm)'
                              }}
                            >
                              <svg viewBox="0 0 100 100" width="130" height="130">
                                <rect width="100" height="100" fill="#fff" />
                                <rect x="5" y="5" width="30" height="30" fill="#0c2340" />
                                <rect x="10" y="10" width="20" height="20" fill="#fff" />
                                <rect x="15" y="15" width="10" height="10" fill="#0c2340" />

                                <rect x="65" y="5" width="30" height="30" fill="#0c2340" />
                                <rect x="70" y="10" width="20" height="20" fill="#fff" />
                                <rect x="75" y="15" width="10" height="10" fill="#0c2340" />

                                <rect x="5" y="65" width="30" height="30" fill="#0c2340" />
                                <rect x="10" y="70" width="20" height="20" fill="#fff" />
                                <rect x="15" y="75" width="10" height="10" fill="#0c2340" />

                                <rect x="42" y="15" width="8" height="8" fill="#0891b2" />
                                <rect x="42" y="42" width="16" height="16" fill="#0c2340" />
                                <rect x="25" y="42" width="10" height="10" fill="#0891b2" />
                                <rect x="65" y="42" width="12" height="8" fill="#0c2340" />
                                <rect x="65" y="65" width="14" height="14" fill="#0891b2" />
                                <rect x="42" y="75" width="12" height="10" fill="#0c2340" />
                              </svg>
                            </div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
                              Scan with GPay, PhonePe, or Paytm
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                              <Clock size={12} />
                              <span>
                                QR expires in {Math.floor(qrTimer / 60)}:{(qrTimer % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. Credit / Debit Card Interface */}
                    {selectedMethod === 'card' && (
                      <div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Card Number</span>
                            <span style={{ textTransform: 'uppercase', fontWeight: 800, color: 'var(--teal)', fontSize: '0.75rem' }}>
                              {cardBrand}
                            </span>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="4111 2222 3333 4444"
                              value={cardNumber}
                              onChange={handleCardNumberChange}
                              maxLength={19}
                            />
                            <CreditCard size={18} color="var(--text-muted)" style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.82rem' }}>Name on Card</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. VIBHISHAN KUMAR"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          />
                        </div>

                        <div className="grid-cols-2">
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.82rem' }}>Expiry Date</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="MM/YY"
                              value={cardExpiry}
                              onChange={handleExpiryChange}
                              maxLength={5}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.82rem' }}>CVV</label>
                            <input
                              type="password"
                              className="form-control"
                              placeholder="•••"
                              maxLength={4}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          <input
                            type="checkbox"
                            id="saveCardCheck"
                            checked={saveCard}
                            onChange={(e) => setSaveCard(e.target.checked)}
                          />
                          <label htmlFor="saveCardCheck" style={{ cursor: 'pointer' }}>
                            Securely save card as per RBI guidelines (Tokenized)
                          </label>
                        </div>
                      </div>
                    )}

                    {/* 3. Net Banking Interface */}
                    {selectedMethod === 'netbanking' && (
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.6rem' }}>Popular Indian Banks</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                          {[
                            { id: 'sbi', label: 'SBI' },
                            { id: 'hdfc', label: 'HDFC Bank' },
                            { id: 'icici', label: 'ICICI Bank' },
                            { id: 'axis', label: 'Axis Bank' },
                            { id: 'pnb', label: 'PNB' },
                            { id: 'kotak', label: 'Kotak' }
                          ].map((bank) => (
                            <button
                              key={bank.id}
                              type="button"
                              onClick={() => setSelectedBank(bank.id)}
                              style={{
                                padding: '0.55rem',
                                borderRadius: 'var(--radius-sm)',
                                border: selectedBank === bank.id ? '2px solid var(--teal)' : '1px solid var(--border)',
                                background: '#fff',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                color: selectedBank === bank.id ? 'var(--teal)' : 'var(--text-primary)',
                                cursor: 'pointer'
                              }}
                            >
                              {bank.label}
                            </button>
                          ))}
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.82rem' }}>All Other Banks</label>
                          <select className="form-control" style={{ fontSize: '0.85rem' }}>
                            <option>Bank of Baroda</option>
                            <option>Canara Bank</option>
                            <option>Union Bank of India</option>
                            <option>IndusInd Bank</option>
                            <option>IDFC FIRST Bank</option>
                            <option>Yes Bank</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* 4. Campus Handover Pay */}
                    {selectedMethod === 'handover' && (
                      <div style={{ padding: '0.5rem 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.92rem' }}>
                          <Handshake size={18} color="var(--accent)" />
                          <span>Pay in Person at Meetup</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                          No upfront deduction! Meet the student seller at <strong>{finalLocation}</strong>. Inspect the item thoroughly and hand over cash or scan their UPI QR code on the spot.
                        </p>
                        <div style={{ background: '#fff', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          🛡️ A 4-digit security exchange code will be generated upon confirmation to guarantee trust.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Amazon-Style Price Breakdown & Guaranteed Protection */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Product Snippet */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <img
                    src={product.primary_image || (product.images && product.images[0]?.image_url)}
                    alt={product.name}
                    style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Sold by: {product.seller_name || 'UoH Student'}
                    </div>
                  </div>
                </div>

                {/* Price Details Card */}
                <div className="card" style={{ padding: '1.1rem', backgroundColor: 'var(--bg-subtle)', marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Order Summary
                  </h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.45rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Item Price:</span>
                    <span>₹{price.toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.45rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Campus Handover:</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>FREE</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Platform Fee:</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>₹0 (No Fee)</span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                    <span>Order Total:</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Trust Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  <Lock size={14} color="var(--accent)" />
                  <span>Razorpay Test Sandbox & Verified Student Protocol</span>
                </div>

                {/* Main Action Button */}
                <button
                  type="button"
                  onClick={handleProceedPayment}
                  disabled={isProcessing}
                  className="btn btn-primary btn-block btn-lg"
                  style={{ marginTop: 'auto' }}
                >
                  {isProcessing ? 'Verifying Transaction...' : `Pay ₹${total.toLocaleString('en-IN')}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Realistic Bank 3D Secure OTP Modal Overlay */}
        {showOtpModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(3px)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--primary)' }}>SBI / HDFC 3D-Secure</span>
                <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
                  VERIFIED BY VISA
                </span>
              </div>

              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(8, 145, 178, 0.1)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <ShieldCheck size={24} />
              </div>

              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>Enter One Time Password</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Please enter the 6-digit OTP sent to your mobile registered with your bank ending in <strong>8210</strong>.
              </p>

              <div className="form-group" style={{ maxWidth: '240px', margin: '0 auto 1rem auto' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.3em', fontWeight: 800 }}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.substring(0, 6))}
                  maxLength={6}
                />
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Resend OTP in <strong>00:{otpTimer.toString().padStart(2, '0')}</strong>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="btn btn-outline btn-block"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executePayment('CARD', { brand: cardBrand, last4: cardNumber.replace(/\s/g, '').slice(-4) })}
                  className="btn btn-primary btn-block"
                  disabled={otpCode.length < 6 || isProcessing}
                >
                  {isProcessing ? 'Verifying...' : 'Approve Payment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
