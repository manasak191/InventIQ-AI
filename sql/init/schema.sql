-- PostgreSQL schema for AI Inventory Management System

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id),
    CONSTRAINT uq_user_roles UNIQUE (user_id, role_id)
);

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories (id)
);

CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category_id BIGINT,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    item_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE supplier_products (
    id BIGSERIAL PRIMARY KEY,
    supplier_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    supplier_sku TEXT,
    lead_time_days INTEGER,
    preferred BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_supplier_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
    CONSTRAINT fk_supplier_products_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT uq_supplier_products UNIQUE (supplier_id, product_id)
);

CREATE TABLE warehouses (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    address TEXT,
    manager_user_id BIGINT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_warehouses_manager FOREIGN KEY (manager_user_id) REFERENCES users (id)
);

CREATE TABLE inventory (
    id BIGSERIAL PRIMARY KEY,
    warehouse_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity_on_hand - reserved_quantity) STORED,
    last_counted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_inventory_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id),
    CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT uq_inventory UNIQUE (warehouse_id, product_id),
    CONSTRAINT chk_inventory_quantity_on_hand_non_negative CHECK (quantity_on_hand >= 0),
    CONSTRAINT chk_inventory_reserved_quantity_non_negative CHECK (reserved_quantity >= 0),
    CONSTRAINT chk_inventory_reserved_less_equal_on_hand CHECK (reserved_quantity <= quantity_on_hand)
);

CREATE TABLE inventory_batches (
    id BIGSERIAL PRIMARY KEY,
    inventory_id BIGINT NOT NULL,
    batch_number TEXT NOT NULL,
    expiry_date DATE,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_inventory_batches_inventory FOREIGN KEY (inventory_id) REFERENCES inventory (id) ON DELETE CASCADE,
    CONSTRAINT uq_inventory_batches_inventory_batch UNIQUE (inventory_id, batch_number),
    CONSTRAINT chk_inventory_batches_quantity_on_hand_non_negative CHECK (quantity_on_hand >= 0),
    CONSTRAINT chk_inventory_batches_reserved_quantity_non_negative CHECK (reserved_quantity >= 0),
    CONSTRAINT chk_inventory_batches_reserved_less_equal_on_hand CHECK (reserved_quantity <= quantity_on_hand)
);

CREATE TABLE inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    inventory_batch_id BIGINT,
    transaction_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    related_entity_type TEXT,
    related_entity_id BIGINT,
    performed_by_user_id BIGINT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_inventory_transactions_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT fk_inventory_transactions_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id),
    CONSTRAINT fk_inventory_transactions_batch FOREIGN KEY (inventory_batch_id) REFERENCES inventory_batches (id),
    CONSTRAINT fk_inventory_transactions_user FOREIGN KEY (performed_by_user_id) REFERENCES users (id),
    CONSTRAINT chk_inventory_transactions_quantity_positive CHECK (quantity > 0)
);

CREATE TABLE stock_transfers (
    id BIGSERIAL PRIMARY KEY,
    transfer_number TEXT NOT NULL UNIQUE,
    from_warehouse_id BIGINT NOT NULL,
    to_warehouse_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_by_user_id BIGINT NOT NULL,
    approved_by_user_id BIGINT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_stock_transfers_from_warehouse FOREIGN KEY (from_warehouse_id) REFERENCES warehouses (id),
    CONSTRAINT fk_stock_transfers_to_warehouse FOREIGN KEY (to_warehouse_id) REFERENCES warehouses (id),
    CONSTRAINT fk_stock_transfers_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT fk_stock_transfers_requested_by FOREIGN KEY (requested_by_user_id) REFERENCES users (id),
    CONSTRAINT fk_stock_transfers_approved_by FOREIGN KEY (approved_by_user_id) REFERENCES users (id)
);

CREATE TABLE purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    supplier_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    created_by_user_id BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    currency TEXT NOT NULL DEFAULT 'INR',
    subtotal_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    shipping_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    received_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_purchase_orders_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
    CONSTRAINT fk_purchase_orders_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id),
    CONSTRAINT fk_purchase_orders_user FOREIGN KEY (created_by_user_id) REFERENCES users (id)
);

CREATE TABLE purchase_order_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity_ordered INTEGER NOT NULL DEFAULT 0,
    quantity_received INTEGER NOT NULL DEFAULT 0,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    line_total NUMERIC(14,2) GENERATED ALWAYS AS (quantity_ordered * unit_price) STORED,
    CONSTRAINT fk_po_items_purchase_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_po_items_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT chk_po_items_quantity_ordered_positive CHECK (quantity_ordered > 0),
    CONSTRAINT chk_po_items_unit_price_non_negative CHECK (unit_price >= 0)
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    notification_type TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'in_app',
    title TEXT,
    body TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    related_entity_type TEXT,
    related_entity_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE email_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    notification_id BIGINT,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    template_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_email_logs_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_email_logs_notification FOREIGN KEY (notification_id) REFERENCES notifications (id)
);

CREATE TABLE chat_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_id TEXT,
    message TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'user',
    channel TEXT NOT NULL DEFAULT 'web',
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_chat_history_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE chat_feedback (
    id BIGSERIAL PRIMARY KEY,
    chat_history_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating INTEGER,
    feedback_text TEXT,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_chat_feedback_chat_history FOREIGN KEY (chat_history_id) REFERENCES chat_history (id),
    CONSTRAINT fk_chat_feedback_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT chk_chat_feedback_rating_range CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id BIGINT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL,
    paid_by_user_id BIGINT,
    amount NUMERIC(14,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    transaction_reference TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_payments_purchase_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id),
    CONSTRAINT fk_payments_user FOREIGN KEY (paid_by_user_id) REFERENCES users (id),
    CONSTRAINT chk_payments_amount_positive CHECK (amount > 0)
);

CREATE TABLE product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE INDEX idx_products_name_lower ON products (LOWER(name));
CREATE INDEX idx_products_category_id ON products (category_id);
CREATE INDEX idx_inventory_product_id ON inventory (product_id);
CREATE INDEX idx_notifications_user_created_at ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications (is_read);
CREATE INDEX idx_purchase_orders_status_order_date ON purchase_orders (status, order_date DESC);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders (supplier_id);
CREATE INDEX idx_purchase_orders_warehouse_id ON purchase_orders (warehouse_id);
