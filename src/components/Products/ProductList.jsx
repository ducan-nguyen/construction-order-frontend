import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../../services/api';
import { formatPrice } from '../../utils/orderUtils';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getCategoryLabel, getCategoryStyle, getUnitShort } from '../../utils/categoryUtils';
import { loadCart, saveCart } from '../../utils/cartUtils';

const categoryStyle = getCategoryStyle;

const isSale      = (p) => (p.discountPrice && p.discountPrice < p.price) || (p.salePrice && p.salePrice < p.price) || p.onSale === true;
const getSalePrice   = (p) => p.discountPrice || p.salePrice || null;
const getSalePercent = (p) => { const sp = getSalePrice(p); if (!sp) return 0; return Math.round((1 - sp / p.price) * 100); };
const effectivePrice = (p) => getSalePrice(p) || p.price;

const addToLocalCart = (email, product, quantity) => {
  const cart = loadCart(email);
  const existing = cart.findIndex((i) => i.productId === product.id);
  if (existing >= 0) {
    cart[existing].quantity += quantity;
  } else {
    cart.push({
      productId: product.id, productName: product.name,
      quantity, price: effectivePrice(product),
      unit: product.unit, minOrderQuantity: product.minOrderQuantity,
      stockQuantity: product.stockQuantity,
    });
  }
  saveCart(email, cart);
  return cart.length;
};

/* ── Sort button ── */
const SortBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    padding: '0.45rem 0.8rem',
    background: active ? '#2563eb' : 'white',
    color: active ? 'white' : '#6b7280',
    border: `1.5px solid ${active ? '#2563eb' : '#d1d5db'}`,
    borderRadius: '7px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', transition: 'all 0.15s',
  }}>
    {children}
  </button>
);

