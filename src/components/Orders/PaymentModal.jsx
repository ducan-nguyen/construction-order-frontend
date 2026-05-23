import React, { useState } from 'react';
import { paymentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const METHODS = [
  { id: 'CREDIT_CARD',   label: 'Thẻ tín dụng',              icon: '💳', desc: 'Visa/Mastercard — xác nhận ngay',       instant: true  },
  { id: 'MOMO',          label: 'Ví Momo',                   icon: '📱', desc: 'Thanh toán qua ví Momo — xác nhận ngay', instant: true  },
  { id: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng',    icon: '🏦', desc: 'Chuyển khoản qua QR Code',               instant: false },
  { id: 'COD',           label: 'Thanh toán khi nhận hàng',  icon: '💵', desc: 'Trả tiền mặt khi nhận hàng (COD)',       instant: false },
  { id: 'INSTALLMENT',   label: 'Trả góp',                   icon: '📅', desc: 'Trả góp 0% qua thẻ tín dụng',           instant: false },
];

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const PaymentModal = ({ order, onClose, onSuccess }) => {
  const [selected, setSelected]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);

  const handlePayment = async () => {
    if (!selected) { toast.error('Vui lòng chọn phương thức thanh toán'); return; }
    setLoading(true);
    try {
      const res = await paymentAPI.process({
        orderId: order.id,
        method:  selected,
        notes:   `Thanh toán đơn hàng ${order.orderCode}`,
      });
      setPaymentInfo(res.data);
      if (res.data.status === 'SUCCESS') {
        toast.success('Thanh toán thành công!');
        setTimeout(() => { onSuccess(); onClose(); }, 1500);
      } else {
        toast('Vui lòng hoàn tất thanh toán theo hướng dẫn bên dưới', { icon: 'ℹ️', duration: 4000 });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Thanh toán thất bại';
      if (msg.includes('already')) {
        toast.error('Đơn hàng đã được thanh toán trước đó!');
        setTimeout(() => { onSuccess(); onClose(); }, 2000);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: 'white', borderRadius: '14px', padding: '1.75rem',
        width: '90%', maxWidth: '480px', maxHeight: '88vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700' }}>Thanh toán đơn hàng</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>
        </div>

        {/* Order info */}
        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.3rem' }}>Đơn hàng</div>
          <div style={{ fontWeight: '700', fontSize: '1rem', color: '#111827' }}>{order.orderCode}</div>
          <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: '#6b7280' }}>Tổng tiền</div>
          <div style={{ fontWeight: '800', fontSize: '1.3rem', color: '#2563eb' }}>{fmt(order.totalAmount)}</div>
        </div>

        {!paymentInfo ? (
          <>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.7rem' }}>
              Chọn phương thức thanh toán
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {METHODS.map((m) => (
                <label
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.85rem',
                    padding: '0.8rem 1rem',
                    border: selected === m.id ? '2px solid #2563eb' : '1.5px solid #e5e7eb',
                    borderRadius: '10px', cursor: 'pointer',
                    background: selected === m.id ? '#eff6ff' : 'white',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <input
                    type="radio" name="method" value={m.id}
                    checked={selected === m.id}
                    onChange={(e) => setSelected(e.target.value)}
                    style={{ accentColor: '#2563eb', width: '16px', height: '16px', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#111827' }}>{m.label}</div>
                    <div style={{ fontSize: '0.77rem', color: '#6b7280' }}>{m.desc}</div>
                  </div>
                  {m.instant && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: '700', color: '#059669',
                      background: '#d1fae5', padding: '0.2rem 0.5rem', borderRadius: '99px',
                      whiteSpace: 'nowrap',
                    }}>
                      Ngay lập tức
                    </span>
                  )}
                </label>
              ))}
            </div>

            <button
              onClick={handlePayment}
              disabled={loading || !selected}
              style={{
                width: '100%', marginTop: '1.25rem', padding: '0.8rem',
                background: loading || !selected ? '#93c5fd' : 'linear-gradient(135deg,#1e3a5f,#2563eb)',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '0.95rem', fontWeight: '700',
                cursor: loading || !selected ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '⏳ Đang xử lý...' : '✅ Xác nhận thanh toán'}
            </button>
          </>
        ) : (
          /* Kết quả sau khi xác nhận */
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.75rem' }}>
              Hướng dẫn thanh toán
            </div>

            {paymentInfo.method === 'BANK_TRANSFER' && (
              <div style={{ background: '#f3f4f6', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: '600' }}>Chuyển khoản đến:</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Ngân hàng:</strong> Vietcombank</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Số tài khoản:</strong> 1234567890</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Chủ tài khoản:</strong> CONSTRUCTION ORDER SYSTEM</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Nội dung CK:</strong> {paymentInfo.transactionCode}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Số tiền:</strong> {fmt(paymentInfo.amount)}</p>
                {paymentInfo.qrCodeUrl && (
                  <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                    <img src={paymentInfo.qrCodeUrl} alt="QR" style={{ width: '180px', borderRadius: '8px' }} />
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.4rem' }}>Quét QR để chuyển khoản nhanh</p>
                  </div>
                )}
              </div>
            )}

            {paymentInfo.method === 'MOMO' && (
              <div style={{ background: '#fdf2f8', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', textAlign: 'center' }}>
                {paymentInfo.momoQRUrl && <img src={paymentInfo.momoQRUrl} alt="Momo QR" style={{ width: '180px', borderRadius: '8px' }} />}
                <p style={{ margin: '0.5rem 0 0.25rem', fontWeight: '600', color: '#be185d' }}>Ví Momo</p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}>Mã giao dịch: <strong>{paymentInfo.transactionCode}</strong></p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}>Số tiền: <strong>{fmt(paymentInfo.amount)}</strong></p>
              </div>
            )}

            {paymentInfo.method === 'COD' && (
              <div style={{ background: '#fef3c7', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: '600' }}>✅ Đặt hàng COD thành công!</p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.88rem' }}>💵 Vui lòng chuẩn bị <strong>{fmt(paymentInfo.amount)}</strong> tiền mặt khi nhận hàng.</p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.88rem', color: '#92400e' }}>Đơn sẽ được giao trong 2–5 ngày làm việc.</p>
              </div>
            )}

            {paymentInfo.method === 'CREDIT_CARD' && (
              <div style={{ background: '#d1fae5', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: '600' }}>✅ Thanh toán thẻ tín dụng thành công!</p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.88rem' }}>Mã giao dịch: <strong>{paymentInfo.transactionCode}</strong></p>
              </div>
            )}

            {paymentInfo.method === 'INSTALLMENT' && (
              <div style={{ background: '#dbeafe', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: '600' }}>✅ Đã đăng ký trả góp thành công!</p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.88rem' }}>📅 Kiểm tra email để biết lịch thanh toán chi tiết.</p>
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '0.75rem',
                background: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer',
              }}
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
