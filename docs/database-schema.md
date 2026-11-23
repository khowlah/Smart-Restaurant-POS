# Database Schema & Relational Model

The database is built on Supabase PostgreSQL with 7 primary relational tables, comprehensive foreign key constraints, check constraints, performance indexes, and transactional RPC functions.

```mermaid
erDiagram
    users ||--o{ orders : "creates"
    users ||--o{ payments : "settles"
    categories ||--o{ menu_items : "classifies"
    dining_tables ||--o{ orders : "hosts"
    orders ||--|{ order_items : "contains"
    menu_items ||--o{ order_items : "ordered_in"
    orders ||--o| payments : "settled_by"

    users {
        UUID id PK
        TEXT email UK
        TEXT full_name
        VARCHAR role "manager | cashier | kitchen"
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    categories {
        UUID id PK
        TEXT name UK
        TEXT description
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    menu_items {
        UUID id PK
        UUID category_id FK
        TEXT name
        TEXT description
        NUMERIC price "CHECK >= 0"
        BOOLEAN is_available
        TEXT image_url
        JSONB variants
        JSONB add_ons
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    dining_tables {
        UUID id PK
        VARCHAR table_number UK
        INT capacity "CHECK > 0"
        VARCHAR status "available | occupied | billing_pending"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    orders {
        UUID id PK
        VARCHAR order_number UK
        VARCHAR order_type "dine_in | takeaway | delivery"
        VARCHAR status "new | preparing | ready | completed | cancelled"
        UUID table_id FK
        TEXT customer_name
        NUMERIC subtotal "CHECK >= 0"
        NUMERIC discount "CHECK >= 0"
        NUMERIC tax "CHECK >= 0"
        NUMERIC grand_total "CHECK >= 0"
        TEXT notes
        UUID created_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    order_items {
        UUID id PK
        UUID order_id FK
        UUID menu_item_id FK
        TEXT item_name
        NUMERIC unit_price "CHECK >= 0"
        INT quantity "CHECK > 0"
        JSONB selected_variant
        JSONB selected_add_ons
        NUMERIC subtotal "CHECK >= 0"
        TEXT notes
        TIMESTAMPTZ created_at
    }

    payments {
        UUID id PK
        UUID order_id UK, FK
        VARCHAR payment_method "cash | card | online"
        NUMERIC amount "CHECK >= 0"
        VARCHAR status "completed | failed | refunded"
        TEXT transaction_reference
        UUID settled_by FK
        TIMESTAMPTZ settled_at
    }
```

## Atomic RPC Functions
1. `create_order_atomic(p_order_type, p_table_id, p_customer_name, p_items, p_notes, p_discount, p_created_by)`:
   - Validates and row-locks table if `dine_in`.
   - Validates menu items availability and fetches current prices.
   - Calculates financial totals (subtotal, 15% tax, discount, grand total).
   - Inserts order and order items preserving historical pricing.
   - Atomically transitions table status to `occupied`.
2. `settle_payment_atomic(p_order_id, p_payment_method, p_amount, p_settled_by, p_transaction_ref)`:
   - Locks order row.
   - Verifies amount equals order grand total.
   - Records payment and prevents duplicate settlement.
   - Transitions order status to `completed`.
   - Atomically releases linked dining table (`available`).
3. `update_order_status_atomic(p_order_id, p_new_status)`:
   - Enforces valid transition pipeline (`new` -> `preparing` -> `ready` -> `completed`).
4. `get_sales_report_summary(p_start_date, p_end_date)`:
   - Aggregates settled revenue, orders count, breakdown, and top 5 items.
