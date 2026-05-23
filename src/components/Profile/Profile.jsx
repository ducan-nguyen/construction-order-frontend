import React, { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

/* ── helpers ── */
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
};

const labelStyle = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  marginBottom: '0.3rem',
};

const Field = ({ label, value }) => (
  <div>
    <div style={labelStyle}>{label}</div>
    <div
      style={{
        fontSize: '0.95rem',
        color: value ? '#111827' : '#9ca3af',
        fontStyle: value ? 'normal' : 'italic',
        padding: '0.45rem 0',
        borderBottom: '1px solid #f3f4f6',
      }}
    >
      {value || 'Chưa cập nhật'}
    </div>
  </div>
);

const BtnPrimary = ({ children, onClick, type = 'button', color = '#2563eb', disabled }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '0.55rem 1.2rem',
      background: disabled ? '#93c5fd' : color,
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '0.875rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  >
    {children}
  </button>
);

const BtnGhost = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '0.55rem 1.2rem',
      background: 'transparent',
      color: '#6b7280',
      border: '1.5px solid #d1d5db',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '0.875rem',
      cursor: 'pointer',
    }}
  >
    {children}
  </button>
);

/* ── component ── */
const Profile = () => {
  const { user, logout } = useAuth();
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [editing,      setEditing]      = useState(false);
  const [formData,     setFormData]     = useState({});
  const [changingPw,   setChangingPw]   = useState(false);
  const [pwData,       setPwData]       = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors,     setPwErrors]     = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [saving,       setSaving]       = useState(false);
  const [logoutDialog, setLogoutDialog] = useState(false);

  // State riêng cho từng phần ngày sinh
  const [dobD, setDobD] = useState('');
  const [dobM, setDobM] = useState('');
  const [dobY, setDobY] = useState('');

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await userAPI.getProfile();
      setProfile(res.data);
      setFormData(res.data);
      // Khởi tạo state ngày sinh
      if (res.data.dateOfBirth) {
        const [y = '', m = '', d = ''] = res.data.dateOfBirth.split('-');
        setDobY(y); setDobM(m); setDobD(d);
      }
    } catch {
      toast.error('Không thể tải thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await userAPI.updateProfile(formData);
      setProfile(res.data);
      setEditing(false);
      toast.success('Cập nhật thành công');
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const setPwField = (key, val) => {
    setPwData((p) => {
      const next = { ...p, [key]: val };
      // Real-time validation
      const errs = { ...pwErrors };
      if (key === 'newPassword') {
        errs.newPassword = val.length > 0 && val.length < 6 ? 'Mật khẩu mới phải có ít nhất 6 ký tự' : '';
        // Re-check confirm when new password changes
        if (next.confirmPassword) {
          errs.confirmPassword = next.confirmPassword !== val ? 'Mật khẩu xác nhận không khớp' : '';
        }
      }
      if (key === 'confirmPassword') {
        errs.confirmPassword = val && val !== next.newPassword ? 'Mật khẩu xác nhận không khớp' : '';
      }
      if (key === 'oldPassword') {
        errs.oldPassword = ''; // Clear error when user starts retyping
      }
      setPwErrors(errs);
      return next;
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    // Final validation before submit
    const errs = { oldPassword: '', newPassword: '', confirmPassword: '' };
    if (pwData.newPassword.length < 6) errs.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    if (pwData.newPassword !== pwData.confirmPassword) errs.confirmPassword = 'Mật khẩu xác nhận không khớp';
    if (errs.newPassword || errs.confirmPassword) { setPwErrors(errs); return; }

    try {
      await userAPI.changePassword({ oldPassword: pwData.oldPassword, newPassword: pwData.newPassword, confirmPassword: pwData.confirmPassword });
      toast.success('Đổi mật khẩu thành công!');
      setChangingPw(false);
      setPwData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setPwErrors({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setLogoutDialog(true);
    } catch (error) {
      const msg = error.response?.data?.message || 'Đổi mật khẩu thất bại';
      setPwErrors((prev) => ({ ...prev, oldPassword: msg }));
    }
  };

  const closePwForm = () => {
    setChangingPw(false);
    setPwData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setPwErrors({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  const setField = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));

  // Khi thay đổi bất kỳ phần nào của ngày sinh → cập nhật state riêng + sync vào formData
  const handleDobChange = (field, val) => {
    const next = { d: dobD, m: dobM, y: dobY, [field]: val };
    if (field === 'd') setDobD(val);
    if (field === 'm') setDobM(val);
    if (field === 'y') setDobY(val);
    if (next.y && next.m && next.d) {
      setField('dateOfBirth', `${next.y}-${next.m}-${next.d}`);
    }
  };

  const DOB_DAYS   = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const DOB_MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const DOB_YEARS  = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Đang tải...</div>;
  if (!profile) return <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Không có dữ liệu</div>;

  const initials = (profile.fullName || profile.email || '?')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>

      {/* ── Header card ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
          borderRadius: '14px',
          padding: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          marginBottom: '1.5rem',
          color: 'white',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: '72px', height: '72px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '3px solid rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', fontWeight: '700', flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700' }}>
            {profile.fullName || 'Người dùng'}
          </h1>
          <div style={{ marginTop: '0.3rem', fontSize: '0.875rem', opacity: 0.85 }}>
            {profile.email}
          </div>
          <span
            style={{
              display: 'inline-block', marginTop: '0.5rem',
              padding: '0.15rem 0.7rem',
              borderRadius: '9999px',
              fontSize: '0.72rem', fontWeight: '700',
              background: user?.role === 'ADMIN' ? '#fef3c7' : '#dbeafe',
              color:      user?.role === 'ADMIN' ? '#92400e' : '#1e40af',
            }}
          >
            {user?.role === 'ADMIN' ? '🔑 Quản trị viên' : '👤 Khách hàng'}
          </span>
        </div>
      </div>

      {/* ── Info card ── */}
      <div
        style={{
          background: 'white', borderRadius: '14px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          padding: '1.75rem', marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#111827' }}>
            📋 Thông tin cá nhân
          </h2>
          {!editing && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <BtnPrimary onClick={() => setEditing(true)}>✏️ Chỉnh sửa</BtnPrimary>
              <BtnPrimary color="#f59e0b" onClick={() => setChangingPw((v) => !v)}>
                🔒 Đổi mật khẩu
              </BtnPrimary>
            </div>
          )}
        </div>

        {/* View mode */}
        {!editing ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem 2rem' }}>
            <Field label="Email"       value={profile.email} />
            <Field label="Họ và tên"   value={profile.fullName} />
            <Field label="Điện thoại"  value={profile.phone} />
            <Field label="Ngày sinh"   value={profile.dateOfBirth ? profile.dateOfBirth.split('-').reverse().join('/') : null} />
            <Field label="Giới tính"
              value={profile.gender === 'MALE' ? 'Nam' : profile.gender === 'FEMALE' ? 'Nữ' : profile.gender === 'OTHER' ? 'Khác' : null}
            />
            <Field label="Công ty"     value={profile.companyName} />
            <Field label="Mã số thuế"  value={profile.taxCode} />
            <Field label="Địa chỉ"    value={profile.address} />
          </div>
        ) : (
          /* Edit mode */
          <form onSubmit={handleUpdate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { label: 'Họ và tên *', key: 'fullName', type: 'text', required: true },
                { label: 'Điện thoại',  key: 'phone',    type: 'tel' },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    type={type}
                    value={formData[key] || ''}
                    onChange={(e) => setField(key, e.target.value)}
                    required={required}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                    onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
                  />
                </div>
              ))}

              {/* Ngày sinh — Ngày / Tháng / Năm */}
              <div>
                <label style={labelStyle}>Ngày sinh</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: '0.4rem' }}>
                  <select value={dobD} onChange={(e) => handleDobChange('d', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Ngày</option>
                    {DOB_DAYS.map((d) => <option key={d} value={d}>{parseInt(d)}</option>)}
                  </select>
                  <select value={dobM} onChange={(e) => handleDobChange('m', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Tháng</option>
                    {DOB_MONTHS.map((m) => <option key={m} value={m}>Tháng {parseInt(m)}</option>)}
                  </select>
                  <select value={dobY} onChange={(e) => handleDobChange('y', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Năm</option>
                    {DOB_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Giới tính</label>
                <select
                  value={formData.gender || ''}
                  onChange={(e) => setField('gender', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">-- Chọn --</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Tên công ty</label>
                <input
                  type="text"
                  value={formData.companyName || ''}
                  onChange={(e) => setField('companyName', e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                  onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
                />
              </div>

              <div>
                <label style={labelStyle}>Mã số thuế</label>
                <input
                  type="text"
                  value={formData.taxCode || ''}
                  onChange={(e) => setField('taxCode', e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                  onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
                />
              </div>

              {/* Address — full width */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Địa chỉ</label>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => setField('address', e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                  onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem' }}>
              <BtnPrimary type="submit" color="#059669" disabled={saving}>
                {saving ? '⏳ Đang lưu...' : '✅ Lưu thay đổi'}
              </BtnPrimary>
              <BtnGhost onClick={() => {
                setEditing(false); setFormData(profile);
                if (profile.dateOfBirth) { const [y='',m='',d=''] = profile.dateOfBirth.split('-'); setDobY(y); setDobM(m); setDobD(d); } else { setDobY(''); setDobM(''); setDobD(''); }
              }}>
                Hủy
              </BtnGhost>
            </div>
          </form>
        )}
      </div>

      {/* ── Change password card ── */}
      {changingPw && (
        <div
          style={{
            background: 'white', borderRadius: '14px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            padding: '1.75rem',
          }}
        >
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: '700', color: '#111827' }}>
            🔒 Đổi mật khẩu
          </h2>
          <form onSubmit={handleChangePassword}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

              {/* Mật khẩu hiện tại — full width */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Mật khẩu hiện tại</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={pwData.oldPassword}
                  onChange={(e) => setPwField('oldPassword', e.target.value)}
                  required
                  style={{
                    ...inputStyle,
                    borderColor: pwErrors.oldPassword ? '#ef4444' : '#d1d5db',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = pwErrors.oldPassword ? '#ef4444' : '#2563eb')}
                  onBlur={(e)  => (e.target.style.borderColor = pwErrors.oldPassword ? '#ef4444' : '#d1d5db')}
                />
                {pwErrors.oldPassword && (
                  <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    ⚠️ {pwErrors.oldPassword}
                  </div>
                )}
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label style={labelStyle}>Mật khẩu mới (≥ 6 ký tự)</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={pwData.newPassword}
                  onChange={(e) => setPwField('newPassword', e.target.value)}
                  required
                  style={{
                    ...inputStyle,
                    borderColor: pwErrors.newPassword ? '#ef4444' : '#d1d5db',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = pwErrors.newPassword ? '#ef4444' : '#2563eb')}
                  onBlur={(e)  => (e.target.style.borderColor = pwErrors.newPassword ? '#ef4444' : '#d1d5db')}
                />
                {pwErrors.newPassword && (
                  <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    ⚠️ {pwErrors.newPassword}
                  </div>
                )}
                {!pwErrors.newPassword && pwData.newPassword.length >= 6 && (
                  <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', color: '#059669' }}>
                    ✓ Mật khẩu hợp lệ
                  </div>
                )}
              </div>

              {/* Xác nhận mật khẩu */}
              <div>
                <label style={labelStyle}>Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={pwData.confirmPassword}
                  onChange={(e) => setPwField('confirmPassword', e.target.value)}
                  required
                  style={{
                    ...inputStyle,
                    borderColor: pwErrors.confirmPassword ? '#ef4444'
                      : (pwData.confirmPassword && pwData.confirmPassword === pwData.newPassword) ? '#059669'
                      : '#d1d5db',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = pwErrors.confirmPassword ? '#ef4444' : '#2563eb')}
                  onBlur={(e)  => (e.target.style.borderColor = pwErrors.confirmPassword ? '#ef4444'
                    : (pwData.confirmPassword && pwData.confirmPassword === pwData.newPassword) ? '#059669'
                    : '#d1d5db')}
                />
                {pwErrors.confirmPassword && (
                  <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    ⚠️ {pwErrors.confirmPassword}
                  </div>
                )}
                {!pwErrors.confirmPassword && pwData.confirmPassword && pwData.confirmPassword === pwData.newPassword && (
                  <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', color: '#059669' }}>
                    ✓ Mật khẩu khớp
                  </div>
                )}
              </div>

            </div>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem' }}>
              <BtnPrimary type="submit" color="#f59e0b">
                🔐 Xác nhận đổi mật khẩu
              </BtnPrimary>
              <BtnGhost onClick={closePwForm}>Hủy</BtnGhost>
            </div>
          </form>
        </div>
      )}

      {/* ── Custom logout confirm dialog ── */}
      {logoutDialog && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'white', borderRadius: '14px',
              padding: '2rem', maxWidth: '400px', width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔑</div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: '700', color: '#111827' }}>
              Đổi mật khẩu thành công!
            </h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 }}>
              Bạn có muốn đăng xuất để đăng nhập lại với mật khẩu mới không?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <BtnPrimary
                color="#f59e0b"
                onClick={() => { setLogoutDialog(false); logout(); }}
              >
                🚪 Đăng xuất ngay
              </BtnPrimary>
              <BtnGhost onClick={() => setLogoutDialog(false)}>
                Ở lại
              </BtnGhost>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
