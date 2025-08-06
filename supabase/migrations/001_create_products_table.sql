-- 创建商品表
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    description TEXT,
    image_url VARCHAR(500),
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_stock ON products(stock);

-- 启用行级安全策略
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 创建更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为products表添加更新时间戳触发器
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 设置访问权限
GRANT SELECT ON products TO anon;
GRANT ALL PRIVILEGES ON products TO authenticated;

-- 插入示例商品数据
INSERT INTO products (barcode, name, price, description, stock) VALUES
('6901028089296', '可口可乐 330ml', 3.50, '经典可口可乐，清爽怡人', 100),
('6902083901011', '康师傅红烧牛肉面', 4.50, '香浓红烧牛肉味方便面', 50),
('6921168509157', '旺旺雪饼 150g', 8.80, '香脆可口的米果零食', 30),
('6901028300117', '雪碧 330ml', 3.50, '柠檬味汽水，清新透凉', 80),
('6901028300124', '芬达橙味汽水 330ml', 3.50, '橙味汽水，果香浓郁', 60),
('6922255451234', '统一绿茶 500ml', 3.00, '清香绿茶，天然健康', 40);