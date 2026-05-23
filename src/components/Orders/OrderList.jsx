import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getStatusText, getStatusColor, formatPrice, formatDate } from '../../utils/orderUtils';

/* ── Skeleton row ── */
const SkRow = () => (
  <tr>
    {[120, 100, 90, 70, 60].map((w, i) => (
      <td key={i} style={{ padding: '0.9rem 1rem' }}>
        <div style={{
          width: `${w}px`, height: '14px', borderRadius: '6px',
          background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',
          backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
          margin: i === 2 || i === 3 || i === 4 ? '0 auto' : '0 0 0 auto',
        }} />
      </td>
    ))}
  </tr>
);

const StatusBadge = ({ status }) => (
  <span style={{
    padding: '0.25rem 0.7rem',
    borderRadius: '9999px',
    fontSize: '0.78rem',
    fontWeight: '700',
    background: `${getStatusColor(status)}18`,
    color: getStatusColor(status),
    whiteSpace: 'nowrap',
  }}>
    {getStatusText(status)}
  </span>
);

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getUserOrders(page, 10);
      setOrders(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalElements(response.data.totalElements || 0);
    } catch {
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0, color: '#111827' }}>Đơn hàng của tôi</h1>
          {!loading && totalElements > 0 && (
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
              {totalElements} đơn hàng
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/orders/create')}
          style={{
            padding: '0.5rem 1.1rem',
            background: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          ➕ Tạo đơn hàng
        </button>
      </div>

      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {loading ? (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Mã đơn hàng', 'Ngày đặt', 'Tổng tiền', 'Trạng thái', 'Thao tác'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: '600', color: '#d1d5db', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5].map((i) => <SkRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : orders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', margin: '0 0 0.5rem' }}>
            Bạn chưa có đơn hàng nào
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1.5rem' }}>
            Đặt mua vật liệu xây dựng ngay hôm nay
          </p>
          <button
            onClick={() => navigate('/orders/create')}
            style={{
              padding: '0.6rem 1.5rem',
              background: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.9rem',
            }}
          >
            ➕ Tạo đơn hàng đầu tiên
          </button>
        </div>
      ) : (
        <>
          {/* Table */}
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Mã đơn hàng', 'Ngày đặt', 'Tổng tiền', 'Trạng thái', 'Thao tác'].map((h) => (
                    <th key={h} style={{
                      padding: '0.75rem 1rem',
                      textAlign: h === 'Tổng tiền' ? 'right' : h === 'Trạng thái' || h === 'Thao tác' ? 'center' : 'left',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    style={{
                      borderBottom: idx < orders.length - 1 ? '1px solid #f3f4f6' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.9rem 1rem', fontWeight: '700', color: '#1e40af', fontSize: '0.88rem' }}>
                      {order.orderCode}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {formatDate(order.orderDate)}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: '700', color: '#111827', whiteSpace: 'nowrap' }}>
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}
                        style={{
                          padding: '0.3rem 0.85rem',
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                        }}
                      >
                        Chi tiết →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                style={{ padding: '0.4rem 0.9rem', background: page === 0 ? '#f3f4f6' : '#2563eb', color: page === 0 ? '#9ca3af' : 'white', border: 'none', borderRadius: '7px', cursor: page === 0 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
              >
                ← Trước
              </button>
              <span style={{ fontSize: '0.85rem', color: '#6b7280', minWidth: '100px', textAlign: 'center' }}>
                Trang {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                style={{ padding: '0.4rem 0.9rem', background: page >= totalPages - 1 ? '#f3f4f6' : '#2563eb', color: page >= totalPages - 1 ? '#9ca3af' : 'white', border: 'none', borderRadius: '7px', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderList;
