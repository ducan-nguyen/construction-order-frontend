import React, { useState } from 'react';
import { productAPI } from '../../services/api';
import { formatPrice } from '../../utils/orderUtils';
import { CATEGORIES, getCategoryLabel, getCategoryStyle, UNITS } from '../../utils/categoryUtils';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';


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

const CreateProduct = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', unit: '',
    price: '', stockQuantity: '', minOrderQuantity: 1, active: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stockQuantity || !formData.category || !formData.unit) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setSubmitting(true);
    try {
      await productAPI.create({
        ...formData,
        price:            parseFloat(formData.price),
        stockQuantity:    parseInt(formData.stockQuantity),
        minOrderQuantity: parseInt(formData.minOrderQuantity),
      });
      toast.success('Thêm sản phẩm thành công');
      navigate('/admin/products');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thêm sản phẩm thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const cs = getCategoryStyle(formData.category);

  return (
    <div style={{ maxWidth: '760px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <button
          onClick={() => navigate('/admin/products')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.45rem 0.9rem',
            background: 'white', color: '#6b7280',
            border: '1.5px solid #d1d5db', borderRadius: '8px',
            cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}
        >
          ← Quay lại
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#111827' }}>
            ➕ Thêm sản phẩm mới
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Card 1: Thông tin cơ bản */}
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>📝 Thông tin cơ bản</h2>

            <div style={{ marginBottom: '1rem' }}>
              <Label required>Tên sản phẩm</Label>
              <input
                type="text" name="name" value={formData.name}
                onChange={handleChange} required placeholder="Nhập tên sản phẩm..."
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>

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

          {/* Card 2: Phân loại */}
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>🏷️ Phân loại</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <Label required>Danh mục</Label>
                <select
                  name="category" value={formData.category}
                  onChange={handleChange} required style={inputStyle}
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
                  onChange={handleChange} required style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                  onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
                >
                  <option value="">-- Chọn đơn vị --</option>
                  {UNITS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Card 3: Giá & Kho */}
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>💰 Giá & Tồn kho</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <Label required>Giá bán (VNĐ)</Label>
                <input
                  type="number" name="price" value={formData.price}
                  onChange={handleChange} required min="0" placeholder="0"
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
                  onChange={handleChange} required min="0" placeholder="0"
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

          {/* Card 4: Trạng thái */}
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', padding: '1.25rem 1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="checkbox" name="active" checked={formData.active}
                  onChange={handleChange}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
                <div style={{ width: '44px', height: '24px', borderRadius: '9999px', background: formData.active ? '#2563eb' : '#d1d5db', transition: 'background 0.2s', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '3px', left: formData.active ? '23px' : '3px', width: '18px', height: '18px', background: 'white', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
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
              <span style={{ marginLeft: 'auto', padding: '0.2rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: '700', background: formData.active ? '#dcfce7' : '#fee2e2', color: formData.active ? '#15803d' : '#dc2626' }}>
                {formData.active ? 'Active' : 'Inactive'}
              </span>
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingBottom: '1rem' }}>
            <button
              type="button" onClick={() => navigate('/admin/products')}
              style={{ padding: '0.65rem 1.5rem', background: 'white', color: '#6b7280', border: '1.5px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.color = '#374151'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}
            >
              Hủy
            </button>
            <button
              type="submit" disabled={submitting}
              style={{ padding: '0.65rem 2rem', background: submitting ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '0.9rem', boxShadow: submitting ? 'none' : '0 2px 8px rgba(37,99,235,0.35)', transition: 'background 0.15s' }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = '#1d4ed8'; }}
              onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = '#2563eb'; }}
            >
              {submitting ? '⏳ Đang lưu...' : '➕ Thêm sản phẩm'}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
};

export default CreateProduct;
