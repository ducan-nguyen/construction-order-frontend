export const CATEGORY_LABEL = {
  CEMENT:     'Xi măng',
  STEEL:      'Thép',
  BRICK:      'Gạch',
  SAND:       'Cát',
  STONE:      'Đá',
  PAINT:      'Sơn',
  TILE:       'Gạch lát nền',
  PIPE:       'Ống nước',
  ELECTRICAL: 'Vật liệu điện',
  OTHER:      'Khác',
};

export const CATEGORY_COLOR = {
  CEMENT:     { bg: '#eff6ff', color: '#1d4ed8' },
  STEEL:      { bg: '#f0fdf4', color: '#15803d' },
  BRICK:      { bg: '#fff7ed', color: '#c2410c' },
  SAND:       { bg: '#fefce8', color: '#a16207' },
  STONE:      { bg: '#f5f3ff', color: '#6d28d9' },
  PAINT:      { bg: '#fdf2f8', color: '#86198f' },
  TILE:       { bg: '#ecfdf5', color: '#047857' },
  PIPE:       { bg: '#f0f9ff', color: '#0369a1' },
  ELECTRICAL: { bg: '#fefce8', color: '#b45309' },
  OTHER:      { bg: '#f3f4f6', color: '#374151' },
};

export const CATEGORIES = Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }));

export const getCategoryLabel = (cat) => CATEGORY_LABEL[cat] || cat;
export const getCategoryStyle = (cat) => CATEGORY_COLOR[cat] || { bg: '#f3f4f6', color: '#374151' };

// Tên đầy đủ — dùng trong dropdown
export const UNIT_LABEL = {
  KG:    'Kilôgam (kg)',
  TON:   'Tấn',
  M2:    'Mét vuông (m²)',
  BOX:   'Thùng / Hộp',
  PIECE: 'Cái / Viên',
  LITER: 'Lít',
  BAG:   'Bao',
};

// Tên ngắn — dùng làm suffix sau số lượng (vd: "10 kg", "5 m²")
export const UNIT_SHORT = {
  KG:    'kg',
  TON:   'tấn',
  M2:    'm²',
  BOX:   'thùng',
  PIECE: 'viên',
  LITER: 'lít',
  BAG:   'bao',
};

export const UNITS = Object.entries(UNIT_LABEL).map(([value, label]) => ({ value, label }));

export const getUnitLabel = (unit) => UNIT_LABEL[unit] || unit;
export const getUnitShort = (unit) => UNIT_SHORT[unit] || unit;
