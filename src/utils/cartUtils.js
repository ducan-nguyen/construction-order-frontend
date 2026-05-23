const getCartKey = (email) => `construction_cart_${email}`;

// Chỉ load cart khi có email hợp lệ (tránh đọc/ghi nhầm vào guest key)
export const loadCart = (email) => {
  if (!email) return [];
  try { return JSON.parse(localStorage.getItem(getCartKey(email))) || []; } catch { return []; }
};

export const saveCart = (email, cart) => {
  if (!email) return; // Không lưu nếu chưa đăng nhập
  localStorage.setItem(getCartKey(email), JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdate'));
};

export const clearCart = (email) => {
  if (!email) return;
  localStorage.removeItem(getCartKey(email));
  window.dispatchEvent(new Event('cartUpdate'));
};

export const getCartCount = (email) => loadCart(email).length;