/* ── Main Component ── */
const ProductList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products,      setProducts]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortOrder,     setSortOrder]     = useState('');
  const [onlySale,      setOnlySale]      = useState(false);
  const [cartCount,     setCartCount]     = useState(() => loadCart(user?.email).length);

  useEffect(() => { fetchProducts(); }, []);

  // Sync cart badge mỗi khi localStorage thay đổi từ tab khác
  useEffect(() => {
    const sync = () => setCartCount(loadCart(user?.email).length);
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productAPI.getAll(0, 100);
      const raw = res.data.content || [];

      setProducts(raw);

    } catch {
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) { fetchProducts(); return; }
    try {
      setLoading(true);
      const res = await productAPI.search(searchKeyword, 0, 100);
      const results = res.data.content || [];
      setProducts(results);
      results.length === 0 ? toast.error('Không tìm thấy sản phẩm') : toast.success(`Tìm thấy ${results.length} sản phẩm`);
    } catch {
      toast.error('Tìm kiếm thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product, qty) => {
    const newCount = addToLocalCart(user?.email, product, qty);
    setCartCount(newCount);
    window.dispatchEvent(new Event('cartUpdate'));
    toast.success(`Đã thêm ${qty} ${getUnitShort(product.unit)} ${product.name} vào giỏ hàng`);
  };

  const handleBuyNow = (product, qty) => {
    navigate('/orders/create', { state: { preselect: { product, quantity: qty } } });
  };

  const displayed = [...products]
    .filter((p) => !onlySale || isSale(p))
    .sort((a, b) => {
      if (sortOrder === 'az') return a.name.localeCompare(b.name, 'vi');
      if (sortOrder === 'za') return b.name.localeCompare(a.name, 'vi');
      return 0;
    });

  const saleCount = products.filter(isSale).length;

  return (
    <div>
      {/* ── Header row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#111827' }}>Danh sách sản phẩm</h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
            {loading ? '...' : `${displayed.length} / ${products.length} sản phẩm`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Cart badge */}
          {cartCount > 0 && (
            <button
              onClick={() => navigate('/orders/create')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 0.9rem',
                background: '#2563eb', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontWeight: '700', fontSize: '0.85rem',
                boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
              }}
            >
              🛒
              <span style={{
                background: 'white', color: '#2563eb',
                borderRadius: '9999px', padding: '0 0.4rem',
                fontSize: '0.75rem', fontWeight: '800',
              }}>
                {cartCount}
              </span>
              Giỏ hàng
            </button>
          )}

          {/* Search */}
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              padding: '0.55rem 1rem', border: '1.5px solid #d1d5db', borderRadius: '8px',
              fontSize: '0.875rem', outline: 'none', width: '200px', color: '#111827',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
            onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '0.55rem 1.1rem', background: '#2563eb', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem',
            }}
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', marginRight: '0.25rem' }}>Sắp xếp:</span>
        <SortBtn active={sortOrder === ''  } onClick={() => setSortOrder('')  }>Mặc định</SortBtn>
        <SortBtn active={sortOrder === 'az'} onClick={() => setSortOrder('az')}>A → Z ↑</SortBtn>
        <SortBtn active={sortOrder === 'za'} onClick={() => setSortOrder('za')}>Z → A ↓</SortBtn>
        <div style={{ width: '1px', height: '20px', background: '#e5e7eb', margin: '0 0.25rem' }} />
        <button
          onClick={() => setOnlySale((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem',
            background: onlySale ? '#fff1f2' : 'white', color: onlySale ? '#e11d48' : '#6b7280',
            border: `1.5px solid ${onlySale ? '#fda4af' : '#d1d5db'}`, borderRadius: '7px',
            cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem', transition: 'all 0.15s',
          }}
        >
          🔥 Đang sale
          {saleCount > 0 && (
            <span style={{ background: onlySale ? '#e11d48' : '#f3f4f6', color: onlySale ? 'white' : '#6b7280', borderRadius: '9999px', padding: '0 0.4rem', fontSize: '0.72rem', fontWeight: '800' }}>
              {saleCount}
            </span>
          )}
        </button>
        {(sortOrder !== '' || onlySale) && (
          <button
            onClick={() => { setSortOrder(''); setOnlySale(false); }}
            style={{ padding: '0.45rem 0.7rem', background: 'transparent', color: '#9ca3af', border: '1.5px solid #e5e7eb', borderRadius: '7px', cursor: 'pointer', fontSize: '0.78rem' }}
          >
            ✕ Bỏ lọc
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Đang tải...</div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', color: '#6b7280' }}>
          {onlySale ? 'Không có sản phẩm nào đang sale.' : 'Không tìm thấy sản phẩm nào.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {displayed.map((product) => {
            const lowStock  = product.stockQuantity <= (product.minOrderQuantity || 1) * 2;
            const catStyle  = categoryStyle(product.category);
            const sale      = isSale(product);
            const salePrice = getSalePrice(product);
            const salePct   = getSalePercent(product);

            return (
              <div
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                style={{
                  background: 'white', borderRadius: '12px', padding: '1.25rem',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  border: `1px solid ${sale ? '#fda4af' : '#f3f4f6'}`,
                  position: 'relative', cursor: 'pointer',
                  transition: 'box-shadow 0.15s, transform 0.15s',
                  display: 'flex', flexDirection: 'column',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Sale ribbon */}
                {sale && (
                  <div style={{
                    position: 'absolute', top: '10px', right: '-2px',
                    background: 'linear-gradient(135deg,#e11d48,#f43f5e)',
                    color: 'white', fontSize: '0.7rem', fontWeight: '800',
                    padding: '0.2rem 0.6rem 0.2rem 0.5rem', borderRadius: '4px 0 0 4px',
                    boxShadow: '0 2px 6px rgba(225,29,72,0.35)', letterSpacing: '0.3px',
                  }}>
                    🔥 SALE {salePct > 0 ? `-${salePct}%` : ''}
                  </div>
                )}

                {/* Name + stock */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', paddingRight: sale ? '3.5rem' : '0' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#111827', lineHeight: 1.3 }}>{product.name}</h3>
                  <span style={{ padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', background: lowStock ? '#fee2e2' : '#dcfce7', color: lowStock ? '#dc2626' : '#16a34a', flexShrink: 0, marginLeft: '0.5rem' }}>
                    {product.stockQuantity} {getUnitShort(product.unit)}
                  </span>
                </div>

                <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#6b7280', minHeight: '1.2rem', flex: 1 }}>
                  {product.description || '—'}
                </p>

                {/* Price */}
                <div style={{ marginBottom: '0.75rem' }}>
                  {sale && salePrice ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#e11d48' }}>{formatPrice(salePrice)}</span>
                      <span style={{ fontSize: '0.85rem', color: '#9ca3af', textDecoration: 'line-through' }}>{formatPrice(product.price)}</span>
                      <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>/{getUnitShort(product.unit)}</span>
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#2563eb' }}>{formatPrice(product.price)}</span>
                      <span style={{ fontSize: '0.8rem', color: '#9ca3af', marginLeft: '0.25rem' }}>/{getUnitShort(product.unit)}</span>
                    </div>
                  )}
                </div>

                {/* Category + min order */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                    📦 Tối thiểu: <strong>{product.minOrderQuantity} {getUnitShort(product.unit)}</strong>
                  </div>
                  <span style={{ padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '700', background: catStyle.bg, color: catStyle.color }}>
                    🏷️ {getCategoryLabel(product.category)}
                  </span>
                </div>

                {/* Quick-action buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.65rem', borderTop: '1px solid #f3f4f6' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(product, product.minOrderQuantity || 1); }}
                    style={{
                      flex: 1, padding: '0.5rem 0.25rem',
                      background: 'white', color: '#2563eb',
                      border: '1.5px solid #2563eb', borderRadius: '8px',
                      cursor: 'pointer', fontWeight: '700', fontSize: '0.78rem',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                  >
                    🛒 Thêm giỏ
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleBuyNow(product, product.minOrderQuantity || 1); }}
                    style={{
                      flex: 1, padding: '0.5rem 0.25rem',
                      background: sale ? 'linear-gradient(135deg,#e11d48,#f43f5e)' : 'linear-gradient(135deg,#1e3a5f,#2563eb)',
                      color: 'white', border: 'none', borderRadius: '8px',
                      cursor: 'pointer', fontWeight: '700', fontSize: '0.78rem',
                    }}
                  >
                    ⚡ Mua ngay
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal removed — cards now navigate to /products/:id */}
    </div>
  );
};

export default ProductList;
