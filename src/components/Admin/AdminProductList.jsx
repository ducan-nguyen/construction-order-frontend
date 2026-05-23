import React, { useState, useEffect } from 'react';
import { productAPI } from '../../services/api';
import { formatPrice } from '../../utils/orderUtils';
import { getCategoryLabel, getCategoryStyle, getUnitShort } from '../../utils/categoryUtils';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const th = (extra = {}) => ({
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: '700',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  borderBottom: '1px solid #e5e7eb',
  background: '#f9fafb',
  whiteSpace: 'nowrap',
  ...extra,
});

const td = (extra = {}) => ({
  padding: '0.85rem 1rem',
  fontSize: '0.875rem',
  color: '#374151',
  borderBottom: '1px solid #f3f4f6',
  verticalAlign: 'middle',
  ...extra,
});

const TABS = [
  { key: 'ALL',      label: 'Tất cả'       },
  { key: 'ACTIVE',   label: 'Đang bán'     },
  { key: 'INACTIVE', label: 'Ngưng bán'    },
  { key: 'LOWSTOCK', label: 'Sắp hết hàng' },
];

/* ── Inline Confirm Dialog ── */
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
          <h3 style={{ margin: '0 0 0.4rem', fontSize: '1rem', fontWeight: '700', color: '#dc2626' }}>⚠️ {title}</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem 1.5rem' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '0.6rem', background: '#f9fafb', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
            Huỷ bỏ
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '0.6rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.875rem' }}>
            Xác nhận xoá
          </button>
        </div>
      </div>
    </div>
  );
};

const PAGE_SIZE = 15;

