CREATE TABLE IF NOT EXISTS sys_chat_session (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT NOT NULL,
  title       VARCHAR(100) NOT NULL DEFAULT '新对话',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_update (user_id, update_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI对话会话';

CREATE TABLE IF NOT EXISTS sys_chat_message (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id    BIGINT NOT NULL,
  role          VARCHAR(20) NOT NULL,
  content       TEXT NOT NULL,
  error_code    VARCHAR(50) NULL DEFAULT NULL COMMENT 'AI调用错误码，NULL表示成功',
  error_message TEXT NULL DEFAULT NULL COMMENT 'AI调用错误详情',
  extracted     TINYINT NOT NULL DEFAULT 0,
  create_time   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_time (session_id, create_time),
  INDEX idx_session_extracted (session_id, extracted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI对话消息';
