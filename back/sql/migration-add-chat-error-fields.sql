-- 给 sys_chat_message 增加错误信息字段
-- 当 AI 调用失败时，把错误也作为一条 assistant 消息存入数据库，便于排查
ALTER TABLE sys_chat_message
    ADD COLUMN error_code VARCHAR(50) NULL DEFAULT NULL COMMENT 'AI调用错误码，NULL表示成功' AFTER content,
    ADD COLUMN error_message TEXT NULL DEFAULT NULL COMMENT 'AI调用错误详情' AFTER error_code;
