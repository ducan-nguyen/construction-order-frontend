import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import PaymentModal from './PaymentModal';
import { getStatusText, getStatusColor, formatPrice, formatDate } from '../../utils/orderUtils';
import { getUnitShort } from '../../utils/categoryUtils';

/* ─────────────────────────────────────────
   Order flow: PENDING → PAID → PROCESSING → SHIPPING → COMPLETED
   Terminal branches: CANCELLED, REFUND_REQUESTED → REFUNDED
───────────────────────────────────────── */
const FLOW = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPING', 'COMPLETED'];

const STEP_META = {
  PENDING:    { label: 'Chờ TT',    icon: '🕐', desc: 'Chờ thanh toán' },
  PAID:       { label: 'Đã TT',     icon: '💳', desc: 'Đã thanh toán' },
  PROCESSING: { label: 'Xử lý',    icon: '⚙️',  desc: 'Đang xử lý' },
  SHIPPING:   { label: 'Giao hàng', icon: '🚚', desc: 'Đang giao' },
  COMPLETED:  { label: 'Xong',      icon: '✅', desc: 'Hoàn thành' },
};

/* ── Skeleton ── */
const Sk = ({ w = '100%', h = '1rem', r = '6px', mb = '0' }) => (
  <div style={{
    width: w, height: h, borderRadius: r, marginBottom: mb,
    background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
  }} />
);

/* ── Confirm Dialog ── */
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, danger = true }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', width: '100%', maxWidth: '380px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'confirmIn 0.18s ease',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
          <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem', fontWeight: '700', color: danger ? '#dc2626' : '#111827' }}>
            {danger ? '⚠️ ' : 'ℹ️ '}{title}
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem 1.5rem' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '0.65rem', background: '#f9fafb', color: '#374151',
              border: '1.5px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.875rem',
            }}
          >
            Huỷ bỏ
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '0.65rem',
              background: danger ? '#dc2626' : '#2563eb',
              color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer',
              fontWeight: '700', fontSize: '0.875rem',
            }}
          >
            {danger ? 'Xác nhận huỷ' : 'Xác nhận'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes confirmIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </div>
  );
};

