import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../../services/api';
import { formatPrice } from '../../utils/orderUtils';
import { getCategoryLabel, getCategoryStyle, getUnitShort } from '../../utils/categoryUtils';
import { loadCart, saveCart } from '../../utils/cartUtils';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const isSale       = (p) => p.discountPrice && p.discountPrice < p.price;
const effectPrice  = (p) => p.discountPrice || p.price;
const salePct      = (p) => isSale(p) ? Math.round((1 - p.discountPrice / p.price) * 100) : 0;

/* ── Skeleton ── */
const Skeleton = ({ w = '100%', h = '1rem', r = '6px', mb = '0' }) => (
  <div style={{
    width: w, height: h, borderRadius: r,
    background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    marginBottom: mb,
  }} />
);

const ProductDetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty,     setQty]     = useState(1);
  const [adding,  setAdding]  = useState(false);

  useEffect(() => {
    setLoading(true);
    productAPI.getById(id)
      .then((res) => {
        setProduct(res.data);
        setQty(res.data.minOrderQuantity || 1);
      })
      .catch(() => { toast.error('Không tìm thấy sản phẩm'); navigate('/products'); })
      .finally(() => setLoading(false));
  }, [id]);

  const changeQty = (delta) => {
    if (!product) return;
    const min  = product.minOrderQuantity || 1;
    const next = qty + delta;
    if (next < min)                    return toast.error(`Tối thiểu ${min} ${getUnitShort(product.unit)}`);
    if (next > product.stockQuantity)  return toast.error(`Tối đa ${product.stockQuantity} ${getUnitShort(product.unit)}`);
    setQty(next);
  };

  const addToCart = () => {
    if (!product) return;
    setAdding(true);
    setTimeout(() => {
      const cart     = loadCart(user?.email);
      const existing = cart.findIndex((i) => i.productId === product.id);
      if (existing >= 0) {
        cart[existing].quantity = Math.min(cart[existing].quantity + qty, product.stockQuantity);
      } else {
        cart.push({
          productId: product.id, productName: product.name,
          quantity: qty, price: effectPrice(product),
          unit: product.unit,
          minOrderQuantity: product.minOrderQuantity || 1,
          stockQuantity: product.stockQuantity,
        });
      }
      saveCart(user?.email, cart);
      toast.success(`Đã thêm ${qty} ${getUnitShort(product.unit)} vào giỏ hàng 🛒`);
      setAdding(false);
    }, 350);
  };

  const buyNow = () => {
    if (!product) return;
    navigate('/orders/create', { state: { preselect: { product, quantity: qty } } });
  };

  /* ── Loading skeleton ── */
  if (loading) return (
    <div>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Skeleton w="80px" h="2rem" r="8px" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '2rem' }}>
          <Skeleton h="1.5rem" mb="0.75rem" w="60%" />
          <Skeleton h="2.5rem" mb="1rem" />
          <Skeleton h="0.9rem" mb="0.5rem" />
          <Skeleton h="0.9rem" mb="0.5rem" w="80%" />
          <Skeleton h="0.9rem" mb="0.5rem" w="70%" />
        </div>
        <div style={{ background: 'white', borderRadius: '16px', padding: '2rem' }}>
          <Skeleton h="3rem" mb="1rem" />
          <Skeleton h="1rem" mb="0.5rem" />
          <Skeleton h="1rem" mb="1.5rem" w="60%" />
          <Skeleton h="3rem" r="10px" />
        </div>
      </div>
    </div>
  );

  if (!product) return null;

  const sale      = isSale(product);
  const price     = effectPrice(product);
  const pct       = salePct(product);
  const catStyle  = getCategoryStyle(product.category);
  const lowStock  = product.stockQuantity > 0 && product.stockQuantity <= (product.minOrderQuantity || 1) * 3;
  const outStock  = product.stockQuantity === 0;

  return (
    <>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .pd-card { animation: fadeInUp 0.25s ease; }
        .qty-btn:hover { background:#e5e7eb !important; }
        .add-btn:hover:not(:disabled) { opacity:0.9; transform:translateY(-1px); box-shadow:0 6px 20px rgba(37,99,235,0.35) !important; }
        .buy-btn:hover:not(:disabled) { opacity:0.9; transform:translateY(-1px); box-shadow:0 6px 20px rgba(5,150,105,0.35) !important; }
      `}</style>

      {/* Back button */}
      <button
        onClick={() => navigate('/products')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          marginBottom: '1.25rem', padding: '0.45rem 1rem',
          background: 'white', color: '#4b5563',
          border: '1.5px solid #e5e7eb', borderRadius: '8px',
          cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600',
        }}
      >
        ← Quay lại sản phẩm
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 370px', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Left: Info card ── */}
        <div className="pd-card" style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

          {/* Header gradient */}
          <div style={{
            background: sale ? 'linear-gradient(135deg,#fff1f2,#fef2f2)' : 'linear-gradient(135deg,#eff6ff,#f0f9ff)',
            padding: '1.75rem 2rem',
            borderBottom: '1px solid #f3f4f6',
          }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span style={{
                padding: '0.2rem 0.75rem', borderRadius: '9999px',
                fontSize: '0.75rem', fontWeight: '700',
                background: catStyle.bg, color: catStyle.color,
              }}>
                🏷️ {getCategoryLabel(product.category)}
              </span>
              {sale && (
                <span style={{ padding: '0.2rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '800', background: '#e11d48', color: 'white' }}>
                  🔥 SALE -{pct}%
                </span>
              )}
              {outStock && (
                <span style={{ padding: '0.2rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', background: '#f3f4f6', color: '#9ca3af' }}>
                  Hết hàng
                </span>
              )}
              {lowStock && !outStock && (
                <span style={{ padding: '0.2rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', background: '#fef3c7', color: '#92400e' }}>
                  ⚡ Sắp hết
                </span>
              )}
            </div>

            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#111827', lineHeight: 1.3 }}>
              {product.name}
            </h1>
            {product.sku && (
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
                Mã SP: {product.sku}
              </p>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: '2rem' }}>

            {/* Description */}
            {product.description ? (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Mô tả sản phẩm
                </h3>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#4b5563', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
                  {product.description}
                </p>
              </div>
            ) : (
              <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px', color: '#9ca3af', fontSize: '0.875rem', fontStyle: 'italic' }}>
                Chưa có mô tả cho sản phẩm này.
              </div>
            )}

            {/* Specs grid */}
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Thông số
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'Danh mục',      value: getCategoryLabel(product.category) },
                { label: 'Đơn vị tính',   value: getUnitShort(product.unit) },
                { label: 'Tồn kho',       value: `${product.stockQuantity} ${getUnitShort(product.unit)}`, highlight: outStock ? 'red' : lowStock ? 'orange' : 'green' },
                { label: 'Đặt tối thiểu', value: `${product.minOrderQuantity || 1} ${getUnitShort(product.unit)}` },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: highlight === 'red' ? '#dc2626' : highlight === 'orange' ? '#d97706' : highlight === 'green' ? '#16a34a' : '#111827' }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Purchase panel ── */}
        <div className="pd-card" style={{
          background: 'white', borderRadius: '16px',
          boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
          padding: '1.75rem', position: 'sticky', top: '76px',
        }}>

          {/* Price */}
          <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: sale ? '#fff1f2' : '#eff6ff', borderRadius: '12px' }}>
            {sale ? (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem' }}>
                  Giá khuyến mãi
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: '#e11d48' }}>{formatPrice(product.discountPrice)}</span>
                  <span style={{ fontSize: '1rem', color: '#9ca3af', textDecoration: 'line-through' }}>{formatPrice(product.price)}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#e11d48', fontWeight: '600', marginTop: '0.25rem' }}>
                  Tiết kiệm {formatPrice(product.price - product.discountPrice)} / {getUnitShort(product.unit)}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem' }}>
                  Đơn giá
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: '#2563eb' }}>{formatPrice(product.price)}</span>
                  <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>/ {getUnitShort(product.unit)}</span>
                </div>
              </>
            )}
          </div>

          {/* Quantity */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.6rem' }}>
              Số lượng
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                <button className="qty-btn" onClick={() => changeQty(-(product.minOrderQuantity || 1))} style={{
                  width: '42px', height: '42px', background: '#f9fafb', border: 'none',
                  cursor: 'pointer', fontSize: '1.2rem', fontWeight: '700', color: '#374151', transition: 'background 0.15s',
                }}>−</button>
                <input
                  type="number"
                  value={qty}
                  min={product.minOrderQuantity || 1}
                  max={product.stockQuantity}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || (product.minOrderQuantity || 1);
                    if (v >= (product.minOrderQuantity || 1) && v <= product.stockQuantity) setQty(v);
                  }}
                  style={{
                    width: '72px', textAlign: 'center', border: 'none', outline: 'none',
                    fontSize: '1rem', fontWeight: '700', color: '#111827', background: 'white',
                  }}
                />
                <button className="qty-btn" onClick={() => changeQty(product.minOrderQuantity || 1)} style={{
                  width: '42px', height: '42px', background: '#f9fafb', border: 'none',
                  cursor: 'pointer', fontSize: '1.2rem', fontWeight: '700', color: '#374151', transition: 'background 0.15s',
                }}>+</button>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{getUnitShort(product.unit)}</span>
            </div>
            <div style={{ marginTop: '0.6rem', fontSize: '0.85rem', color: '#6b7280' }}>
              Thành tiền:{' '}
              <strong style={{ fontSize: '1rem', color: sale ? '#e11d48' : '#2563eb' }}>
                {formatPrice(price * qty)}
              </strong>
            </div>
          </div>

          {/* Stock status */}
          <div style={{ marginBottom: '1.25rem', padding: '0.6rem 0.85rem', borderRadius: '8px', background: outStock ? '#fff1f2' : lowStock ? '#fffbeb' : '#f0fdf4', border: `1px solid ${outStock ? '#fca5a5' : lowStock ? '#fde68a' : '#bbf7d0'}` }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: outStock ? '#dc2626' : lowStock ? '#d97706' : '#16a34a' }}>
              {outStock ? '❌ Hết hàng' : lowStock ? `⚡ Chỉ còn ${product.stockQuantity} ${getUnitShort(product.unit)}` : `✅ Còn ${product.stockQuantity} ${getUnitShort(product.unit)} trong kho`}
            </span>
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <button
              className="add-btn"
              onClick={addToCart}
              disabled={outStock || adding}
              style={{
                padding: '0.85rem', borderRadius: '10px',
                background: outStock ? '#f3f4f6' : 'white',
                color: outStock ? '#9ca3af' : '#2563eb',
                border: `2px solid ${outStock ? '#e5e7eb' : '#2563eb'}`,
                fontSize: '0.95rem', fontWeight: '700', cursor: outStock ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
            >
              {adding ? '⏳ Đang thêm...' : '🛒 Thêm vào giỏ hàng'}
            </button>
            <button
              className="buy-btn"
              onClick={buyNow}
              disabled={outStock}
              style={{
                padding: '0.85rem', borderRadius: '10px',
                background: outStock ? '#f3f4f6' : '#059669',
                color: outStock ? '#9ca3af' : 'white',
                border: 'none',
                fontSize: '0.95rem', fontWeight: '700', cursor: outStock ? 'not-allowed' : 'pointer',
                boxShadow: outStock ? 'none' : '0 3px 12px rgba(5,150,105,0.3)',
                transition: 'all 0.2s',
              }}
            >
              ⚡ Mua ngay
            </button>
          </div>

          {/* Notes */}
          <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.6 }}>
            📦 Đặt tối thiểu <strong>{product.minOrderQuantity || 1} {getUnitShort(product.unit)}</strong><br />
            🚚 Giao hàng sau khi xác nhận đơn<br />
            🔄 Hỗ trợ đổi trả trong 7 ngày
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetail;
