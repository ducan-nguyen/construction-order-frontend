import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../../services/api';
import { formatPrice } from '../../utils/orderUtils';
import toast from 'react-hot-toast';

import { CATEGORIES, getCategoryLabel, getCategoryStyle, UNITS } from '../../utils/categoryUtils';

const inputStyle = {
  width: '100%',
  padding: '0.6rem 0.85rem',
  border: '1.5px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '0.9rem',
  color: '#111827',
  outline: 'none',
  boxSizing: 'border-box',
  background: 'white',
  transition: 'border-color 0.15s',
};

const Label = ({ children, required }) => (
  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.35rem' }}>
    {children}{required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}
  </label>
);

const EditProduct = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData,   setFormData]   = useState({
    name: '', description: '', category: '', unit: '',
    price: '', stockQuantity: '', minOrderQuantity: 1, active: true,
    discountPercent: '',   // 1-99, rỗng = không sale
  });

  useEffect(() => { fetchProduct(); }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await productAPI.getById(id);
      const p = res.data;
      setFormData({
        name: p.name, description: p.description || '',
        category: p.category, unit: p.unit,
        price: p.price, stockQuantity: p.stockQuantity,
        minOrderQuantity: p.minOrderQuantity, active: p.active,
        // Chuyển discountPrice → phần trăm giảm để hiển thị
        discountPercent: (p.discountPrice && p.price && p.discountPrice < p.price)
          ? String(Math.round((1 - p.discountPrice / p.price) * 100))
          : '',
      });
    } catch {
      toast.error('Không thể tải thông tin sản phẩm');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const origPrice = parseFloat(formData.price);
      const pct       = parseInt(formData.discountPercent);
      const discountPrice = (formData.discountPercent && !isNaN(pct) && pct > 0 && pct < 100)
        ? Math.round(origPrice * (1 - pct / 100))
        : null;

      // Loại bỏ discountPercent (field frontend-only) trước khi gửi backend
      // eslint-disable-next-line no-unused-vars
      const { discountPercent: _omit, ...productPayload } = formData;

      await productAPI.update(id, {
        ...productPayload,
        price:            origPrice,
        stockQuantity:    parseInt(formData.stockQuantity),
        minOrderQuantity: parseInt(formData.minOrderQuantity),
        discountPrice,
      });
      toast.success('Cập nhật sản phẩm thành công!');
      navigate('/admin/products');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
        Đang tải thông tin sản phẩm...
      </div>
    );
  }

  const cs = getCategoryStyle(formData.category);

  return (
    <div style={{ maxWidth: '760px' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <button
          onClick={() => navigate('/admin/products')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.45rem 0.9rem',
            background: 'white', color: '#6b7280',
            border: '1.5px solid #d1d5db', borderRadius: '8px',
            cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}
        >
          ← Quay lại
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#111827' }}>
            ✏️ Chỉnh sửa sản phẩm
          </h1>
          <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
            ID #{id}
            {formData.category && (
              <span style={{ marginLeft: '0.6rem', padding: '0.1rem 0.55rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '700', background: cs.bg, color: cs.color }}>
                {formData.category}
              </span>
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ── Card 1: Thông tin cơ bản ── */}
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📝 Thông tin cơ bản
            </h2>

            {/* Tên sản phẩm */}
            <div style={{ marginBottom: '1rem' }}>
              <Label required>Tên sản phẩm</Label>
              <input
                type="text" name="name" value={formData.name}
                onChange={handleChange} required
                placeholder="Nhập tên sản phẩm..."
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>

            {/* Mô tả */}
            <div>
              <Label>Mô tả</Label>
              <textarea
                name="description" value={formData.description}
                onChange={handleChange} rows={3}
                placeholder="Mô tả ngắn về sản phẩm..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
                onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>
          </div>

          {/* ── Card 2: Phân loại ── */}
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>
              🏷️ Phân loại
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <Label required>Danh mục</Label>
                <select
                  name="category" value={formData.category}
                  onChange={handleChange} required
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                  onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
                >
                  <option value="">-- Chọn danh mục --</option>
                  {CATEGORIES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {formData.category && (
                  <div style={{ marginTop: '0.45rem' }}>
                    <span style={{ padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '700', background: cs.bg, color: cs.color }}>
                      🏷️ {getCategoryLabel(formData.category)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <Label required>Đơn vị tính</Label>
                <select
                  name="unit" value={formData.unit}
                  onChange={handleChange} required
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                  onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
                >
                  <option value="">-- Chọn đơn vị --</option>
                  {UNITS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Card 3: Giá & Kho ── */}
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>
              💰 Giá & Tồn kho
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <Label required>Giá bán (VNĐ)</Label>
                <input
                  type="number" name="price" value={formData.price}
                  onChange={handleChange} required min="0"
                  placeholder="0"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                  onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
                />
                {formData.price > 0 && (
                  <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: '#2563eb', fontWeight: '600' }}>
                    → {formatPrice(formData.price)}
                  </div>
                )}
              </div>
              <div>
                <Label required>Số lượng tồn kho</Label>
                <input
                  type="number" name="stockQuantity" value={formData.stockQuantity}
                  onChange={handleChange} required min="0"
                  placeholder="0"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                  onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
                />
              </div>
            </div>
            <div style={{ maxWidth: 'calc(50% - 0.5rem)' }}>
              <Label required>Số lượng đặt tối thiểu</Label>
              <input
                type="number" name="minOrderQuantity" value={formData.minOrderQuantity}
                onChange={handleChange} required min="1"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>
          </div>

          {/* ── Card 4: Giá khuyến mãi ── */}
          {(() => {
            const origPrice  = parseFloat(formData.price) || 0;
            const pct        = parseInt(formData.discountPercent) || 0;
            const saleOn     = !!formData.discountPercent && pct > 0;
            const isValid    = pct >= 1 && pct <= 99;
            const isError    = saleOn && !isValid;
            const salePrice  = (saleOn && isValid && origPrice > 0)
              ? Math.round(origPrice * (1 - pct / 100)) : 0;

            return (
              <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', padding: '1.5rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🏷️ Khuyến mãi
                    {saleOn && isValid && (
                      <span style={{ padding: '0.15rem 0.55rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '800', background: '#fef3c7', color: '#92400e' }}>
                        -{pct}%
                      </span>
                    )}
                  </h2>
                  {/* Toggle xóa nhanh */}
                  {saleOn && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, discountPercent: '' }))}
                      style={{ padding: '0.3rem 0.75rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700' }}
                    >
                      ✕ Bỏ sale
                    </button>
                  )}
                </div>

                {/* Slider + input số */}
                <div>
                  <Label>Phần trăm giảm giá — để trống nếu không sale</Label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    {/* Slider */}
                    <input
                      type="range"
                      min="0" max="90" step="5"
                      value={pct || 0}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        setFormData((prev) => ({ ...prev, discountPercent: v === 0 ? '' : String(v) }));
                      }}
                      style={{ flex: 1, accentColor: '#f59e0b', cursor: 'pointer' }}
                    />

                    {/* Ô nhập % thủ công */}
                    <div style={{ position: 'relative', flexShrink: 0, width: '90px' }}>
                      <input
                        type="number"
                        name="discountPercent"
                        value={formData.discountPercent}
                        onChange={handleChange}
                        min="0" max="99"
                        placeholder="0"
                        style={{
                          ...inputStyle,
                          width: '90px',
                          textAlign: 'center',
                          fontWeight: '800',
                          fontSize: '1.1rem',
                          color: saleOn ? '#d97706' : '#111827',
                          borderColor: isError ? '#ef4444' : (saleOn && isValid ? '#f59e0b' : '#d1d5db'),
                          paddingRight: '1.75rem',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#f59e0b')}
                        onBlur={(e) => (e.target.style.borderColor = isError ? '#ef4444' : (saleOn && isValid ? '#f59e0b' : '#d1d5db'))}
                      />
                      <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', fontWeight: '800', color: '#9ca3af', pointerEvents: 'none' }}>
                        %
                      </span>
                    </div>
                  </div>

                  {/* Preset buttons */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    {[5, 10, 15, 20, 25, 30, 50].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, discountPercent: pct === v ? '' : String(v) }))}
                        style={{
                          padding: '0.3rem 0.65rem',
                          background: pct === v ? '#f59e0b' : '#f9fafb',
                          color:      pct === v ? 'white'   : '#374151',
                          border: `1.5px solid ${pct === v ? '#f59e0b' : '#e5e7eb'}`,
                          borderRadius: '7px', cursor: 'pointer',
                          fontWeight: '700', fontSize: '0.78rem',
                          transition: 'all 0.15s',
                        }}
                      >
                        -{v}%
                      </button>
                    ))}
                  </div>

                  {/* Preview */}
                  {saleOn && isValid && origPrice > 0 && (
                    <div style={{ marginTop: '0.85rem', padding: '0.75rem 1rem', background: '#fffbeb', borderRadius: '10px', border: '1.5px solid #fde68a', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: '700', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Giá gốc</div>
                        <div style={{ fontSize: '0.9rem', color: '#9ca3af', textDecoration: 'line-through', fontWeight: '600' }}>{formatPrice(origPrice)}</div>
                      </div>
                      <div style={{ fontSize: '1.3rem', color: '#d97706' }}>→</div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: '700', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Giá sau giảm</div>
                        <div style={{ fontSize: '1.15rem', color: '#d97706', fontWeight: '800' }}>{formatPrice(salePrice)}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: '700', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Tiết kiệm</div>
                        <div style={{ fontSize: '0.9rem', color: '#dc2626', fontWeight: '800' }}>-{formatPrice(origPrice - salePrice)}</div>
                      </div>
                    </div>
                  )}

                  {isError && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#ef4444' }}>
                      ⚠️ Phần trăm giảm phải từ 1% đến 99%
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── Card 5: Trạng thái kinh doanh ── */}
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', padding: '1.25rem 1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="checkbox" name="active"
                  checked={formData.active} onChange={handleChange}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
                <div
                  style={{
                    width: '44px', height: '24px', borderRadius: '9999px',
                    background: formData.active ? '#2563eb' : '#d1d5db',
                    transition: 'background 0.2s',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute', top: '3px',
                      left: formData.active ? '23px' : '3px',
                      width: '18px', height: '18px',
                      background: 'white', borderRadius: '50%',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transition: 'left 0.2s',
                    }}
                  />
                </div>
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#111827' }}>
                  {formData.active ? '✓ Đang kinh doanh' : '✕ Ngưng kinh doanh'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                  {formData.active ? 'Sản phẩm hiện đang được bán' : 'Sản phẩm tạm ẩn khỏi danh mục'}
                </div>
              </div>
              <span style={{
                marginLeft: 'auto',
                padding: '0.2rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: '700',
                background: formData.active ? '#dcfce7' : '#fee2e2',
                color:      formData.active ? '#15803d' : '#dc2626',
              }}>
                {formData.active ? 'Active' : 'Inactive'}
              </span>
            </label>
          </div>

          {/* ── Action buttons ── */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              style={{
                padding: '0.65rem 1.5rem',
                background: 'white', color: '#6b7280',
                border: '1.5px solid #d1d5db', borderRadius: '8px',
                cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.color = '#374151'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.65rem 2rem',
                background: submitting ? '#93c5fd' : '#2563eb',
                color: 'white', border: 'none', borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: '700', fontSize: '0.9rem',
                boxShadow: submitting ? 'none' : '0 2px 8px rgba(37,99,235,0.35)',
                transition: 'background 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = '#1d4ed8'; }}
              onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = '#2563eb'; }}
            >
              {submitting ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
};

export default EditProduct;
