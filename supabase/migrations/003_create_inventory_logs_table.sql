-- 创建库存变动日志表
CREATE TABLE inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    operator_id UUID NOT NULL REFERENCES users(id),
    quantity_change INTEGER NOT NULL,
    stock_before INTEGER NOT NULL,
    stock_after INTEGER NOT NULL,
    reason VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_operator_id ON inventory_logs(operator_id);
CREATE INDEX idx_inventory_logs_created_at ON inventory_logs(created_at DESC);
CREATE INDEX idx_inventory_logs_reason ON inventory_logs(reason);

-- 启用行级安全策略
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- 设置访问权限
GRANT SELECT ON inventory_logs TO anon;
GRANT ALL PRIVILEGES ON inventory_logs TO authenticated;

-- 创建RLS策略：所有认证用户可以查看库存日志
CREATE POLICY "Authenticated users can view inventory logs" ON inventory_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- 只有管理员可以插入库存日志
CREATE POLICY "Admins can insert inventory logs" ON inventory_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 创建库存调整函数
CREATE OR REPLACE FUNCTION adjust_inventory(
    p_product_id UUID,
    p_quantity_change INTEGER,
    p_reason VARCHAR(200),
    p_operator_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_current_stock INTEGER;
    v_new_stock INTEGER;
    v_log_id UUID;
BEGIN
    -- 获取当前库存
    SELECT stock INTO v_current_stock
    FROM products
    WHERE id = p_product_id;
    
    IF v_current_stock IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', '商品不存在'
        );
    END IF;
    
    -- 计算新库存
    v_new_stock := v_current_stock + p_quantity_change;
    
    -- 检查库存不能为负数
    IF v_new_stock < 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', '库存不足，无法执行此操作'
        );
    END IF;
    
    -- 更新商品库存
    UPDATE products
    SET stock = v_new_stock
    WHERE id = p_product_id;
    
    -- 记录库存变动日志
    INSERT INTO inventory_logs (
        product_id,
        operator_id,
        quantity_change,
        stock_before,
        stock_after,
        reason
    ) VALUES (
        p_product_id,
        p_operator_id,
        p_quantity_change,
        v_current_stock,
        v_new_stock,
        p_reason
    ) RETURNING id INTO v_log_id;
    
    RETURN json_build_object(
        'success', true,
        'message', '库存调整成功',
        'data', json_build_object(
            'new_stock', v_new_stock,
            'log_id', v_log_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;