export const STATUS_TEXT = {
  PENDING:          'Chờ thanh toán',
  PAID:             'Đã thanh toán',
  PROCESSING:       'Đang xử lý',
  SHIPPING:         'Đang giao hàng',
  COMPLETED:        'Hoàn thành',
  CANCELLED:        'Đã hủy',
  REFUND_REQUESTED: 'Yêu cầu hoàn tiền',
  REFUNDED:         'Đã hoàn tiền',
};

export const STATUS_COLOR = {
  PENDING:          '#f59e0b',
  PAID:             '#10b981',
  PROCESSING:       '#3b82f6',
  SHIPPING:         '#8b5cf6',
  COMPLETED:        '#059669',
  CANCELLED:        '#ef4444',
  REFUND_REQUESTED: '#f97316',
  REFUNDED:         '#6b7280',
};

export const getStatusText = (status) => STATUS_TEXT[status] || status;

export const getStatusColor = (status) => STATUS_COLOR[status] || '#6b7280';

export const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
