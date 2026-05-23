import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { getStatusText, formatPrice } from '../../utils/orderUtils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#059669', '#ef4444'];

/* Wrap long product names over 2 lines in the horizontal bar chart */
const WrappedYTick = ({ x, y, payload }) => {
  const text = payload.value || '';
  const maxChars = 16;
  let line1 = text, line2 = '';
  if (text.length > maxChars) {
    const breakAt = text.lastIndexOf(' ', maxChars);
    const split = breakAt > 0 ? breakAt : maxChars;
    line1 = text.slice(0, split);
    line2 = text.slice(split).trim();
    if (line2.length > maxChars) line2 = line2.slice(0, maxChars - 1) + '…';
  }
  return (
    <text x={x} y={y} textAnchor="end" fill="#374151" fontSize={12}>
      <tspan x={x} dy={line2 ? '-0.35em' : '0.35em'}>{line1}</tspan>
      {line2 && <tspan x={x} dy="1.3em">{line2}</tspan>}
    </text>
  );
};

const RANGES = [
  { key: '1m',  label: '1 tháng',  months: 1  },
  { key: '6m',  label: '6 tháng',  months: 6  },
  { key: '1y',  label: '1 năm',    months: 12 },
];

const card = {
  background: 'white',
  padding: '1.25rem',
  borderRadius: '12px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
};

/* Custom tooltip */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem 1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.85rem' }}>
      <div style={{ fontWeight: '700', color: '#111827', marginBottom: '0.4rem' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: '#6b7280' }}>{p.name}:</span>
          <span style={{ fontWeight: '700', color: '#111827' }}>
            {p.name === 'Doanh thu' ? formatPrice(p.value) : `${p.value} đơn`}
          </span>
        </div>
      ))}
    </div>
  );
};

const AdminDashboard = () => {
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [chartRange, setChartRange] = useState('6m');
  const [allChartData, setAllChartData] = useState([]); // toàn bộ dữ liệu, slice client-side

  useEffect(() => { fetchDashboardStats(); }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      setStats(response.data);
      setAllChartData(response.data.revenueChart || []);
    } catch {
      toast.error('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  // Slice client-side — không gọi thêm API
  const getChartData = (rangeKey) => {
    switch (rangeKey) {
      case '1m': return allChartData.slice(-1);
      case '6m': return allChartData.slice(-6);
      case '1y': return allChartData; // toàn bộ dữ liệu backend trả về
      default:   return allChartData.slice(-6);
    }
  };

  const handleRangeChange = (key) => setChartRange(key);

  const yAxisRevenueFmt = (v) => {
    if (v === 0) return '0';
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(0)}M`;
    if (v >= 1_000)         return `${(v / 1_000).toFixed(0)}K`;
    return v;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>⏳ Đang tải dữ liệu...</div>;
  }
  if (!stats) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Không có dữ liệu</div>;
  }

  const orderStatusData = (stats.orderStatusStats || []).map((item) => ({
    name: getStatusText(item.status),
    value: item.count,
  }));

  const activeRange = RANGES.find((r) => r.key === chartRange);
  const chartData   = getChartData(chartRange);

  const chartRevenue = chartData.reduce((s, d) => s + (d.revenue || 0), 0);
  const chartOrders  = chartData.reduce((s, d) => s + (d.orders  || 0), 0);

  return (
    <div style={{ padding: '0.5rem' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem', color: '#111827' }}>
        📊 Dashboard Quản trị
      </h1>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Tổng doanh thu',    value: formatPrice(stats.totalRevenue), color: '#059669', icon: '💰' },
          { label: 'Đơn hàng',          value: stats.totalOrders,               color: '#2563eb', icon: '📋' },
          { label: 'Khách hàng',        value: stats.totalCustomers,            color: '#7c3aed', icon: '👥' },
          { label: 'Sản phẩm tồn thấp', value: stats.lowStockProducts,         color: '#dc2626', icon: '⚠️' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>{icon}</span>
              <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '600' }}>{label}</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Biểu đồ doanh thu với bộ lọc thời gian ── */}
      <div style={{ ...card, marginBottom: '1.5rem' }}>

        {/* Chart header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#111827' }}>
              📈 Doanh thu & Đơn hàng
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
              {activeRange?.label} gần nhất — {chartData.length} mốc dữ liệu
            </p>
          </div>

          {/* Range tabs */}
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '3px', gap: '2px' }}>
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => handleRangeChange(r.key)}
                style={{
                  padding: '0.35rem 0.9rem',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  transition: 'all 0.15s',
                  background: chartRange === r.key ? 'white'     : 'transparent',
                  color:      chartRange === r.key ? '#2563eb'   : '#6b7280',
                  boxShadow:  chartRange === r.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mini KPI dựa theo range */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ padding: '0.6rem 1rem', background: '#eff6ff', borderRadius: '8px', flex: 1, minWidth: '140px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Doanh thu ({activeRange?.label})
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1d4ed8', marginTop: '0.2rem' }}>
              {formatPrice(chartRevenue)}
            </div>
          </div>
          <div style={{ padding: '0.6rem 1rem', background: '#f0fdf4', borderRadius: '8px', flex: 1, minWidth: '140px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Số đơn ({activeRange?.label})
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#059669', marginTop: '0.2rem' }}>
              {chartOrders} đơn
            </div>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
            <YAxis yAxisId="revenue" orientation="left" tickFormatter={yAxisRevenueFmt} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52} />
            <YAxis yAxisId="orders" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={32} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.82rem', paddingTop: '0.5rem' }} iconType="circle" iconSize={8} />
            <Line yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#6366f1', stroke: 'white', strokeWidth: 2 }} name="Doanh thu" />
            <Line yAxisId="orders"  type="monotone" dataKey="orders"  stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#10b981', stroke: 'white', strokeWidth: 2 }} name="Số đơn" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top sản phẩm + Phân bố trạng thái */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div style={card}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
            Top sản phẩm bán chạy
          </h2>
          {stats.topProducts?.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={Math.max(160, (stats.topProducts?.length ?? 0) * 60 + 40)}
            >
              <BarChart
                layout="vertical"
                data={stats.topProducts}
                margin={{ top: 4, right: 52, left: 8, bottom: 4 }}
                barSize={28}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="productName"
                  width={140}
                  tick={<WrappedYTick />}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [value, 'Số lượng bán']}
                  contentStyle={{ fontSize: '0.82rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="quantitySold" fill="#10b981" radius={[0, 5, 5, 0]} name="Số lượng bán"
                  label={{ position: 'right', fontSize: 11, fill: '#6b7280' }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
              Chưa có dữ liệu
            </div>
          )}
        </div>

        <div style={card}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
            Phân bố đơn hàng theo trạng thái
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Pie chart — no labels */}
            <div style={{ flex: '0 0 200px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%" cy="50%"
                    innerRadius={48}
                    outerRadius={88}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                  >
                    {orderStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value + ' đơn', name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend list */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(() => {
                const total = orderStatusData.reduce((s, d) => s + d.value, 0);
                return orderStatusData.map((item, index) => {
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '11px', height: '11px', borderRadius: '3px', background: COLORS[index % COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: '0.82rem', color: '#4b5563', flex: 1 }}>{item.name}</span>
                      <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#111827' }}>{item.value}</span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', minWidth: '34px', textAlign: 'right' }}>{pct}%</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Refresh */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={fetchDashboardStats}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '0.6rem 1.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          🔄 Làm mới dữ liệu
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;