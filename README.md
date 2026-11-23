# Smart Restaurant & Café POS + Live Kitchen Display System Backend API

Production-ready RESTful backend API for a Smart Restaurant & Café Point-of-Sale (POS) and Live Kitchen Display System (KDS), built with Node.js, Express.js (ES Modules), Supabase PostgreSQL, and strict Role-Based Access Control (RBAC).

---

## 1. Project Overview
This system powers high-volume restaurant and café operations with:
- **Server-Side Financial Accuracy**: Prices, variants, add-ons, discounts, and 15% VAT are computed strictly server-side from PostgreSQL.
- **Atomic Table Management**: Dine-in orders atomically reserve dining tables; bill settlement automatically releases tables back to available.
- **Live Kitchen Display System (KDS)**: Chronologically sorted active orders with real-time `seconds_elapsed` tracking and strict state transitions (`new` → `preparing` → `ready` → `completed`).
- **Role-Based Access Control (RBAC)**: Enforced separation between `manager`, `cashier`, and `kitchen` staff.
- **Self-Contained Automated Testing**: 100% passing automated test suite with Vitest and Supertest covering all lifecycle and security requirements.

---

## 2. Technology Stack
- **Backend Runtime**: Node.js v24+
- **Web Framework**: Express.js (ES Modules)
- **Database**: Supabase PostgreSQL with custom PL/pgSQL RPC transactional functions
- **Authentication**: Supabase Auth + JWT Bearer Verification + RBAC
- **Schema Validation**: Zod
- **Testing**: Vitest, Supertest, @vitest/coverage-v8
- **API Documentation**: Swagger / OpenAPI 3.0 via Swagger UI Express
- **Code Quality**: ESLint

---

## 3. Architecture & Folder Structure

```
smart-restaurant-pos/
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules (protects secrets)
├── eslint.config.js          # ESLint configuration
├── package.json              # Dependencies and execution scripts
├── README.md                 # Complete system documentation
├── vitest.config.js          # Vitest testing configuration
│
├── docs/                     # In-depth architectural & API specifications
│   ├── api-documentation.md  # Detailed API endpoint reference
│   ├── architecture.md       # Layered architecture and flow diagrams
│   └── database-schema.md    # Database ERD and RPC documentation
│
├── src/
│   ├── app.js                # Express app setup, CORS, and routing
│   ├── server.js             # HTTP server entry point
│   │
│   ├── config/
│   │   ├── env.js            # Strict Zod environment variable parsing
│   │   ├── supabase.js       # Supabase Admin and Anon client initialization
│   │   └── swagger.js        # OpenAPI 3.0 specification and Swagger UI mount
│   │
│   ├── middleware/
│   │   ├── authenticate.js   # Bearer JWT verification and user identity extraction
│   │   ├── authorize.js      # Role-based access control (RBAC) guard
│   │   ├── errorHandler.js   # Centralized error handler with standard JSON envelope
│   │   ├── notFound.js       # 404 route handler
│   │   └── validate.js       # Zod request validation middleware
│   │
│   ├── modules/
│   │   ├── auth/             # Login and profile identity endpoints
│   │   ├── categories/       # Food & beverage category management
│   │   ├── menu/             # Menu items, variants, add-ons, availability
│   │   ├── tables/           # Dining tables layout and occupancy status
│   │   ├── orders/           # Order creation, server pricing, table reservation
│   │   ├── kds/              # Kitchen display system with seconds_elapsed
│   │   ├── payments/         # Payment settlement and table release
│   │   └── reports/          # Sales analytics and top 5 best sellers
│   │
│   ├── routes/
│   │   └── index.js          # Main API route aggregator mounted on /api
│   │
│   ├── store/
│   │   └── inMemoryStore.js  # Resilient offline/test data store matching seed.sql
│   │
│   └── utils/
│       └── response.js       # Standardized API response helpers and AppError
│
├── supabase/
│   ├── migrations/
│   │   ├── 20240101000000_init_schema.sql    # 7 tables, constraints, indexes
│   │   └── 20240101000001_rpc_functions.sql  # PL/pgSQL atomic RPC functions
│   └── seed.sql                              # Realistic restaurant seed data
│
└── tests/
    └── integration/
        ├── auth.test.js      # Auth & RBAC test suite
        ├── kds.test.js       # KDS queue and state transition tests
        ├── menu.test.js      # Menu retrieval, filtering, creation tests
        ├── orders.test.js    # Order calculations and table reservation tests
        ├── payments.test.js  # Payment settlement and table release tests
        ├── reports.test.js   # Sales reports and lifecycle integration tests
        └── tables.test.js    # Dining tables management tests
```

