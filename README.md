# 🛒 Building Material Order System — Frontend

> React SPA frontend for a construction materials order management platform. Features JWT authentication, shopping cart, multi-payment checkout, order tracking, and an admin analytics dashboard.

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg)](https://vitejs.dev/)
[![Redux](https://img.shields.io/badge/Redux%20Toolkit-2.x-764ABC.svg)](https://redux-toolkit.js.org/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black.svg)](https://construction-order-frontend.vercel.app)

🔗 **Backend repo:** [construction-order-backend](https://github.com/ducan-nguyen/construction-order-backend)  
🌐 **Live demo:** [construction-order-frontend.vercel.app](https://construction-order-frontend.vercel.app)

---

## 📌 Overview

The frontend SPA for a full-stack order management system for construction materials suppliers. Supports two user roles with separate flows and dashboards.

| Role | Access |
|---|---|
| **CUSTOMER** | Browse products, place orders, track status, request refunds |
| **ADMIN** | Manage products, process orders, approve refunds, view analytics |

---

## ✨ Features

### Customer
- Product catalog with search & filter
- Shopping cart with quantity management
- Checkout with multiple payment methods
- Order history & real-time status tracking
- Refund request workflow

### Admin
- Order management dashboard with status updates
- Product CRUD (create, edit, delete)
- Refund approval workflow
- Analytics dashboard with charts (Recharts)

### Auth & Security
- JWT authentication with automatic token refresh
- Protected routing — role-based page access
- Axios interceptors for token injection & expiry handling

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| Redux Toolkit | Global state management |
| React Router DOM | Client-side routing |
| Axios | HTTP client + interceptors |
| React Hook Form | Form validation |
| Recharts | Analytics charts |
| Bootstrap 5 | UI styling |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Backend API running (see [construction-order-backend](https://github.com/ducan-nguyen/construction-order-backend))

### Installation

```bash
# Clone repository
git clone https://github.com/ducan-nguyen/construction-order-frontend.git
cd construction-order-frontend

# Install dependencies
npm install

# Configure API URL
# Create .env.local and set:
# VITE_API_BASE_URL=http://localhost:8080

# Start dev server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/            # Route-level page components
│   ├── admin/        # Admin dashboard pages
│   └── customer/     # Customer-facing pages
├── store/            # Redux Toolkit slices & store
├── services/         # Axios API service functions
├── hooks/            # Custom React hooks
├── utils/            # Helper functions
└── routes/           # Protected route configuration
```

---

## ☁️ Deployment

Deployed on **Vercel** with automatic builds on push to `main`.

🌐 [construction-order-frontend.vercel.app](https://construction-order-frontend.vercel.app)

---

## 👤 Author

**Nguyen Duc An**  
[![LinkedIn](https://img.shields.io/badge/LinkedIn-ducan--nguyen9801-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/in/ducan-nguyen9801)
[![GitHub](https://img.shields.io/badge/GitHub-ducan--nguyen-181717?style=flat&logo=github)](https://github.com/ducan-nguyen)
