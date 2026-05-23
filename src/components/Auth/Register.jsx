import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const inputStyle = (focused) => ({
  width: '100%',
  padding: '0.65rem 0.85rem',
  border: `1.5px solid ${focused ? '#2563eb' : '#d1d5db'}`,
  borderRadius: '8px',
  fontSize: '0.9rem',
  outline: 'none',
  color: '#111827',
  background: 'white',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
});

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: '700',
  color: '#374151',
  marginBottom: '0.35rem',
};

const Field = ({ label, required, children }) => (
  <div>
    <label style={labelStyle}>
      {label}
      {required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
    </label>
    {children}
  </div>
);

const DAYS   = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const YEARS  = Array.from({ length: 80  }, (_, i) => String(new Date().getFullYear() - i));

const selectStyle = (active) => ({
  flex: 1,
  padding: '0.65rem 0.5rem',
  border: `1.5px solid ${active ? '#2563eb' : '#d1d5db'}`,
  borderRadius: '8px',
  fontSize: '0.85rem',
  outline: 'none',
  color: '#111827',
  background: 'white',
  cursor: 'pointer',
  transition: 'border-color 0.15s',
});

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    gender: '',
    companyName: '',
    taxCode: '',
    address: '',
  });
  const [dobD,      setDobD]      = useState('');
  const [dobM,      setDobM]      = useState('');
  const [dobY,      setDobY]      = useState('');
  const [focused,   setFocused]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const [showConf,  setShowConf]  = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleDobChange = (field, val) => {
    const next = { d: dobD, m: dobM, y: dobY, [field]: val };
    if (field === 'd') setDobD(val);
    if (field === 'm') setDobM(val);
    if (field === 'y') setDobY(val);
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Mật khẩu phải ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = formData;
      // Gộp ngày sinh nếu đã chọn đủ 3 phần
      if (dobY && dobM && dobD) {
        payload.dateOfBirth = `${dobY}-${dobM}-${dobD}`;
      }
      // Không gửi gender nếu chưa chọn
      if (!payload.gender) delete payload.gender;
      const success = await register(payload);
      if (success) {
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #7c3aed 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      {/* Card */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '600px',
        overflow: 'hidden',
      }}>
        {/* Header banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
          padding: '2rem 2rem 1.75rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏗️</div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'white' }}>
            Đăng ký tài khoản
          </h1>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: '#93c5fd' }}>
            Construction Order Management System
          </p>
        </div>

        {/* Form body */}
        <div style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>

            {/* Divider: Thông tin tài khoản */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                🔐 Thông tin đăng nhập
              </span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              {/* Email — full width */}
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Email" required>
                  <input
                    type="email" name="email" value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused('')}
                    placeholder="example@email.com"
                    style={inputStyle(focused === 'email')}
                    required
                  />
                </Field>
              </div>

              {/* Mật khẩu */}
              <Field label="Mật khẩu" required>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password" value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused('')}
                    placeholder="Tối thiểu 6 ký tự"
                    style={{ ...inputStyle(focused === 'password'), paddingRight: '2.5rem' }}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#9ca3af', padding: 0 }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </Field>

              {/* Xác nhận mật khẩu */}
              <Field label="Xác nhận mật khẩu" required>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConf ? 'text' : 'password'}
                    name="confirmPassword" value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocused('confirmPassword')}
                    onBlur={() => setFocused('')}
                    placeholder="Nhập lại mật khẩu"
                    style={{
                      ...inputStyle(focused === 'confirmPassword'),
                      paddingRight: '2.5rem',
                      borderColor: formData.confirmPassword && formData.confirmPassword !== formData.password
                        ? '#ef4444'
                        : focused === 'confirmPassword' ? '#2563eb' : '#d1d5db',
                    }}
                    required
                  />
                  <button type="button" onClick={() => setShowConf(v => !v)}
                    style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#9ca3af', padding: 0 }}>
                    {showConf ? '🙈' : '👁️'}
                  </button>
                </div>
                {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                    ✕ Mật khẩu không khớp
                  </p>
                )}
                {formData.confirmPassword && formData.confirmPassword === formData.password && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#16a34a' }}>
                    ✓ Mật khẩu khớp
                  </p>
                )}
              </Field>
            </div>

            {/* Divider: Thông tin cá nhân */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', marginTop: '0.5rem' }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                👤 Thông tin cá nhân
              </span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <Field label="Họ và tên" required>
                <input
                  type="text" name="fullName" value={formData.fullName}
                  onChange={handleChange}
                  onFocus={() => setFocused('fullName')}
                  onBlur={() => setFocused('')}
                  placeholder="Nguyễn Văn A"
                  style={inputStyle(focused === 'fullName')}
                  required
                />
              </Field>

              <Field label="Số điện thoại">
                <input
                  type="tel" name="phone" value={formData.phone}
                  onChange={handleChange}
                  onFocus={() => setFocused('phone')}
                  onBlur={() => setFocused('')}
                  placeholder="0901 234 567"
                  style={inputStyle(focused === 'phone')}
                />
              </Field>

              {/* Giới tính */}
              <Field label="Giới tính">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  onFocus={() => setFocused('gender')}
                  onBlur={() => setFocused('')}
                  style={selectStyle(focused === 'gender')}
                >
                  <option value="">-- Chọn giới tính --</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </Field>

              {/* Ngày sinh — full width */}
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Ngày sinh">
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      value={dobD}
                      onChange={(e) => handleDobChange('d', e.target.value)}
                      onFocus={() => setFocused('dobD')}
                      onBlur={() => setFocused('')}
                      style={selectStyle(focused === 'dobD')}
                    >
                      <option value="">-- Ngày --</option>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select
                      value={dobM}
                      onChange={(e) => handleDobChange('m', e.target.value)}
                      onFocus={() => setFocused('dobM')}
                      onBlur={() => setFocused('')}
                      style={selectStyle(focused === 'dobM')}
                    >
                      <option value="">-- Tháng --</option>
                      {MONTHS.map(m => <option key={m} value={m}>Tháng {m}</option>)}
                    </select>
                    <select
                      value={dobY}
                      onChange={(e) => handleDobChange('y', e.target.value)}
                      onFocus={() => setFocused('dobY')}
                      onBlur={() => setFocused('')}
                      style={selectStyle(focused === 'dobY')}
                    >
                      <option value="">-- Năm --</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  {dobD && dobM && dobY && (
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>
                      ✓ {dobD}/{dobM}/{dobY}
                    </p>
                  )}
                </Field>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Địa chỉ">
                  <input
                    type="text" name="address" value={formData.address}
                    onChange={handleChange}
                    onFocus={() => setFocused('address')}
                    onBlur={() => setFocused('')}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    style={inputStyle(focused === 'address')}
                  />
                </Field>
              </div>
            </div>


            {/* Divider: Thông tin doanh nghiệp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', marginTop: '0.5rem' }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                🏢 Thông tin doanh nghiệp <span style={{ fontWeight: '400', textTransform: 'none' }}>(tùy chọn)</span>
              </span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <Field label="Tên công ty">
                <input
                  type="text" name="companyName" value={formData.companyName}
                  onChange={handleChange}
                  onFocus={() => setFocused('companyName')}
                  onBlur={() => setFocused('')}
                  placeholder="Công ty TNHH..."
                  style={inputStyle(focused === 'companyName')}
                />
              </Field>

              <Field label="Mã số thuế">
                <input
                  type="text" name="taxCode" value={formData.taxCode}
                  onChange={handleChange}
                  onFocus={() => setFocused('taxCode')}
                  onBlur={() => setFocused('')}
                  placeholder="0123456789"
                  style={inputStyle(focused === 'taxCode')}
                />
              </Field>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || (formData.confirmPassword && formData.confirmPassword !== formData.password)}
              style={{
                width: '100%',
                padding: '0.85rem',
                background: loading
                  ? '#93c5fd'
                  : 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '800',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(37,99,235,0.4)',
                transition: 'all 0.2s',
                letterSpacing: '0.3px',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {loading ? '⏳ Đang đăng ký...' : '🚀 Tạo tài khoản'}
            </button>
          </form>

          {/* Login link */}
          <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Đã có tài khoản? </span>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'none', border: 'none',
                color: '#2563eb', fontWeight: '700',
                fontSize: '0.875rem', cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Đăng nhập ngay →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
