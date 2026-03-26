# startup-crm

A modern, full-stack **Customer Relationship Management (CRM)** web application built for startups. Manage your leads, deals pipeline, and key business metrics from a single, clean dashboard.

---

## ✨ Features

- 🔐 **Authentication** — JWT-based login & signup with protected routes
- 📊 **Dashboard** — Real-time KPI cards (total leads, active deals, pipeline value, conversion rate)
- 👥 **Leads Management** — Add, edit, delete, filter, and search leads with status tracking
- 💼 **Deals Pipeline** — Drag-and-drop Kanban board to manage deal stages (New → Won/Lost)
- 📈 **Analytics** — Basic pipeline and revenue analytics
- 🌐 **Real-time** — Socket.io integration for live updates
- 📱 **Responsive UI** — Mobile-friendly layout with sidebar navigation

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + Vite 8 | UI framework & build tool |
| React Router v7 | Client-side routing |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations |
| Lucide React | Icons |
| @hello-pangea/dnd | Drag-and-drop (Kanban board) |
| Axios | HTTP client |
| Socket.io-client | Real-time communication |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose | Database & ODM |
| JWT (jsonwebtoken) | Authentication |
| bcryptjs | Password hashing |
| Socket.io | WebSocket server |
| dotenv | Environment config |

---

## 📁 Project Structure

```
startup-crm/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/               # Route handler logic
│   ├── middleware/                # Auth middleware (JWT guard)
│   ├── models/
│   │   ├── User.js
│   │   ├── Lead.js
│   │   ├── Deal.js
│   │   ├── Activity.js
│   │   ├── DealActivity.js
│   │   ├── Conversation.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── authRoutes.js          # POST /api/auth/register, /login
│   │   ├── dashboardRoutes.js     # GET /api/dashboard/stats
│   │   ├── leadRoutes.js          # CRUD /api/leads
│   │   ├── dealRoutes.js          # CRUD /api/deals
│   │   └── analyticsRoutes.js    # GET /api/analytics/*
│   ├── services/                  # Business logic / external services
│   ├── server.js                  # Express + Socket.io entry point
│   ├── .env                       # Environment variables (not committed)
│   └── package.json
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   └── Layout.jsx         # Sidebar + top nav wrapper
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx      # KPI cards + stats overview
    │   │   ├── Leads.jsx          # Full leads management table
    │   │   ├── Deals.jsx          # Kanban pipeline board
    │   │   └── Analytics.jsx      # Charts & metrics page
    │   ├── services/
    │   │   └── api.js             # Axios instance + API helpers
    │   ├── App.jsx                # Routes + ProtectedRoute guard
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or local MongoDB)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/startup-crm.git
cd startup-crm
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Start the backend server:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The API will be running at `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Start the frontend dev server:

```bash
npm run dev
```

The app will be running at `http://localhost:5173`

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Fetch KPI statistics |

### Leads
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/leads` | Get all leads |
| POST | `/api/leads` | Create a new lead |
| PUT | `/api/leads/:id` | Update a lead |
| DELETE | `/api/leads/:id` | Delete a lead |

### Deals
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/deals` | Get all deals |
| POST | `/api/deals` | Create a new deal |
| PUT | `/api/deals/:id` | Update a deal (stage, value, etc.) |
| DELETE | `/api/deals/:id` | Delete a deal |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/pipeline` | Pipeline breakdown by stage |
| GET | `/api/analytics/revenue` | Revenue and conversion data |

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `MONGO_URI` | ✅ Yes | MongoDB connection string |
| `JWT_SECRET` | ✅ Yes | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `CLIENT_URL` | No | Frontend origin for CORS (default: `http://localhost:5173`) |

---

## 🚀 Build for Production

```bash
# Build frontend static files
cd frontend
npm run build
```

The production-ready files will be in `frontend/dist/`.

---

## 📄 License

MIT License — feel free to use this project as a starting point for your own CRM.