---

## 4. Database Schema & RPC Functions
The database schema consists of **7 relational tables**:
1. `users`: System accounts tied to Supabase Auth identities (`manager`, `cashier`, `kitchen`).
2. `categories`: Food and beverage groupings.
3. `menu_items`: Menu catalog with JSONB variants and add-ons.
4. `dining_tables`: Layout tables with status (`available`, `occupied`, `billing_pending`).
5. `orders`: Orders with computed `subtotal`, `discount`, `tax` (15%), `grand_total`.
6. `order_items`: Line items preserving historical snapshot prices.
7. `payments`: Payment records (`cash`, `card`, `online`) linked uniquely to orders.

### Transactional PostgreSQL Functions
- `create_order_atomic`: Atomically verifies table availability with row locks, fetches real menu prices, validates variants/add-ons, calculates taxes, inserts order and line items, and marks table as `occupied`.
- `settle_payment_atomic`: Atomically validates payment amount against grand total, inserts payment, marks order as `completed`, and releases dining table to `available`.
- `update_order_status_atomic`: Enforces valid state transitions (`new` → `preparing` → `ready` → `completed`).
- `get_sales_report_summary`: Generates revenue analytics and top 5 best sellers.

---

## 5. Role-Based Access Control (RBAC)

| Feature / Action | Route | Allowed Roles |
| :--- | :--- | :--- |
| User Login | `POST /api/auth/login` | Public |
| Current Profile | `GET /api/auth/me` | Authenticated |
| List Categories | `GET /api/categories` | Public / Authenticated |
| Create Category | `POST /api/categories` | `manager` |
| View Menu | `GET /api/menu` | Public / Authenticated |
| Create Menu Item | `POST /api/menu` | `manager` |
| Update Availability | `PATCH /api/menu/:id/availability` | `manager` |
| View Dining Tables | `GET /api/tables` | Authenticated |
| Update Table Status | `PATCH /api/tables/:id/status` | `manager`, `cashier` |
| Create Orders | `POST /api/orders` | `manager`, `cashier` |
| View Orders | `GET /api/orders` | Authenticated |
| KDS Active Queue | `GET /api/kds/orders` | `kitchen`, `cashier`, `manager` |
| Update Order Status | `PATCH /api/orders/:id/status` | `kitchen`, `cashier`, `manager` |
| Settle Bill | `POST /api/orders/:id/settle` | `cashier`, `manager` |
| View Sales Summary | `GET /api/reports/summary` | `manager` |

---

## 6. Installation & Configuration

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Step 1: Clone and Install
```bash
git clone <repository-url>
cd second
npm install
```

### Step 2: Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure your `.env` contains:
```env
PORT=5000
NODE_ENV=development

# Supabase Configuration
# Replace with your project URL if different
SUPABASE_URL=https://smart-restaurant-pos.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_key

# Security
JWT_SECRET=super_secure_jwt_secret_change_in_production_pos_key_2026
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
DEFAULT_TAX_RATE=0.15
RESTAURANT_NAME="Smart Restaurant & Café POS"
```

> **Security Note**: Never commit `.env` to Git. The `.gitignore` file is preconfigured to prevent secret leaks.

---

## 7. Supabase Database Setup & Seed

