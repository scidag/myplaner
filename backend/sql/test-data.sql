-- ========================================
-- MyPlanner 测试数据
-- ⚠️ 仅供本地开发，禁止在生产库执行
-- 执行前确保已创建数据库并执行了 init.sql
-- 测试用户密码均为 abc12345（BCrypt 密文）
-- ========================================

USE myplanner;

-- 测试用户（密码都是 abc12345，BCrypt 密文）
INSERT INTO sys_user (username, password) VALUES
('admin',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
('test_01',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
('demo_user','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');

-- admin 的任务（user_id = 1）
INSERT INTO sys_task (user_id, title, description, status, due_date, completed_time) VALUES
(1, '搭建 Spring Boot 基础环境', '配置 MyBatis-Plus 和 JWT', 'IN_PROGRESS', '2026-06-25', NULL),
(1, '设计 MySQL 数据库表结构', '完成 sys_user 和 sys_task 表设计', 'TODO', '2026-06-22', NULL),
(1, '阅读 React Hooks 官方文档', '重点理解 useEffect 和 useCallback', 'DONE', '2026-06-15', '2026-06-14T10:30:00'),
(1, '学习 Spring Security 原理', NULL, 'TODO', '2026-06-28', NULL),
(1, '编写单元测试', '覆盖 Service 层核心逻辑', 'TODO', '2026-07-01', NULL);

-- test_01 的任务（user_id = 2）
INSERT INTO sys_task (user_id, title, description, status, due_date, completed_time) VALUES
(2, '完成前端登录页面', '使用 login.html 原型', 'IN_PROGRESS', '2026-06-23', NULL),
(2, '配置 Axios 拦截器', '统一处理 Token 和 401', 'TODO', '2026-06-26', NULL),
(2, '联调注册接口', NULL, 'DONE', '2026-06-18', '2026-06-17T16:00:00');

-- demo_user 的任务（user_id = 3）
INSERT INTO sys_task (user_id, title, description, status, due_date) VALUES
(3, '部署应用到服务器', '购买云服务器并配置环境', 'TODO', '2026-07-05'),
(3, '编写项目文档', '包括 API 文档和部署文档', 'TODO', '2026-07-10');
