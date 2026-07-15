-- 为 sys_task 表添加优先级字段（幂等：若列已存在则跳过，避免与 init.sql 冲突）
-- 注意：MySQL 8.0.29+ 支持 ADD COLUMN IF NOT EXISTS 语法
-- 老库迁移后 priority 列必须与 init.sql 中定义一致：NOT NULL DEFAULT 'MEDIUM'
ALTER TABLE sys_task ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' COMMENT '优先级: LOW, MEDIUM, HIGH' AFTER description;

-- 兼容已存在列但缺 NOT NULL 的老库：补齐约束（若已为 NOT NULL 则本语句无副作用）
-- MySQL 不支持直接 ALTER COLUMN ADD NOT NULL，需通过 MODIFY 修改列定义
ALTER TABLE sys_task MODIFY COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' COMMENT '优先级: LOW, MEDIUM, HIGH';