const AdminProductList = () => {
  const [products,    setProducts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [toggling,    setToggling]    = useState(null);
  const [activeTab,   setActiveTab]   = useState('ALL');
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(0);
  const [confirmDlg,  setConfirmDlg]  = useState({ open: false });
  const navigate = useNavigate();

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productAPI.adminGetAll(0, 200);
      setProducts(res.data.content || []);
    } catch {
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (p) => {
    setToggling(p.id);
    try {
      await productAPI.toggleActive(p.id);
      toast.success(p.active ? `Đã ngưng bán "${p.name}"` : `Đã mở bán "${p.name}"`);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = (id, name) => {
    setConfirmDlg({
      open: true,
      title: 'Xoá sản phẩm',
      message: `Bạn có chắc muốn xoá sản phẩm "${name}"? Thao tác này không thể hoàn tác.`,
      onConfirm: async () => {
        setConfirmDlg({ open: false });
        try {
          await productAPI.deleteProduct(id);
          toast.success('Xóa thành công');
          fetchProducts();
        } catch (error) {
          toast.error(error.response?.data?.message || 'Xóa thất bại');
        }
      },
    });
  };

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
    const lowStock = p.stockQuantity <= 10;
    const matchTab =
      activeTab === 'ALL'      ? true :
      activeTab === 'ACTIVE'   ? p.active :
      activeTab === 'INACTIVE' ? !p.active :
      activeTab === 'LOWSTOCK' ? (p.active && lowStock) : true;
    return matchSearch && matchTab;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const counts = {
    ALL:      products.length,
    ACTIVE:   products.filter((p) => p.active).length,
    INACTIVE: products.filter((p) => !p.active).length,
    LOWSTOCK: products.filter((p) => p.active && p.stockQuantity <= 10).length,
  };

  return (
    <div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <ConfirmDialog
        open={confirmDlg.open}
        title={confirmDlg.title}
        message={confirmDlg.message}
        onConfirm={confirmDlg.onConfirm}
        onCancel={() => setConfirmDlg({ open: false })}
      />
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#111827' }}>
            Quản lý sản phẩm
          </h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
            {products.length} sản phẩm · {counts.ACTIVE} đang bán · {counts.INACTIVE} ngưng bán
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Tìm sản phẩm..."
            style={{
              padding: '0.45rem 0.85rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.875rem',
              width: '180px',
              outline: 'none',
            }}
          />
          <button
            onClick={() => navigate('/admin/products/create')}
            style={{
              padding: '0.55rem 1.1rem',
              background: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
              color: 'white', border: 'none', borderRadius: '8px',
              fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(0); }}
            style={{
              padding: '0.35rem 0.9rem',
              borderRadius: '8px',
              border: activeTab === tab.key ? '2px solid #2563eb' : '1.5px solid #e5e7eb',
              background: activeTab === tab.key ? '#eff6ff' : 'white',
              color: activeTab === tab.key ? '#2563eb' : '#4b5563',
              fontWeight: activeTab === tab.key ? '700' : '500',
              fontSize: '0.82rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
            <span style={{
              marginLeft: '0.4rem',
              background: activeTab === tab.key ? '#2563eb' : '#e5e7eb',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              padding: '0.05rem 0.45rem',
              fontWeight: '700',
            }}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['ID','Tên sản phẩm','Danh mục','Đơn vị','Giá','Tồn kho','Trạng thái','Thao tác'].map(h => (
                    <th key={h} style={{ ...th(), color: '#d1d5db' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4,5,6,7,8].map(i => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {[30,160,90,50,80,60,80,110].map((w, j) => (
                      <td key={j} style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ width: `${w}px`, height: '14px', borderRadius: '6px', background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', margin: j >= 4 ? '0 auto' : '0' }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
              <div style={{ fontWeight: '600', color: '#6b7280', marginBottom: '0.3rem' }}>Không có sản phẩm nào</div>
              <div style={{ fontSize: '0.82rem' }}>
                {activeTab !== 'ALL' ? 'Thử chuyển sang tab khác hoặc xoá bộ lọc.' : 'Hãy thêm sản phẩm đầu tiên.'}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th({ textAlign: 'center' })}>ID</th>
                  <th style={th()}>Tên sản phẩm</th>
                  <th style={th({ textAlign: 'center' })}>Danh mục</th>
                  <th style={th({ textAlign: 'center' })}>Đơn vị</th>
                  <th style={th({ textAlign: 'center' })}>Giá</th>
                  <th style={th({ textAlign: 'center' })}>Tồn kho</th>
                  <th style={th({ textAlign: 'center' })}>Trạng thái</th>
                  <th style={th({ textAlign: 'center' })}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => {
                  const cs = getCategoryStyle(p.category);
                  const lowStock = p.stockQuantity <= 10;
                  const isToggling = toggling === p.id;
                  return (
                    <tr
                      key={p.id}
                      style={{
                        transition: 'background 0.1s',
                        opacity: p.active ? 1 : 0.65,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={td({ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem' })}>{p.id}</td>

                      <td style={td()}>
                        <div style={{ fontWeight: '600', color: '#111827' }}>{p.name}</div>
                        {p.description && (
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.1rem', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.description}
                          </div>
                        )}
                      </td>

                      <td style={td({ textAlign: 'center' })}>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '700', background: cs.bg, color: cs.color }}>
                          {getCategoryLabel(p.category)}
                        </span>
                      </td>

                      <td style={td({ textAlign: 'center' })}>
                        <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '600' }}>{getUnitShort(p.unit)}</span>
                      </td>

                      <td style={td({ textAlign: 'center' })}>
                        {p.discountPrice && p.discountPrice < p.price ? (
                          <>
                            {/* Giá sale */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                              <span style={{ fontWeight: '800', color: '#e11d48', fontSize: '0.95rem' }}>
                                {formatPrice(p.discountPrice)}
                              </span>
                              <span style={{
                                background: '#fef2f2', color: '#e11d48',
                                border: '1px solid #fecaca',
                                borderRadius: '5px', padding: '0.05rem 0.35rem',
                                fontSize: '0.68rem', fontWeight: '800', lineHeight: 1.4,
                              }}>
                                -{Math.round((1 - p.discountPrice / p.price) * 100)}%
                              </span>
                            </div>
                            {/* Giá gốc gạch ngang */}
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                              {formatPrice(p.price)}
                            </div>
                          </>
                        ) : (
                          <span style={{ fontWeight: '700', color: '#2563eb' }}>
                            {formatPrice(p.price)}
                          </span>
                        )}
                      </td>

                      <td style={td({ textAlign: 'center' })}>
                        <span style={{ fontWeight: '700', color: lowStock ? '#dc2626' : '#15803d' }}>
                          {p.stockQuantity}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '0.2rem' }}>{getUnitShort(p.unit)}</span>
                        {lowStock && p.active && (
                          <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: '600' }}>⚠ Sắp hết</div>
                        )}
                      </td>

                      <td style={td({ textAlign: 'center' })}>
                        {/* Toggle switch */}
                        <button
                          onClick={() => handleToggleActive(p)}
                          disabled={isToggling}
                          title={p.active ? 'Click để ngưng bán' : 'Click để mở bán lại'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.25rem 0.7rem',
                            borderRadius: '9999px',
                            border: 'none',
                            cursor: isToggling ? 'wait' : 'pointer',
                            background: p.active ? '#dcfce7' : '#fee2e2',
                            color: p.active ? '#15803d' : '#dc2626',
                            fontWeight: '700',
                            fontSize: '0.75rem',
                            transition: 'opacity 0.15s',
                            opacity: isToggling ? 0.6 : 1,
                          }}
                        >
                          {isToggling ? '...' : p.active ? '✓ Đang bán' : '✕ Ngưng bán'}
                        </button>
                      </td>

                      <td style={td({ textAlign: 'center' })}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => navigate(`/admin/products/edit/${p.id}`)}
                            style={{
                              padding: '0.3rem 0.8rem', background: '#fef3c7', color: '#92400e',
                              border: '1px solid #fde68a', borderRadius: '6px',
                              cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                            }}
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            style={{
                              padding: '0.3rem 0.8rem', background: '#fee2e2', color: '#dc2626',
                              border: '1px solid #fecaca', borderRadius: '6px',
                              cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                            }}
                          >
                            🗑 Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
            Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} / {filtered.length} sản phẩm
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              style={{ padding: '0.35rem 0.65rem', background: page === 0 ? '#f3f4f6' : 'white', color: page === 0 ? '#d1d5db' : '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: '6px', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: '600' }}
            >«</button>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ padding: '0.35rem 0.75rem', background: page === 0 ? '#f3f4f6' : '#2563eb', color: page === 0 ? '#9ca3af' : 'white', border: 'none', borderRadius: '6px', cursor: page === 0 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.82rem' }}
            >← Trước</button>
            <span style={{ fontSize: '0.82rem', color: '#6b7280', padding: '0 0.5rem', minWidth: '90px', textAlign: 'center' }}>
              Trang {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{ padding: '0.35rem 0.75rem', background: page >= totalPages - 1 ? '#f3f4f6' : '#2563eb', color: page >= totalPages - 1 ? '#9ca3af' : 'white', border: 'none', borderRadius: '6px', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.82rem' }}
            >Sau →</button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              style={{ padding: '0.35rem 0.65rem', background: page >= totalPages - 1 ? '#f3f4f6' : 'white', color: page >= totalPages - 1 ? '#d1d5db' : '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: '6px', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: '600' }}
            >»</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductList;
