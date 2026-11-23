# API Documentation

The API adheres to standard REST conventions and returns a consistent JSON envelope.

## Response Envelope Formats

### Standard Success Response (200, 201)
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

### Standard Error Response (400, 401, 403, 404, 409, 500)
```json
{
  "success": false,
  "data": null,
  "message": "Descriptive error message"
}
```

## Interactive Swagger UI
The full interactive OpenAPI 3.0 specification is available at:
`http://localhost:5000/api-docs`

## Endpoints Summary

### 1. Authentication (`/api/auth`)
- `POST /api/auth/login`: Authenticate with email and password. Returns JWT token and user profile.
- `GET /api/auth/me`: Retrieve current authenticated user profile and role.

### 2. Categories (`/api/categories`)
- `GET /api/categories`: List all active food and beverage categories.
- `POST /api/categories`: Create category (**Manager only**).

### 3. Menu Management (`/api/menu`)
- `GET /api/menu`: List menu items. Query parameters:
  - `category`: Category UUID
  - `is_available`: `true` or `false`
- `POST /api/menu`: Create new menu item (**Manager only**).
- `PATCH /api/menu/:id/availability`: Toggle menu item availability (**Manager only**).

### 4. Table Management (`/api/tables`)
- `GET /api/tables`: List all dining tables with current occupancy status (`available`, `occupied`, `billing_pending`).
- `PATCH /api/tables/:id/status`: Update table status (**Cashier, Manager**).

### 5. Orders (`/api/orders`)
- `POST /api/orders`: Create new order (`dine_in`, `takeaway`, `delivery`). Performs server-side price calculation and atomic table reservation for dine-in (**Cashier, Manager**).
- `GET /api/orders`: List all orders.
- `GET /api/orders/:id`: Get order details with line items.
- `PATCH /api/orders/:id/status`: Update order status transition (**Kitchen, Cashier, Manager**).
- `POST /api/orders/:id/settle`: Settle bill and release dining table (**Cashier, Manager**).

### 6. Kitchen Display System (`/api/kds`)
- `GET /api/kds/orders`: Retrieve active kitchen orders (`new`, `preparing`, `ready`) sorted chronologically with `seconds_elapsed` (**Kitchen, Cashier, Manager**).
- `PATCH /api/kds/orders/:id/status`: Update status transition (**Kitchen, Cashier, Manager**).

### 7. Payments (`/api/payments`)
- `POST /api/payments/:id/settle`: Process settlement with cash, card, or online payment (**Cashier, Manager**).

### 8. Analytics & Reports (`/api/reports`)
- `GET /api/reports/summary`: Today's sales summary including total revenue, order count, order type breakdown, and top 5 selling items (**Manager only**).
