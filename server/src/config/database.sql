-- 커피 주문 앱 데이터베이스 스키마

-- Menus 테이블 생성
CREATE TABLE IF NOT EXISTS menus (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('커피', '논커피', '디저트')),
    base_price INTEGER NOT NULL CHECK (base_price >= 0),
    sale_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (sale_status IN ('active', 'season_off')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Options 테이블 생성
CREATE TABLE IF NOT EXISTS options (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    option_type VARCHAR(20) NOT NULL CHECK (option_type IN ('temperature', 'size', 'shot', 'extra')),
    price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
    menu_id INTEGER REFERENCES menus(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Members 테이블 생성
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    team VARCHAR(50) NOT NULL,
    name VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders 테이블 생성
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    options JSONB NOT NULL DEFAULT '{}',
    unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
    total_price INTEGER NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MemberMenuPreferences 테이블 생성
CREATE TABLE IF NOT EXISTS member_menu_preferences (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    order_count INTEGER NOT NULL DEFAULT 0 CHECK (order_count >= 0),
    last_ordered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(member_id, menu_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_menus_category ON menus(category);
CREATE INDEX IF NOT EXISTS idx_menus_sale_status ON menus(sale_status);
CREATE INDEX IF NOT EXISTS idx_options_menu_id ON options(menu_id);
CREATE INDEX IF NOT EXISTS idx_options_option_type ON options(option_type);
CREATE INDEX IF NOT EXISTS idx_members_employee_id ON members(employee_id);
CREATE INDEX IF NOT EXISTS idx_orders_member_id ON orders(member_id);
CREATE INDEX IF NOT EXISTS idx_orders_menu_id ON orders(menu_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_member_menu_preferences_member_id ON member_menu_preferences(member_id);
CREATE INDEX IF NOT EXISTS idx_member_menu_preferences_menu_id ON member_menu_preferences(menu_id);
CREATE INDEX IF NOT EXISTS idx_member_menu_preferences_order_count ON member_menu_preferences(order_count DESC);

-- updated_at 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 트리거 생성
CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_options_updated_at BEFORE UPDATE ON options
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_menu_preferences_updated_at BEFORE UPDATE ON member_menu_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
