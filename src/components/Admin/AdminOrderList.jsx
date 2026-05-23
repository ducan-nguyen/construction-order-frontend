import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getStatusText, getStatusColor, formatPrice, formatDate, STATUS_TEXT } from '../../utils/orderUtils';

const TABS = [
  { key: 'ALL',              label: 'Tất cả' },
  { key: 'PENDING',          label: 'Chờ TT' },
  { key: 'PAID',             label: 'Đã TT' },
  { key: 'PROCESSING',       label: 'Xử lý' },
  { key: 'SHIPPING',         label: 'Giao hàng' },
  { key: 'COMPLETED',        label: 'Hoàn thành' },
  { key: 'REFUND_REQUESTED', label: '🔄 Hoàn tiền' },
  { key: 'REFUNDED',         label: 'Đã hoàn' },
  { key: 'CANCELLED',        label: 'Đã hủy' },
];

const StatusBadge = ({ status }) => (
  <span style={{
    padding: '0.2rem 0.65rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '600',
    background: `${getStatusColor(status)}18`,
    color: getStatusColor(status),
    whiteSpace: 'nowrap',
  }}>
    {getStatusText(status)}
  </span>
);

const AdminOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, [page, activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getAllOrders(page, 15);
      setOrders(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch {
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      toast.success(`Đã chuyển sang: ${STATUS_TEXT[newStatus]}`);
      fetchOrders();
    } catch {
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  const handleApproveRefund = async (orderId) => {
    if (!window.confirm('Xác nhận duyệt hoàn tiền cho đơn này?')) return;
    try {
      await orderAPI.approveRefund(orderId);
      toast.success('Đã duyệt hoàn tiền');
      fetchOrders();
    } catch { toast.error('Duyệt hoàn tiền thất bại'); }
  };

  const handleRejectRefund = async (orderId) => {
    if (!window.confirm('Từ chối yêu cầu hoàn tiền? Đơn sẽ quay lại trạng thái "Đã thanh toán".')) return;
    try {
      await orderAPI.rejectRefund(orderId);
      toast.success('Đã từ chối yêu cầu hoàn tiền');
      fetchOrders();
    } catch { toast.error('Thao tác thất bại'); }
  };

  const filteredOrders = orders.filter((o) => {
    const matchTab = activeTab === 'ALL' || o.status === activeTab;
    const q = search.trim().toLowerCase();
    const matchSearch = !q ||
      o.orderCode?.toLowerCase().includes(q) ||
      (o.customer?.user?.fullName || o.user?.fullName || '').toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0, color: '#111827' }}>Quản lý đơn hàng</h1>
          {!loading && (
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
              Tổng cộng {totalElements} đơn hàng
            </p>
          )}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm mã đơn, khách hàng..."
          style={{
            padding: '0.45rem 0.85rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '0.875rem',
            width: '220px',
            outline: 'none',
          }}
        />
      </div>

      {/* Status tabs */}
      <div style={{
        display: 'flex',
        gap: '0.35rem',
        marginBottom: '1rem',
        overflowX: 'auto',
        paddingBottom: '2px',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(0); }}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '8px',
              border: activeTab === tab.key ? '2px solid #2563eb' : '1.5px solid #e5e7eb',
              background: activeTab === tab.key ? '#eff6ff' : 'white',
              color: activeTab === tab.key ? '#2563eb' : '#4b5563',
              fontWeight: activeTab === tab.key ? '700' : '500',
              fontSize: '0.82rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflowX: 'auto' }}>
        {loading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Mã đơn', 'Khách hàng', 'Ngày đặt', 'Tổng tiền', 'Trạng thái', 'Thao tác'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: '600', color: '#d1d5db', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5,6,7].map((i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {[110,130,100,80,70,90].map((w, j) => (
                    <td key={j} style={{ padding: '0.8rem 1rem' }}>
                      <div style={{ width: `${w}px`, height: '14px', borderRadius: '6px', background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', margin: j >= 3 ? '0 auto' : '0' }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
            <div style={{ fontWeight: '600', color: '#6b7280', marginBottom: '0.3rem' }}>
              Không có đơn hàng nào
            </div>
            <div style={{ fontSize: '0.82rem' }}>
              {activeTab !== 'ALL' ? `Không có đơn ở trạng thái "${STATUS_TEXT[activeTab]}"` : 'Hệ thống chưa có đơn hàng nào.'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Mã đơn', 'Khách hàng', 'Ngày đặt', 'Tổng tiền', 'Trạng thái', 'Thao tác'].map((h) => (
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
              {filteredOrders.map((order, idx) => {
                const isRefundPending = order.status === 'REFUND_REQUESTED';
                return (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: idx < filteredOrders.length - 1 ? '1px solid #f3f4f6' : 'none',
                      transition: 'background 0.1s',
                      cursor: 'pointer',
                      background: isRefundPending ? '#fff7ed' : 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = isRefundPending ? '#ffedd5' : '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = isRefundPending ? '#fff7ed' : 'transparent'}
                  >
                    <td style={{ padding: '0.8rem 1rem', fontWeight: '600', color: '#1e40af', fontSize: '0.88rem' }}>
                      {order.orderCode}
                      {isRefundPending && (
                        <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', fontWeight: '700', background: '#fed7aa', color: '#c2410c', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>
                          Chờ duyệt HT
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.8rem 1rem', fontSize: '0.88rem', color: '#374151' }}>
                      {order.customer?.user?.fullName || order.user?.fullName || 'N/A'}
                    </td>
                    <td style={{ padding: '0.8rem 1rem', fontSize: '0.82rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {formatDate(order.orderDate)}
                    </td>
                    <td style={{ padding: '0.8rem 1rem', textAlign: 'right', fontWeight: '700', color: '#111827', whiteSpace: 'nowrap' }}>
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td style={{ padding: '0.8rem 1rem', textAlign: 'center' }}>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={{ padding: '0.8rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => navigate(`/orders/${order.id}`)}
                          style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                        >
                          Chi tiết
                        </button>
                        {order.status === 'PENDING' && (
                          <button onClick={() => updateStatus(order.id, 'PROCESSING')} style={{ background: '#059669', color: 'white', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                            Xác nhận
                          </button>
                        )}
                        {order.status === 'PROCESSING' && (
                          <button onClick={() => updateStatus(order.id, 'SHIPPING')} style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                            Giao hàng
                          </button>
                        )}
                        {order.status === 'SHIPPING' && (
                          <button onClick={() => updateStatus(order.id, 'COMPLETED')} style={{ background: '#047857', color: 'white', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                            Hoàn thành
                          </button>
                        )}
                        {isRefundPending && (
                          <>
                            <button
                              onClick={() => handleApproveRefund(order.id)}
                              style={{ background: '#059669', color: 'white', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}
                            >
                              ✅ Duyệt HT
                            </button>
                            <button
                              onClick={() => handleRejectRefund(order.id)}
                              style={{ background: 'white', color: '#dc2626', border: '1.5px solid #fca5a5', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                            >
                              ✕ Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            style={{ padding: '0.4rem 0.9rem', background: page === 0 ? '#f3f4f6' : '#2563eb', color: page === 0 ? '#9ca3af' : 'white', border: 'none', borderRadius: '7px', cursor: page === 0 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
          >
            ← Trước
          </button>
          <span style={{ fontSize: '0.85rem', color: '#6b7280', minWidth: '100px', textAlign: 'center' }}>
            Trang {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            style={{ padding: '0.4rem 0.9rem', background: page >= totalPages - 1 ? '#f3f4f6' : '#2563eb', color: page >= totalPages - 1 ? '#9ca3af' : 'white', border: 'none', borderRadius: '7px', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminOrderList;
