import React, { useState, useEffect } from 'react';
import { orderAPI, userAPI } from '../../services/api';
import { formatPrice } from '../../utils/orderUtils';
import { getUnitShort } from '../../utils/categoryUtils';
import { loadCart, saveCart, clearCart } from '../../utils/cartUtils';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const inputStyle = {
  width: '100%', padding: '0.6rem 0.85rem',
  border: '1.5px solid #d1d5db', borderRadius: '8px',
  fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
  color: '#111827', background: 'white',
};

/* ── Delivery modal ── */
const DeliveryModal = ({ selectedItems, subtotal, tax, total, savedAddress, onClose, onSubmit, loading }) => {
  const [info, setInfo] = useState({ deliveryAddress: '', requireInvoice: false, notes: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!info.deliveryAddress.trim()) { toast.error('Vui lòng nhập địa chỉ giao hàng'); return; }
    onSubmit(info);
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div
        style={{
          background: 'white', borderRadius: '16px', width: '100%', maxWidth: '520px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.22s ease',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }`}</style>

        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.4rem', borderBottom: '1px solid #f3f4f6' }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#111827' }}>📍 Thông tin giao hàng</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#9ca3af', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Order recap */}
          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.9rem 1rem', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: '0 0 0.6rem', fontSize: '0.78rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Đơn hàng</p>
            {selectedItems.map((item) => (
              <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#374151', padding: '0.2rem 0' }}>
                <span>{item.productName} × {item.quantity} {getUnitShort(item.unit)}</span>
                <span style={{ fontWeight: '600' }}>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '0.6rem', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {[['Tạm tính', subtotal], ['Thuế VAT (10%)', tax]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#6b7280' }}>
                  <span>{l}</span><span>{formatPrice(v)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800', color: '#2563eb', marginTop: '0.2rem' }}>
                <span>Tổng cộng</span><span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Địa chỉ giao hàng *
              </label>
              {savedAddress && (
                <button
                  type="button"
                  onClick={() => setInfo({ ...info, deliveryAddress: savedAddress })}
                  style={{ padding: '0.2rem 0.55rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '5px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '600' }}
                >
                  📌 Dùng địa chỉ đã lưu
                </button>
              )}
            </div>
            {savedAddress && (
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.4rem', padding: '0.35rem 0.6rem', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <span style={{ color: '#9ca3af' }}>Đã lưu: </span>{savedAddress}
              </div>
            )}
            <textarea
              value={info.deliveryAddress}
              onChange={(e) => setInfo({ ...info, deliveryAddress: e.target.value })}
              required rows={3}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
              onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.875rem', color: '#374151' }}>
            <input type="checkbox" checked={info.requireInvoice} onChange={(e) => setInfo({ ...info, requireInvoice: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: '#2563eb' }} />
            Yêu cầu xuất hoá đơn VAT
          </label>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
              Ghi chú (tuỳ chọn)
            </label>
            <textarea
              value={info.notes}
              onChange={(e) => setInfo({ ...info, notes: e.target.value })}
              rows={2} placeholder="Ghi chú về đơn hàng..."
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
              onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', background: 'white', color: '#6b7280', border: '1.5px solid #d1d5db', borderRadius: '9px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>
              Huỷ
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 2, padding: '0.75rem', background: loading ? '#6ee7b7' : '#059669', color: 'white', border: 'none', borderRadius: '9px', fontSize: '0.95rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(5,150,105,0.3)' }}
            >
              {loading ? '⏳ Đang xử lý...' : `✅ Xác nhận đặt hàng`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main component ── */
const CreateOrder = () => {
  const { user } = useAuth();
  const [cart,        setCart]        = useState([]);
  const [selected,    setSelected]    = useState(new Set());
  const [loading,     setLoading]     = useState(false);
  const [savedAddress, setSavedAddress] = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const preselect = location.state?.preselect;
    const stored = loadCart(user?.email);
    if (preselect) {
      const { product, quantity } = preselect;
      const min = product.minOrderQuantity || 1;
      const newItem = { productId: product.id, productName: product.name, quantity: Math.max(quantity, min), price: product.discountPrice ?? product.price, unit: product.unit, minOrderQuantity: min, stockQuantity: product.stockQuantity };
      const idx = stored.findIndex((i) => i.productId === product.id);
      if (idx >= 0) { stored[idx] = newItem; } else { stored.unshift(newItem); }
      setSelected(new Set([product.id]));
      toast.success(`Đã thêm ${product.name} — tích thêm sản phẩm khác nếu muốn`);
      window.history.replaceState({}, '');
    } else {
      setSelected(new Set(stored.map((i) => i.productId)));
    }
    setCart(stored);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isFirstRender = React.useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    saveCart(user?.email, cart);
  }, [cart]);

  useEffect(() => {
    userAPI.getProfile().then((res) => { if (res.data?.address) setSavedAddress(res.data.address); }).catch(() => {});
  }, []);

  const toggleSelect    = (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = ()   => setSelected(selected.size === cart.length ? new Set() : new Set(cart.map((i) => i.productId)));

  const updateQuantity = (productId, qty) => {
    const item = cart.find((i) => i.productId === productId);
    if (!item) return;
    if (qty < item.minOrderQuantity) { toast.error(`Tối thiểu ${item.minOrderQuantity} ${getUnitShort(item.unit)}`); return; }
    if (qty > item.stockQuantity)    { toast.error(`Tối đa ${item.stockQuantity} ${getUnitShort(item.unit)}`); return; }
    setCart(cart.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((i) => i.productId !== productId));
    setSelected((p) => { const n = new Set(p); n.delete(productId); return n; });
  };

  const selectedItems = cart.filter((i) => selected.has(i.productId));
  const subtotal = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax      = subtotal * 0.1;
  const total    = subtotal + tax;

  const handleSubmit = async (deliveryInfo) => {
    setLoading(true);
    try {
      const payload = {
        deliveryAddress: deliveryInfo.deliveryAddress,
        requireInvoice:  deliveryInfo.requireInvoice ?? false,
        notes:           deliveryInfo.notes ?? '',
        items: selectedItems.map((i) => ({ productId: Number(i.productId), quantity: Number(i.quantity) })),
      };
      const res = await orderAPI.create(payload);
      const remaining = cart.filter((i) => !selected.has(i.productId));
      if (remaining.length === 0) { clearCart(user?.email); } else { saveCart(user?.email, remaining); setCart(remaining); setSelected(new Set(remaining.map((i) => i.productId))); }
      setShowModal(false);
      toast.success('Tạo đơn hàng thành công!');
      setTimeout(() => navigate(`/orders/${res.data.id}`), 400);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Tạo đơn hàng thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.25rem', color: '#111827' }}>Tạo đơn hàng</h1>
        <div style={{ marginTop: '2rem', textAlign: 'center', padding: '3rem 2rem', background: 'white', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
          <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '1.5rem' }}>Giỏ hàng của bạn đang trống</p>
          <Link to="/products" style={{ display: 'inline-block', padding: '0.65rem 1.5rem', background: '#2563eb', color: 'white', borderRadius: '9px', textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem' }}>
            ← Chọn sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {showModal && (
        <DeliveryModal
          selectedItems={selectedItems}
          subtotal={subtotal} tax={tax} total={total}
          savedAddress={savedAddress}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}

      <div style={{ maxWidth: '820px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0, color: '#111827' }}>Tạo đơn hàng</h1>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>Tích chọn sản phẩm muốn đặt trong đơn này</p>
          </div>
          <Link to="/products" style={{ padding: '0.45rem 1rem', background: 'white', color: '#2563eb', border: '1.5px solid #bfdbfe', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}>
            + Thêm sản phẩm
          </Link>
        </div>

        {/* Cart card */}
        <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', padding: '1.25rem' }}>
          {/* Cart header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <input type="checkbox" checked={selected.size === cart.length} onChange={toggleSelectAll} style={{ width: '17px', height: '17px', accentColor: '#2563eb', cursor: 'pointer' }} />
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#111827' }}>
                🛒 Giỏ hàng
                <span style={{ marginLeft: '0.5rem', background: '#2563eb', color: 'white', borderRadius: '9999px', padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}>{cart.length}</span>
              </h2>
              {selected.size > 0 && selected.size < cart.length && (
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>({selected.size} đã chọn)</span>
              )}
            </div>
            <button
              onClick={() => { setCart([]); clearCart(user?.email); setSelected(new Set()); toast('Đã xoá giỏ hàng', { icon: '🗑️' }); }}
              style={{ padding: '0.3rem 0.75rem', background: 'white', color: '#ef4444', border: '1.5px solid #fca5a5', borderRadius: '7px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' }}
            >
              Huỷ tất cả
            </button>
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {cart.map((item) => {
              const isChecked = selected.has(item.productId);
              return (
                <div key={item.productId} style={{
                  display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto',
                  alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem',
                  background: isChecked ? '#f0f7ff' : '#fafafa',
                  borderRadius: '10px', border: `1.5px solid ${isChecked ? '#bfdbfe' : '#e5e7eb'}`,
                  transition: 'all 0.15s', opacity: isChecked ? 1 : 0.55,
                }}>
                  <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(item.productId)} style={{ width: '17px', height: '17px', accentColor: '#2563eb', cursor: 'pointer' }} />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#111827' }}>{item.productName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.1rem' }}>{formatPrice(item.price)} / {getUnitShort(item.unit)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <button onClick={() => updateQuantity(item.productId, item.quantity - item.minOrderQuantity)} style={{ width: '26px', height: '26px', border: '1.5px solid #d1d5db', borderRadius: '6px', background: 'white', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <input type="number" value={item.quantity} min={item.minOrderQuantity} max={item.stockQuantity} onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || item.minOrderQuantity)} style={{ width: '60px', padding: '0.2rem 0.35rem', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', outline: 'none', textAlign: 'center' }} />
                    <button onClick={() => updateQuantity(item.productId, item.quantity + item.minOrderQuantity)} style={{ width: '26px', height: '26px', border: '1.5px solid #d1d5db', borderRadius: '6px', background: 'white', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{getUnitShort(item.unit)}</span>
                  </div>
                  <div style={{ fontWeight: '700', color: isChecked ? '#2563eb' : '#9ca3af', fontSize: '0.875rem', minWidth: '90px', textAlign: 'right' }}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                  <button onClick={() => removeFromCart(item.productId)} style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1, padding: '0.1rem', transition: 'color 0.15s' }} onMouseEnter={(e) => (e.target.style.color = '#ef4444')} onMouseLeave={(e) => (e.target.style.color = '#d1d5db')}>×</button>
                </div>
              );
            })}
          </div>

          {/* Summary + order button */}
          <div style={{ marginTop: '1.25rem', borderTop: '2px solid #f3f4f6', paddingTop: '1rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '220px' }}>
              {selected.size === 0 && <p style={{ margin: '0 0 0.3rem', fontSize: '0.82rem', color: '#f59e0b' }}>⚠️ Chưa chọn sản phẩm nào</p>}
              {[['Tạm tính', subtotal], ['Thuế VAT (10%)', tax]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', fontSize: '0.875rem', color: '#4b5563' }}>
                  <span>{l}</span><span>{formatPrice(v)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', fontSize: '1.05rem', fontWeight: '800', color: '#2563eb', paddingTop: '0.35rem', borderTop: '1px solid #e5e7eb', marginTop: '0.15rem' }}>
                <span>Tổng cộng {selectedItems.length > 0 && <span style={{ fontSize: '0.75rem', fontWeight: '400', color: '#9ca3af' }}>({selectedItems.length} sp)</span>}</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <button
              disabled={selectedItems.length === 0}
              onClick={() => setShowModal(true)}
              style={{
                padding: '0.8rem 2rem', background: selectedItems.length === 0 ? '#d1fae5' : '#059669',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '1rem', fontWeight: '700', cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: selectedItems.length === 0 ? 'none' : '0 3px 10px rgba(5,150,105,0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              Đặt hàng ({selectedItems.length} sản phẩm) →
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateOrder;
