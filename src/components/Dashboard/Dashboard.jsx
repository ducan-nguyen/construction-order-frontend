import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const QuickCard = ({ to, icon, title, desc, color }) => (
  <Link
    to={to}
    style={{
      textDecoration: 'none',
      background: 'white',
      borderRadius: '12px',
      padding: '1.25rem',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      borderLeft: `4px solid ${color}`,
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      transition: 'box-shadow 0.15s, transform 0.15s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    <div
      style={{
        width: '48px', height: '48px', borderRadius: '10px',
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem', flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <div style={{ fontWeight: '700', color: '#111827', fontSize: '0.95rem' }}>{title}</div>
      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.15rem' }}>{desc}</div>
    </div>
  </Link>
);

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div>
      {/* Welcome banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
          borderRadius: '14px',
          padding: '2rem',
          color: 'white',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <div
          style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', flexShrink: 0,
          }}
        >
          {user?.email?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700' }}>
            Chào mừng trở lại! 👋
          </h1>
          <p style={{ margin: '0.3rem 0 0', opacity: 0.85, fontSize: '0.9rem' }}>
            {user?.email} &nbsp;·&nbsp;
            <span
              style={{
                padding: '0.1rem 0.6rem',
                borderRadius: '9999px',
                background: isAdmin ? '#fef3c7' : '#dbeafe',
                color: isAdmin ? '#92400e' : '#1e40af',
                fontSize: '0.75rem',
                fontWeight: '700',
              }}
            >
              {isAdmin ? '🔑 Quản trị viên' : '👤 Khách hàng'}
            </span>
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <h2 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.9rem' }}>
        Truy cập nhanh
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <QuickCard to="/products"      icon="📦" title="Sản phẩm"     desc="Xem danh mục vật liệu xây dựng" color="#3b82f6" />
        <QuickCard to="/orders/create" icon="➕" title="Tạo đơn hàng" desc="Đặt mua vật liệu mới"           color="#10b981" />
        <QuickCard to="/orders"        icon="📋" title="Đơn hàng"     desc="Theo dõi trạng thái đơn hàng" color="#f59e0b" />
        {isAdmin && (
          <QuickCard to="/admin/dashboard" icon="📊" title="Admin Dashboard" desc="Thống kê doanh thu & đơn hàng" color="#ef4444" />
        )}
        {isAdmin && (
          <QuickCard to="/admin/products"  icon="🛠" title="Quản lý sản phẩm" desc="Thêm, sửa, xóa sản phẩm"      color="#6366f1" />
        )}
      </div>

    </div>
  );
};

export default Dashboard;
