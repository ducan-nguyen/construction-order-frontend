import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

import { getCartCount } from '../../utils/cartUtils';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(() => getCartCount(user?.email));
  const [cartBounce, setCartBounce] = useState(false);

  useEffect(() => {
    // Reset ngay khi user thay đổi (login/logout/switch account)
    setCartCount(getCartCount(user?.email));

    const sync = () => {
      const newCount = getCartCount(user?.email);
      setCartCount((prev) => {
        if (newCount > prev) {
          setCartBounce(true);
          setTimeout(() => setCartBounce(false), 600);
        }
        return newCount;
      });
    };
    window.addEventListener('cartUpdate', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('cartUpdate', sync); window.removeEventListener('storage', sync); };
  }, [user?.email]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) =>
    path === '/dashboard'
      ? location.pathname === path || location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(path + '/');

  const linkStyle = (path) => ({
    textDecoration: "none",
    padding: "0.4rem 0.7rem",
    borderRadius: "4px",
    fontSize: "0.85rem",
    fontWeight: isActive(path) ? "700" : "500",
    color: isActive(path) ? "#2563eb" : "#4b5563",
    background: isActive(path) ? "#eff6ff" : "transparent",
    whiteSpace: "nowrap",
    flexShrink: 0,
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      <nav
        style={{
          background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 1rem",
            display: "flex",
            alignItems: "center",
            height: "56px",
            gap: "0.5rem",
          }}
        >
          {/* Logo — cố định bên trái */}
          <Link
            to="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              textDecoration: "none",
              flexShrink: 0,
              marginRight: "0.5rem",
            }}
          >
            <span style={{ fontSize: "1.3rem" }}>🏗️</span>
            <span style={{ fontSize: "1rem", fontWeight: "700", color: "#1f2937" }}>
              Construction Order
            </span>
          </Link>

          {/* Nav links — cuộn ngang nếu tràn, không đẩy user info xuống */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.15rem",
              flex: 1,
              overflowX: "auto",
              scrollbarWidth: "none", // Firefox ẩn scrollbar
            }}
          >
            <Link to="/dashboard" style={linkStyle("/dashboard")}>📊 Dashboard</Link>
            <Link to="/products" style={linkStyle("/products")}>📦 Sản phẩm</Link>
            <Link to="/orders" style={linkStyle("/orders")}>📋 Đơn hàng</Link>

            {/* Cart badge — visible when cart has items */}
            {cartCount > 0 && (
              <button
                onClick={() => navigate('/orders/create')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  background: '#2563eb', color: 'white',
                  border: 'none', borderRadius: '7px',
                  cursor: 'pointer', fontSize: '0.82rem', fontWeight: '700',
                  marginLeft: '0.25rem', flexShrink: 0,
                  animation: cartBounce ? 'cartBounce 0.5s ease' : 'none',
                  transformOrigin: 'center',
                }}
              >
                🛒
                <span style={{
                  background: '#ef4444', color: 'white',
                  borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '800',
                  padding: '0.05rem 0.4rem', lineHeight: 1.4,
                  animation: cartBounce ? 'badgePop 0.5s ease' : 'none',
                  display: 'inline-block',
                }}>
                  {cartCount}
                </span>
                Giỏ hàng
              </button>
            )}
            <style>{`
              @keyframes cartBounce {
                0%   { transform: scale(1); }
                30%  { transform: scale(1.18); }
                60%  { transform: scale(0.92); }
                80%  { transform: scale(1.06); }
                100% { transform: scale(1); }
              }
              @keyframes badgePop {
                0%   { transform: scale(1); }
                40%  { transform: scale(1.5); }
                70%  { transform: scale(0.85); }
                100% { transform: scale(1); }
              }
            `}</style>

            {user?.role === "ADMIN" && (
              <>
                <div style={{ width: "1px", height: "20px", background: "#e5e7eb", margin: "0 0.3rem", flexShrink: 0 }} />
                <Link to="/admin/dashboard" style={linkStyle("/admin/dashboard")}>📊 Admin</Link>
                <Link to="/admin/orders" style={linkStyle("/admin/orders")}>📋 QL Đơn</Link>
                <Link to="/admin/products" style={linkStyle("/admin/products")}>🛠 QL SP</Link>
              </>
            )}
          </div>

          {/* User info — cố định bên phải, không bao giờ wrap */}
          <div style={{ position: "relative", flexShrink: 0, marginLeft: "0.5rem" }}>
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "none",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                padding: "0.3rem 0.6rem",
                cursor: "pointer",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "700",
                  fontSize: "0.8rem",
                  flexShrink: 0,
                }}
              >
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              {/* Email truncated */}
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#374151",
                  maxWidth: "130px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.email}
              </span>
              <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>▼</span>
            </button>

            {/* Dropdown menu */}
            {userMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 6px)",
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  minWidth: "200px",
                  zIndex: 2000,
                  overflow: "hidden",
                }}
              >
                {/* User details */}
                <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>
                    {user?.email}
                  </div>
                  <div
                    style={{
                      display: "inline-block",
                      marginTop: "0.3rem",
                      fontSize: "0.7rem",
                      fontWeight: "600",
                      padding: "0.1rem 0.5rem",
                      borderRadius: "9999px",
                      background: user?.role === "ADMIN" ? "#fef3c7" : "#dbeafe",
                      color: user?.role === "ADMIN" ? "#92400e" : "#1e40af",
                    }}
                  >
                    {user?.role === "ADMIN" ? "Quản trị viên" : "Khách hàng"}
                  </div>
                </div>

                {/* Profile link */}
                <Link
                  to="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: "block",
                    padding: "0.6rem 1rem",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    color: "#374151",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  👤 Hồ sơ cá nhân
                </Link>

                {/* Logout */}
                <button
                  onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.6rem 1rem",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    fontSize: "0.875rem",
                    color: "#dc2626",
                    cursor: "pointer",
                  }}
                >
                  🚪 Đăng xuất
                </button>
              </div>
            )}

            {/* Backdrop để đóng dropdown khi click ngoài */}
            {userMenuOpen && (
              <div
                onClick={() => setUserMenuOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 1999 }}
              />
            )}
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem 1rem" }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;