### Applying Migrations
1. Open your Supabase Dashboard at [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** for project `smart-restaurant-pos`.
3. Run the schema migration:
   - Copy contents of `supabase/migrations/20240101000000_init_schema.sql` and execute.
4. Run the RPC functions migration:
   - Copy contents of `supabase/migrations/20240101000001_rpc_functions.sql` and execute.
5. Populate realistic seed data:
   - Copy contents of `supabase/seed.sql` and execute.

### Demo Accounts for Testing & Development

| Role | Email | Password | Pre-seeded ID |
| :--- | :--- | :--- | :--- |
| **Manager** | `manager@restaurant.pos` | `manager123` | `11111111-1111-1111-1111-111111111111` |
| **Cashier** | `cashier@restaurant.pos` | `cashier123` | `22222222-2222-2222-2222-222222222222` |
| **Kitchen** | `kitchen@restaurant.pos` | `kitchen123` | `33333333-3333-3333-3333-333333333333` |

---

## 8. Running the Application

### Start Development Server
```bash
npm run dev
```

### Start Production Server
```bash
npm start
```

### Accessing Swagger Documentation
Open your browser at:
`http://localhost:5000/api-docs`

---

## 9. Testing & Quality Assurance

Run the automated test suite:
```bash
npm test
```

Run test suite with coverage report:
```bash
npm run test:coverage
```

Run ESLint check:
```bash
npm run lint
```

### Test Results Summary
- **Total Test Suites**: 7 test files
- **Total Tests**: 34 automated integration tests
- **Passing**: 34/34 (100% pass rate)
- **Statement Coverage**: >83% across all modules

---

## 10. Developer & Author / المطوّرة والمالكة

<div align="center">

  <img
    src="assets/branding/khawlah-signature-animated.gif"
    alt="Khawlah Al-Hebshi — Developer Signature"
    width="720"
  />

  <br/>

  <img src="https://readme-typing-svg.demolab.com?font=Georgia&weight=500&size=20&duration=2800&pause=900&color=9A3158&center=true&vCenter=true&width=650&lines=Backend+Developer+%7C+Next.js;Flutter+Developer;AI-Assisted+Development+%26+Vibe+Coding;Building+Thoughtful+Digital+Products" alt="Khawlah Al-Hebshi — Professional Positioning" />

  <br/><br/>

  <a href="https://github.com/khowlah">
    <img src="https://img.shields.io/badge/GitHub-24111D?style=for-the-badge&logo=github&logoColor=E8BFD0" alt="GitHub"/>
  </a>
  <a href="https://linkedin.com/in/khawlah-al-hebshi-12046a38a">
    <img src="https://img.shields.io/badge/LinkedIn-6B3154?style=for-the-badge&logo=linkedin&logoColor=FFFFFF" alt="LinkedIn"/>
  </a>
  <a href="https://khowlah.github.io/Myprotofile">
    <img src="https://img.shields.io/badge/Portfolio-347F7B?style=for-the-badge&logo=firefox&logoColor=FFFFFF" alt="Portfolio"/>
  </a>

  <br/><br/>

  <img src="https://img.shields.io/badge/Next.js-24111D?style=flat-square&logo=nextdotjs&logoColor=F7EAF0" alt="Next.js"/>
  <img src="https://img.shields.io/badge/Flutter-347F7B?style=flat-square&logo=flutter&logoColor=FFFFFF" alt="Flutter"/>
  <img src="https://img.shields.io/badge/AI--Assisted-9A3158?style=flat-square&logo=openai&logoColor=FFFFFF" alt="AI-Assisted Development"/>
  <img src="https://img.shields.io/badge/Vibe_Coding-C49A52?style=flat-square&logo=visualstudiocode&logoColor=24111D" alt="Vibe Coding"/>

  <br/><br/>

  <i>Designed with curiosity. Built with purpose.</i>
  <br/>
  <sub>✦ Personal Developer Signature — Khawlah Al-Hebshi ✦</sub>

</div>

### About Khawlah Al-Hebshi

I'm **Khawlah Al-Hebshi**, a Software Engineering graduate specializing in backend development with Next.js and cross-platform application development with Flutter. I integrate software engineering discipline, product strategy, and AI-assisted workflows to build practical, scalable digital products.

I use AI and vibe coding to accelerate iteration while maintaining rigorous architectural standards, robust data integrity, and real-world utility.

- **Email**: [www.khowlah2001@gmail.com](mailto:www.khowlah2001@gmail.com)
- **GitHub**: [github.com/khowlah](https://github.com/khowlah)
- **LinkedIn**: [linkedin.com/in/khawlah-al-hebshi-12046a38a](https://linkedin.com/in/khawlah-al-hebshi-12046a38a)
- **Portfolio**: [khowlah.github.io/Myprotofile](https://khowlah.github.io/Myprotofile)


---

## 11. License
This project is licensed under the ISC License.
# Smart-Restaurant-POS