/* ── Status Stepper ── */
const StatusStepper = ({ status }) => {
  const cancelled         = status === 'CANCELLED';
  const refundRequested   = status === 'REFUND_REQUESTED';
  const refunded          = status === 'REFUNDED';
  const isTerminalBranch  = cancelled || refundRequested || refunded;
  const currentIdx        = isTerminalBranch ? -1 : FLOW.indexOf(status);

  if (cancelled) {
    return (
      <div style={{
        background: '#fff1f2', border: '1.5px solid #fda4af', borderRadius: '12px',
        padding: '1rem 1.5rem', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <span style={{ fontSize: '1.5rem' }}>❌</span>
        <div>
          <div style={{ fontWeight: '700', color: '#dc2626', fontSize: '0.95rem' }}>Đơn hàng đã bị huỷ</div>
          <div style={{ fontSize: '0.78rem', color: '#f87171' }}>Đơn hàng này đã được huỷ và không thể khôi phục.</div>
        </div>
      </div>
    );
  }

  if (refundRequested) {
    return (
      <div style={{
        background: '#fff7ed', border: '1.5px solid #fdba74', borderRadius: '12px',
        padding: '1rem 1.5rem', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <span style={{ fontSize: '1.5rem' }}>🔄</span>
        <div>
          <div style={{ fontWeight: '700', color: '#ea580c', fontSize: '0.95rem' }}>Đang chờ xét duyệt hoàn tiền</div>
          <div style={{ fontSize: '0.78rem', color: '#fb923c' }}>Yêu cầu hoàn tiền đã được gửi. Quản trị viên sẽ xem xét trong vòng 1–3 ngày làm việc.</div>
        </div>
      </div>
    );
  }

  if (refunded) {
    return (
      <div style={{
        background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px',
        padding: '1rem 1.5rem', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <span style={{ fontSize: '1.5rem' }}>💚</span>
        <div>
          <div style={{ fontWeight: '700', color: '#16a34a', fontSize: '0.95rem' }}>Đã hoàn tiền thành công</div>
          <div style={{ fontSize: '0.78rem', color: '#4ade80' }}>Tiền đã được hoàn lại theo phương thức thanh toán ban đầu. Vui lòng kiểm tra tài khoản.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white', borderRadius: '12px', padding: '1.25rem 1.5rem',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6',
      marginBottom: '1.5rem',
    }}>
      <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>
        Tiến trình đơn hàng
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
        {FLOW.map((step, idx) => {
          const done    = idx < currentIdx;
          const current = idx === currentIdx;
          const future  = idx > currentIdx;
          const meta    = STEP_META[step];

          return (
            <React.Fragment key={step}>
              {/* Step node */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: current ? '1.25rem' : '1rem',
                  background: done
                    ? 'linear-gradient(135deg,#059669,#10b981)'
                    : current
                      ? 'linear-gradient(135deg,#1e3a5f,#2563eb)'
                      : '#f3f4f6',
                  border: current ? '3px solid #93c5fd' : done ? 'none' : '2px solid #e5e7eb',
                  boxShadow: current ? '0 0 0 4px rgba(37,99,235,0.15)' : done ? '0 2px 6px rgba(5,150,105,0.3)' : 'none',
                  transition: 'all 0.3s ease',
                  color: future ? '#d1d5db' : 'white',
                }}>
                  {done ? '✓' : meta.icon}
                </div>
                <div style={{ marginTop: '0.4rem', textAlign: 'center' }}>
                  <div style={{
                    fontSize: '0.7rem', fontWeight: current ? '800' : done ? '700' : '500',
                    color: current ? '#1d4ed8' : done ? '#059669' : '#9ca3af',
                    whiteSpace: 'nowrap',
                  }}>
                    {meta.label}
                  </div>
                  {current && (
                    <div style={{
                      fontSize: '0.62rem', color: '#60a5fa', fontWeight: '600', marginTop: '0.1rem',
                      animation: 'pulse 2s infinite',
                    }}>
                      ● hiện tại
                    </div>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {idx < FLOW.length - 1 && (
                <div style={{
                  flex: 2, height: '3px', marginTop: '18px',
                  background: idx < currentIdx
                    ? 'linear-gradient(90deg,#10b981,#059669)'
                    : '#e5e7eb',
                  borderRadius: '2px', transition: 'background 0.4s ease',
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════
   Main Component
═══════════════════════════════════════════ */
const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order,            setOrder]            = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [updating,         setUpdating]         = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [confirmDialog,    setConfirmDialog]    = useState({ open: false, action: null });
  const [refundDialog,     setRefundDialog]     = useState(false);
  const [refundReason,     setRefundReason]     = useState('');

  useEffect(() => {
    if (!id || id === 'undefined' || isNaN(parseInt(id))) {
      toast.error('Mã đơn hàng không hợp lệ');
      navigate('/orders');
      return;
    }
    fetchOrderDetail();
  }, [id, navigate]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getById(parseInt(id));
      setOrder(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Đơn hàng không tồn tại'); navigate('/orders');
      } else if (err.response?.status === 403) {
        toast.error('Bạn không có quyền xem đơn hàng này'); navigate('/orders');
      } else {
        toast.error(err.response?.data?.message || 'Không thể tải thông tin đơn hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = () => {
    setConfirmDialog({
      open: true,
      title: 'Huỷ đơn hàng',
      message: `Bạn có chắc muốn huỷ đơn hàng #${order?.orderCode}? Hành động này không thể hoàn tác.`,
      action: async () => {
        setConfirmDialog({ open: false });
        setUpdating(true);
        try {
          await orderAPI.cancelOrder(order.id);
          toast.success('Đã huỷ đơn hàng');
          await fetchOrderDetail();
        } catch { toast.error('Huỷ đơn hàng thất bại'); }
        finally { setUpdating(false); }
      },
    });
  };

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await orderAPI.updateStatus(order.id, newStatus);
      toast.success('Đã cập nhật trạng thái');
      await fetchOrderDetail();
    } catch { toast.error('Cập nhật trạng thái thất bại'); }
    finally { setUpdating(false); }
  };

  const handleSubmitRefund = async () => {
    if (!refundReason.trim()) { toast.error('Vui lòng nhập lý do hoàn tiền'); return; }
    setUpdating(true);
    try {
      await orderAPI.requestRefund(order.id, refundReason.trim());
      toast.success('Đã gửi yêu cầu hoàn tiền. Chúng tôi sẽ xem xét trong 1–3 ngày làm việc.');
      setRefundDialog(false);
      setRefundReason('');
      await fetchOrderDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi yêu cầu thất bại');
    } finally { setUpdating(false); }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div>
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Sk w="80px" h="36px" r="8px" />
          <div style={{ flex: 1 }}>
            <Sk w="200px" h="1.5rem" r="6px" mb="0.4rem" />
            <Sk w="140px" h="0.875rem" r="6px" />
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <Sk w="160px" h="0.75rem" r="4px" mb="1rem" />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[1,2,3,4,5].map(i => <Sk key={i} h="40px" r="50%" />)}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem' }}>
            <Sk w="120px" h="1.1rem" r="6px" mb="1rem" />
            {[1,2,3].map(i => <Sk key={i} h="48px" r="6px" mb="0.75rem" />)}
          </div>
          <div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
              <Sk w="100px" h="1.1rem" r="6px" mb="1rem" />
              {[1,2,3].map(i => <Sk key={i} h="1rem" r="6px" mb="0.5rem" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '16px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
        <p style={{ fontSize: '1.1rem', color: '#374151', marginBottom: '1.25rem' }}>Không tìm thấy đơn hàng</p>
        <button
          onClick={() => navigate('/orders')}
          style={{ padding: '0.65rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const statusColor = getStatusColor(order.status);

  return (
    <div>
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/orders')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.5rem 1rem', background: 'white', color: '#374151',
            border: '1.5px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer',
            fontWeight: '600', fontSize: '0.875rem', flexShrink: 0,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          ← Quay lại
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#111827' }}>
              Đơn hàng #{order.orderCode}
            </h1>
            <span style={{
              padding: '0.3rem 0.85rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '700',
              background: `${statusColor}18`, color: statusColor, border: `1.5px solid ${statusColor}40`,
            }}>
              {getStatusText(order.status)}
            </span>
          </div>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
            📅 Ngày đặt: {formatDate(order.orderDate)}
          </p>
        </div>
      </div>

      {/* ── Status Stepper ── */}
      <StatusStepper status={order.status} />

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>

        {/* ── Left: Products table ── */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: '700', color: '#111827' }}>
            🛍️ Sản phẩm ({order.orderItems?.length || 0} loại)
          </h2>

          {!order.orderItems?.length ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Không có sản phẩm</div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px', borderBottom: '1.5px solid #e5e7eb' }}>Sản phẩm</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontSize: '0.78rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px', borderBottom: '1.5px solid #e5e7eb' }}>SL</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontSize: '0.78rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px', borderBottom: '1.5px solid #e5e7eb' }}>Đơn giá</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontSize: '0.78rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px', borderBottom: '1.5px solid #e5e7eb' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderItems.map((item, i) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 1 ? '#fafafa' : 'white' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>{item.productName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.1rem' }}>{getUnitShort(item.unit)}</div>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '700', color: '#374151' }}>{item.quantity}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#6b7280', fontSize: '0.875rem' }}>{formatPrice(item.priceAtTime)}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700', color: '#2563eb' }}>{formatPrice(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.82rem', color: '#6b7280' }}>Tạm tính:</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>{formatPrice(order.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.82rem', color: '#6b7280' }}>Thuế VAT (10%):</td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#6b7280', fontSize: '0.875rem' }}>{formatPrice(order.taxAmount)}</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #e5e7eb', background: '#f8fafc' }}>
                    <td colSpan="3" style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: '800', color: '#111827' }}>Tổng cộng:</td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: '800', color: '#2563eb', fontSize: '1.1rem' }}>{formatPrice(order.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}
        </div>

        {/* ── Right: Info + Actions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Delivery info */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
            <h2 style={{ margin: '0 0 0.85rem', fontSize: '1rem', fontWeight: '700', color: '#111827' }}>📦 Giao hàng</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: '#9ca3af', minWidth: '70px' }}>Địa chỉ:</span>
                <span style={{ color: '#374151', fontWeight: '500' }}>{order.deliveryAddress || 'Chưa cập nhật'}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: '#9ca3af', minWidth: '70px' }}>Hóa đơn:</span>
                <span style={{ fontWeight: '600', color: order.requireInvoice ? '#059669' : '#6b7280' }}>
                  {order.requireInvoice ? '✅ Có xuất VAT' : 'Không xuất VAT'}
                </span>
              </div>
              {order.notes && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: '#9ca3af', minWidth: '70px' }}>Ghi chú:</span>
                  <span style={{ color: '#374151', fontStyle: 'italic' }}>{order.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions — user: PENDING */}
          {order.status === 'PENDING' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
              <h2 style={{ margin: '0 0 0.85rem', fontSize: '1rem', fontWeight: '700', color: '#111827' }}>⚡ Hành động</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  style={{
                    padding: '0.75rem', background: 'linear-gradient(135deg,#059669,#10b981)',
                    color: 'white', border: 'none', borderRadius: '10px',
                    fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(5,150,105,0.3)',
                  }}
                >
                  💳 Thanh toán đa phương thức
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={updating}
                  style={{
                    padding: '0.75rem', background: 'white', color: '#dc2626',
                    border: '1.5px solid #fca5a5', borderRadius: '10px',
                    fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
                    opacity: updating ? 0.6 : 1, transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fff1f2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                >
                  ✕ Huỷ đơn hàng
                </button>
              </div>
            </div>
          )}

          {/* Actions — user: PAID (đã thanh toán, chưa xử lý → có thể yêu cầu hoàn tiền) */}
          {order.status === 'PAID' && user?.role !== 'ADMIN' && (
            <div style={{
              background: 'white', borderRadius: '12px', padding: '1.25rem',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6',
            }}>
              <h2 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: '700', color: '#111827' }}>⚡ Hành động</h2>
              <p style={{ margin: '0 0 0.85rem', fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.5 }}>
                Đơn hàng đã được thanh toán. Nếu muốn huỷ, bạn có thể yêu cầu hoàn tiền — quản trị viên sẽ xem xét và xử lý trong 1–3 ngày làm việc.
              </p>
              <button
                onClick={() => setRefundDialog(true)}
                disabled={updating}
                style={{
                  width: '100%', padding: '0.75rem',
                  background: 'white', color: '#ea580c',
                  border: '1.5px solid #fdba74', borderRadius: '10px',
                  fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fff7ed'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
              >
                🔄 Yêu cầu hoàn tiền
              </button>
            </div>
          )}

          {/* Actions — admin */}
          {user?.role === 'ADMIN' && !['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(order.status) && (
            <div style={{
              background: order.status === 'REFUND_REQUESTED' ? '#fff7ed' : '#fffbeb',
              borderRadius: '12px', padding: '1.25rem',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
              border: `1.5px solid ${order.status === 'REFUND_REQUESTED' ? '#fdba74' : '#fcd34d'}`,
            }}>
              <h2 style={{ margin: '0 0 0.85rem', fontSize: '0.85rem', fontWeight: '700', color: order.status === 'REFUND_REQUESTED' ? '#c2410c' : '#92400e', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {order.status === 'REFUND_REQUESTED' ? '💰 Xét duyệt hoàn tiền' : '🔧 Quản trị viên'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {order.status === 'PENDING' && (
                  <button onClick={() => handleUpdateStatus('PROCESSING')} disabled={updating}
                    style={{ padding: '0.6rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
                    ⚙️ Xác nhận & Xử lý đơn
                  </button>
                )}
                {order.status === 'PAID' && (
                  <button onClick={() => handleUpdateStatus('PROCESSING')} disabled={updating}
                    style={{ padding: '0.6rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
                    ⚙️ Chuyển sang Xử lý
                  </button>
                )}
                {order.status === 'PROCESSING' && (
                  <button onClick={() => handleUpdateStatus('SHIPPING')} disabled={updating}
                    style={{ padding: '0.6rem 1rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
                    🚚 Bắt đầu giao hàng
                  </button>
                )}
                {order.status === 'SHIPPING' && (
                  <button onClick={() => handleUpdateStatus('COMPLETED')} disabled={updating}
                    style={{ padding: '0.6rem 1rem', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
                    ✅ Xác nhận hoàn thành
                  </button>
                )}
                {order.status === 'REFUND_REQUESTED' && (
                  <>
                    <div style={{ fontSize: '0.78rem', color: '#9a3412', marginBottom: '0.25rem', lineHeight: 1.5 }}>
                      Khách hàng đã yêu cầu hoàn tiền cho đơn này. Xem xét và xử lý:
                    </div>
                    <button
                      onClick={() => setConfirmDialog({
                        open: true,
                        title: 'Duyệt hoàn tiền',
                        message: `Xác nhận hoàn tiền ${formatPrice(order.totalAmount)} cho đơn #${order.orderCode}? Thao tác này không thể hoàn tác.`,
                        danger: false,
                        action: async () => {
                          setConfirmDialog({ open: false });
                          setUpdating(true);
                          try {
                            await orderAPI.approveRefund(order.id);
                            toast.success('Đã duyệt hoàn tiền thành công');
                            await fetchOrderDetail();
                          } catch { toast.error('Duyệt hoàn tiền thất bại'); }
                          finally { setUpdating(false); }
                        },
                      })}
                      disabled={updating}
                      style={{ padding: '0.6rem 1rem', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}
                    >
                      ✅ Duyệt & Hoàn tiền
                    </button>
                    <button
                      onClick={() => setConfirmDialog({
                        open: true,
                        title: 'Từ chối hoàn tiền',
                        message: `Từ chối yêu cầu hoàn tiền của đơn #${order.orderCode}? Đơn hàng sẽ quay lại trạng thái "Đã thanh toán".`,
                        danger: true,
                        action: async () => {
                          setConfirmDialog({ open: false });
                          setUpdating(true);
                          try {
                            await orderAPI.rejectRefund(order.id);
                            toast.success('Đã từ chối yêu cầu hoàn tiền');
                            await fetchOrderDetail();
                          } catch { toast.error('Thao tác thất bại'); }
                          finally { setUpdating(false); }
                        },
                      })}
                      disabled={updating}
                      style={{ padding: '0.6rem 1rem', background: 'white', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}
                    >
                      ✕ Từ chối yêu cầu
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Payment Modal ── */}
      {showPaymentModal && (
        <PaymentModal
          order={order}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => { fetchOrderDetail(); setShowPaymentModal(false); }}
        />
      )}

      {/* ── Custom Confirm Dialog ── */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        danger={confirmDialog.danger !== false}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog({ open: false })}
      />

      {/* ── Refund Request Dialog ── */}
      {refundDialog && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', width: '100%', maxWidth: '440px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
            animation: 'confirmIn 0.18s ease',
          }}>
            {/* Header */}
            <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
              <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.05rem', fontWeight: '700', color: '#ea580c' }}>
                🔄 Yêu cầu hoàn tiền
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.5 }}>
                Đơn <strong>{order.orderCode}</strong> · Tổng tiền: <strong style={{ color: '#2563eb' }}>{formatPrice(order.totalAmount)}</strong>
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <p style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.5 }}>
                Vui lòng cho chúng tôi biết lý do bạn muốn huỷ đơn và hoàn tiền. Yêu cầu sẽ được xem xét trong vòng <strong>1–3 ngày làm việc</strong>.
              </p>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                Lý do hoàn tiền *
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Ví dụ: Tôi đặt nhầm sản phẩm, muốn đổi sang loại khác..."
                rows={4}
                style={{
                  width: '100%', padding: '0.65rem 0.85rem',
                  border: '1.5px solid #d1d5db', borderRadius: '8px',
                  fontSize: '0.875rem', resize: 'vertical', outline: 'none',
                  boxSizing: 'border-box', color: '#111827',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#f97316')}
                onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
                autoFocus
              />
              {/* Gợi ý lý do phổ biến */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
                {['Đặt nhầm sản phẩm', 'Thay đổi nhu cầu', 'Giá tốt hơn ở nơi khác', 'Giao hàng quá lâu'].map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => setRefundReason(hint)}
                    style={{
                      padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: '500',
                      border: '1px solid #e5e7eb', borderRadius: '9999px',
                      background: refundReason === hint ? '#fff7ed' : 'white',
                      color: refundReason === hint ? '#ea580c' : '#6b7280',
                      cursor: 'pointer',
                    }}
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid #f3f4f6' }}>
              <button
                onClick={() => { setRefundDialog(false); setRefundReason(''); }}
                style={{
                  flex: 1, padding: '0.65rem', background: '#f9fafb', color: '#374151',
                  border: '1.5px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer',
                  fontWeight: '600', fontSize: '0.875rem',
                }}
              >
                Huỷ bỏ
              </button>
              <button
                onClick={handleSubmitRefund}
                disabled={updating || !refundReason.trim()}
                style={{
                  flex: 1, padding: '0.65rem',
                  background: updating || !refundReason.trim() ? '#fed7aa' : '#ea580c',
                  color: 'white', border: 'none', borderRadius: '10px',
                  cursor: updating || !refundReason.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '700', fontSize: '0.875rem',
                }}
              >
                {updating ? '⏳ Đang gửi...' : '🔄 Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
