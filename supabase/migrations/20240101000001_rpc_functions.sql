-- ====================================================================
-- Smart Restaurant & Café POS - Migration 002: PostgreSQL RPC Functions
-- ====================================================================

-- 1. ATOMIC ORDER CREATION
-- Handles table locking, server-side price validation, tax/discount calculation, and atomic table occupancy.
CREATE OR REPLACE FUNCTION create_order_atomic(
    p_order_type VARCHAR(20),
    p_table_id UUID,
    p_customer_name TEXT,
    p_items JSONB,
    p_notes TEXT,
    p_discount NUMERIC(10,2),
    p_created_by UUID
)
RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_order_number VARCHAR(50);
    v_table_record RECORD;
    v_item JSONB;
    v_menu_item RECORD;
    v_calculated_subtotal NUMERIC(10,2) := 0.00;
    v_item_subtotal NUMERIC(10,2);
    v_tax_rate NUMERIC(4,2) := 0.15; -- 15% standard tax
    v_tax_amount NUMERIC(10,2) := 0.00;
    v_grand_total NUMERIC(10,2) := 0.00;
    v_discount NUMERIC(10,2) := COALESCE(p_discount, 0.00);
    v_variant_price NUMERIC(10,2);
    v_addons_price NUMERIC(10,2);
    v_addon JSONB;
    v_quantity INT;
    v_result JSONB;
BEGIN
    -- Check order type validity
    IF p_order_type NOT IN ('dine_in', 'takeaway', 'delivery') THEN
        RAISE EXCEPTION 'Invalid order type: %', p_order_type;
    END IF;

    -- Dine-in requires table validation and atomic locking
    IF p_order_type = 'dine_in' THEN
        IF p_table_id IS NULL THEN
            RAISE EXCEPTION 'Table ID is required for dine_in orders';
        END IF;

        -- Concurrency safe row-level lock on dining table
        SELECT * INTO v_table_record
        FROM dining_tables
        WHERE id = p_table_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Dining table not found: %', p_table_id;
        END IF;

        IF v_table_record.status <> 'available' THEN
            RAISE EXCEPTION 'Table % is currently % and cannot be reserved', v_table_record.table_number, v_table_record.status;
        END IF;
    END IF;

    -- Validate items array
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order must contain at least one item';
    END IF;

    -- Generate human-readable order number: ORD-YYYYMMDD-HHMISS-RAND
    v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDD-HH24MISS-') || substring(gen_random_uuid()::text, 1, 4);

    -- Insert draft order row
    INSERT INTO orders (
        order_number,
        order_type,
        status,
        table_id,
        customer_name,
        notes,
        created_by,
        subtotal,
        discount,
        tax,
        grand_total
    ) VALUES (
        v_order_number,
        p_order_type,
        'new',
        p_table_id,
        p_customer_name,
        p_notes,
        p_created_by,
        0.00,
        v_discount,
        0.00,
        0.00
    ) RETURNING id INTO v_order_id;

    -- Process each item, verify price server-side from PostgreSQL
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_quantity := (v_item->>'quantity')::INT;
        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Item quantity must be greater than zero';
        END IF;

        -- Fetch menu item with row lock
        SELECT * INTO v_menu_item
        FROM menu_items
        WHERE id = (v_item->>'menu_item_id')::UUID
        FOR SHARE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Menu item not found: %', (v_item->>'menu_item_id');
        END IF;

        IF NOT v_menu_item.is_available THEN
            RAISE EXCEPTION 'Menu item "%" is currently marked unavailable', v_menu_item.name;
        END IF;

        -- Base price from database
        v_variant_price := v_menu_item.price;

        -- If a variant is selected, check extra price
        IF v_item ? 'selected_variant' AND v_item->'selected_variant' IS NOT NULL AND (v_item->'selected_variant' ? 'price') THEN
            v_variant_price := (v_item->'selected_variant'->>'price')::NUMERIC(10,2);
        END IF;

        -- Add-ons extra price calculation
        v_addons_price := 0.00;
        IF v_item ? 'selected_add_ons' AND v_item->'selected_add_ons' IS NOT NULL THEN
            FOR v_addon IN SELECT * FROM jsonb_array_elements(v_item->'selected_add_ons')
            LOOP
                IF v_addon ? 'price' THEN
                    v_addons_price := v_addons_price + (v_addon->>'price')::NUMERIC(10,2);
                END IF;
            END LOOP;
        END IF;

        -- Item subtotal
        v_item_subtotal := (v_variant_price + v_addons_price) * v_quantity;
        v_calculated_subtotal := v_calculated_subtotal + v_item_subtotal;

        -- Insert order item row (preserving historical prices)
        INSERT INTO order_items (
            order_id,
            menu_item_id,
            item_name,
            unit_price,
            quantity,
            selected_variant,
            selected_add_ons,
            subtotal,
            notes
        ) VALUES (
            v_order_id,
            v_menu_item.id,
            v_menu_item.name,
            (v_variant_price + v_addons_price),
            v_quantity,
            v_item->'selected_variant',
            COALESCE(v_item->'selected_add_ons', '[]'::jsonb),
            v_item_subtotal,
            v_item->>'notes'
        );
    END LOOP;

    -- Calculate financial totals
    IF v_discount > v_calculated_subtotal THEN
        v_discount := v_calculated_subtotal;
    END IF;

    v_tax_amount := round((v_calculated_subtotal - v_discount) * v_tax_rate, 2);
    v_grand_total := (v_calculated_subtotal - v_discount) + v_tax_amount;

    -- Update order with verified totals
    UPDATE orders
    SET subtotal = v_calculated_subtotal,
        discount = v_discount,
        tax = v_tax_amount,
        grand_total = v_grand_total
    WHERE id = v_order_id;

    -- If dine_in, mark table as occupied atomically
    IF p_order_type = 'dine_in' AND p_table_id IS NOT NULL THEN
        UPDATE dining_tables
        SET status = 'occupied'
        WHERE id = p_table_id;
    END IF;

    -- Construct return payload
    SELECT jsonb_build_object(
        'id', o.id,
        'order_number', o.order_number,
        'order_type', o.order_type,
        'status', o.status,
        'table_id', o.table_id,
        'customer_name', o.customer_name,
        'subtotal', o.subtotal,
        'discount', o.discount,
        'tax', o.tax,
        'grand_total', o.grand_total,
        'notes', o.notes,
        'created_at', o.created_at,
        'items', (
            SELECT jsonb_agg(jsonb_build_object(
                'id', oi.id,
                'menu_item_id', oi.menu_item_id,
                'item_name', oi.item_name,
                'unit_price', oi.unit_price,
                'quantity', oi.quantity,
                'selected_variant', oi.selected_variant,
                'selected_add_ons', oi.selected_add_ons,
                'subtotal', oi.subtotal,
                'notes', oi.notes
            ))
            FROM order_items oi
            WHERE oi.order_id = o.id
        )
    ) INTO v_result
    FROM orders o
    WHERE o.id = v_order_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;


