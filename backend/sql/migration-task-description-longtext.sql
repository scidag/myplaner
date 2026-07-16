-- 迁移：将 sys_task.description 从 VARCHAR(500) 扩展为 LONGTEXT
-- 背景：业务上需要支持长描述（最多 100000 字），VARCHAR(500) 不足。
-- LONGTEXT 最大 4GB，远超 10 万字需求；utf8mb4 下约可存 100 万+ 中文字符。
-- 幂等：通过 information_schema 判断列类型，避免重复 ALTER 报错。

USE myplanner;

SET @col_type := (
    SELECT DATA_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'myplanner'
      AND TABLE_NAME = 'sys_task'
      AND COLUMN_NAME = 'description'
    LIMIT 1
);

-- 仅当当前类型不是 LONGTEXT / MEDIUMTEXT 时执行变更
-- 注意：MySQL 不支持 IF NOT EXISTS 语法用于 MODIFY COLUMN，故用存储过程或条件判断
SET @sql := IF(@col_type IS NULL OR @col_type IN ('longtext','mediumtext'),
    'SELECT 1',
    'ALTER TABLE sys_task MODIFY COLUMN description LONGTEXT NULL COMMENT ''详细描述（支持长文本，最大约 4GB）'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 校验
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'myplanner'
  AND TABLE_NAME = 'sys_task'
  AND COLUMN_NAME = 'description';
