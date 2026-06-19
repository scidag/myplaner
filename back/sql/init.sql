CREATE DATABASE IF NOT EXISTS myplanner DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE myplanner;

-- 用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    username    VARCHAR(50)  NOT NULL COMMENT '用户名',
    password    VARCHAR(255) NOT NULL COMMENT 'BCrypt加密后的密码',
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 任务表
CREATE TABLE IF NOT EXISTS sys_task (
    id             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    user_id        BIGINT       NOT NULL COMMENT '关联用户ID',
    title          VARCHAR(100) NOT NULL COMMENT '任务标题',
    description    VARCHAR(500) DEFAULT NULL COMMENT '详细描述',
    status         VARCHAR(20)  NOT NULL DEFAULT 'TODO' COMMENT '状态: TODO, IN_PROGRESS, DONE',
    due_date       DATE         DEFAULT NULL COMMENT '截止日期',
    completed_time DATETIME     DEFAULT NULL COMMENT '完成时间',
    version        INT          NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
    create_time    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_user_status (user_id, status),
    KEY idx_user_due_date (user_id, due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务表';