-- 2. ATOMIC PAYMENT SETTLEMENT & TABLE RELEASE
CREATE OR REPLACE FUNCTION settle_payment_atomic(
    p_order_id UUID,
    p_payment_method VARCHAR(20),
    p_amount NUMERIC(10,2),
    p_settled_by UUID,
    p_transaction_ref TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_payment_id UUID;
    v_result JSONB;
BEGIN
    -- Validate payment method
    IF p_payment_method NOT IN ('cash', 'card', 'online') THEN
        RAISE EXCEPTION 'Invalid payment method: %', p_payment_method;
    END IF;

    -- Lock order row for update
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;

    -- Check if order is cancelled
    IF v_order.status = 'cancelled' THEN
        RAISE EXCEPTION 'Cannot settle cancelled order %', v_order.order_number;
    END IF;

    -- Check if already settled in payments table
    IF EXISTS (SELECT 1 FROM payments WHERE order_id = p_order_id AND status = 'completed') THEN
        RAISE EXCEPTION 'Order % has already been settled', v_order.order_number;
    END IF;

    -- Validate payment amount matches grand_total exactly
    IF p_amount <> v_order.grand_total THEN
        RAISE EXCEPTION 'Payment amount % does not match order grand total %', p_amount, v_order.grand_total;
    END IF;

    -- Insert payment record
    INSERT INTO payments (
        order_id,
        payment_method,
        amount,
        status,
        transaction_reference,
        settled_by
    ) VALUES (
        p_order_id,
        p_payment_method,
        p_amount,
        'completed',
        p_transaction_ref,
        p_settled_by
    ) RETURNING id INTO v_payment_id;

    -- Mark order completed
    UPDATE orders
    SET status = 'completed'
    WHERE id = p_order_id;

    -- Release dining table if dine_in
    IF v_order.table_id IS NOT NULL THEN
        UPDATE dining_tables
        SET status = 'available'
        WHERE id = v_order.table_id;
    END IF;

    -- Build return response
    SELECT jsonb_build_object(
        'payment_id', p.id,
        'order_id', p.order_id,
        'order_number', v_order.order_number,
        'payment_method', p.payment_method,
        'amount', p.amount,
        'status', p.status,
        'settled_at', p.settled_at,
        'order_status', 'completed',
        'table_released', (v_order.table_id IS NOT NULL)
    ) INTO v_result
    FROM payments p
    WHERE p.id = v_payment_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;


-- 3. ATOMIC ORDER STATUS TRANSITIONS
-- Validates: new -> preparing -> ready -> completed
CREATE OR REPLACE FUNCTION update_order_status_atomic(
    p_order_id UUID,
    p_new_status VARCHAR(20)
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_result JSONB;
BEGIN
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;

    -- Validate transitions
    IF v_order.status = 'new' AND p_new_status NOT IN ('preparing', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition from "new" to "%". Valid transitions: preparing, cancelled', p_new_status;
    ELSIF v_order.status = 'preparing' AND p_new_status NOT IN ('ready', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition from "preparing" to "%". Valid transitions: ready, cancelled', p_new_status;
    ELSIF v_order.status = 'ready' AND p_new_status NOT IN ('completed') THEN
        RAISE EXCEPTION 'Invalid transition from "ready" to "%". Valid transition: completed', p_new_status;
    ELSIF v_order.status IN ('completed', 'cancelled') THEN
        RAISE EXCEPTION 'Cannot update terminal order status "%"', v_order.status;
    END IF;

    -- If moving to cancelled and dining table was attached, release table
    IF p_new_status = 'cancelled' AND v_order.table_id IS NOT NULL THEN
        UPDATE dining_tables
        SET status = 'available'
        WHERE id = v_order.table_id;
    END IF;

    UPDATE orders
    SET status = p_new_status
    WHERE id = p_order_id;

    SELECT jsonb_build_object(
        'id', o.id,
        'order_number', o.order_number,
        'status', o.status,
        'updated_at', o.updated_at
    ) INTO v_result
    FROM orders o
    WHERE o.id = p_order_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;


-- 4. SALES REPORT SUMMARY
CREATE OR REPLACE FUNCTION get_sales_report_summary(
    p_start_date TIMESTAMPTZ DEFAULT (date_trunc('day', now())),
    p_end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB AS $$
DECLARE
    v_total_revenue NUMERIC(10,2) := 0.00;
    v_total_orders INT := 0;
    v_dine_in_count INT := 0;
    v_takeaway_count INT := 0;
    v_delivery_count INT := 0;
    v_top_items JSONB := '[]'::jsonb;
    v_result JSONB;
BEGIN
    -- Total revenue from completed payments within date boundary
    SELECT COALESCE(SUM(amount), 0.00)
    INTO v_total_revenue
    FROM payments
    WHERE status = 'completed'
      AND settled_at >= p_start_date
      AND settled_at <= p_end_date;

    -- Orders count and breakdown by type for orders created or settled in this period
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE order_type = 'dine_in'),
        COUNT(*) FILTER (WHERE order_type = 'takeaway'),
        COUNT(*) FILTER (WHERE order_type = 'delivery')
    INTO
        v_total_orders,
        v_dine_in_count,
        v_takeaway_count,
        v_delivery_count
    FROM orders
    WHERE created_at >= p_start_date
      AND created_at <= p_end_date;

    -- Top 5 best selling menu items
    SELECT COALESCE(jsonb_agg(item_row), '[]'::jsonb)
    INTO v_top_items
    FROM (
        SELECT jsonb_build_object(
            'menu_item_id', oi.menu_item_id,
            'item_name', oi.item_name,
            'total_quantity_sold', SUM(oi.quantity),
            'total_sales', SUM(oi.subtotal)
        ) AS item_row
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.created_at >= p_start_date
          AND o.created_at <= p_end_date
          AND o.status <> 'cancelled'
        GROUP BY oi.menu_item_id, oi.item_name
        ORDER BY SUM(oi.quantity) DESC
        LIMIT 5
    ) t;

    -- Assemble summary
    v_result := jsonb_build_object(
        'period_start', p_start_date,
        'period_end', p_end_date,
        'total_revenue', v_total_revenue,
        'total_orders', v_total_orders,
        'order_breakdown', jsonb_build_object(
            'dine_in', v_dine_in_count,
            'takeaway', v_takeaway_count,
            'delivery', v_delivery_count
        ),
        'top_five_items', v_top_items
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
