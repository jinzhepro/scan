-- 创建扫描历史表
CREATE TABLE scan_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    barcode VARCHAR(50) NOT NULL,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_scan_history_user_id ON scan_history(user_id);
CREATE INDEX idx_scan_history_product_id ON scan_history(product_id);
CREATE INDEX idx_scan_history_barcode ON scan_history(barcode);
CREATE INDEX idx_scan_history_scanned_at ON scan_history(scanned_at DESC);

-- 启用行级安全策略
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

-- 设置访问权限
GRANT SELECT ON scan_history TO anon;
GRANT ALL PRIVILEGES ON scan_history TO authenticated;

-- 创建RLS策略：用户只能查看自己的扫描历史
CREATE POLICY "Users can view own scan history" ON scan_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan history" ON scan_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 管理员可以查看所有扫描历史
CREATE POLICY "Admins can view all scan history" ON scan_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 创建函数：记录扫描历史
CREATE OR REPLACE FUNCTION record_scan_history(
    p_user_id UUID,
    p_barcode VARCHAR(50)
)
RETURNS JSON AS $$
DECLARE
    v_product_id UUID;
    v_scan_id UUID;
BEGIN
    -- 查找商品ID
    SELECT id INTO v_product_id
    FROM products
    WHERE barcode = p_barcode;
    
    -- 插入扫描历史记录
    INSERT INTO scan_history (
        user_id,
        product_id,
        barcode
    ) VALUES (
        p_user_id,
        v_product_id,
        p_barcode
    ) RETURNING id INTO v_scan_id;
    
    RETURN json_build_object(
        'success', true,
        'message', '扫描历史记录成功',
        'data', json_build_object(
            'scan_id', v_scan_id,
            'product_found', v_product_id IS NOT NULL
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建视图：扫描历史详情
CREATE VIEW scan_history_detail AS
SELECT 
    sh.id,
    sh.user_id,
    sh.barcode,
    sh.scanned_at,
    u.nickname as user_nickname,
    p.id as product_id,
    p.name as product_name,
    p.price as product_price,
    p.stock as product_stock
FROM scan_history sh
LEFT JOIN users u ON sh.user_id = u.id
LEFT JOIN products p ON sh.product_id = p.id
ORDER BY sh.scanned_at DESC;

-- 设置视图访问权限
GRANT SELECT ON scan_history_detail TO anon;
GRANT SELECT ON scan_history_detail TO authenticated;