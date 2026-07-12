# AI 对话功能需求文档

## 1. 功能目标

- 用户与 AI 实时对话，AI 回复支持 Markdown 渲染（代码块、列表、加粗、表格等）
- 流式输出（打字机效果），首字延迟 < 1.5s
- 每条 AI 回复可一键「加入待办」，自动提取标题/描述/截止日期
- 支持多会话：左侧会话列表，可新建/切换/重命名/删除会话
- 历史消息持久化，刷新或换设备登录后可恢复

## 2. 用户故事

- 作为用户，我希望新建一个对话会话，讨论我的计划
- 作为用户，我希望看到 AI 逐字输出，而非长时间空白等待
- 作为用户，我希望点击 AI 回复中的某段建议，直接生成一条待办任务
- 作为用户，我希望切换不同主题的会话而不丢失历史

## 3. 交互流程

### 3.1 会话管理
1. 进入 `/chat` → 默认加载最近一个会话，若无会话则新建空会话
2. 左侧会话列表按 `update_time DESC` 排序，显示会话标题 + 最后消息预览
3. 点击「新建会话」按钮 → 创建空会话并切换
4. 会话标题默认「新对话」，可点击重命名（inline 编辑）
5. 删除会话需二次确认，删除后无法恢复（物理删除）

### 3.2 对话交互
1. 输入消息 → Enter 发送，Shift+Enter 换行
2. 发送后：显示用户气泡 → 立即建立 SSE 连接 → 流式渲染 AI 气泡
3. 流式过程中：输入框禁用，发送按钮变为「停止生成」按钮
4. 点击「停止生成」→ 断开 SSE 连接，已生成内容保留并入库
5. AI 回复完成 → 气泡底部出现「加入待办」+「复制」操作按钮
6. 点击「加入待办」→ 弹出预填表单（标题/描述/截止日期可编辑）→ 确认创建

### 3.3 异常处理
- SSE 连接超时 60s → 提示「连接超时，请重试」
- SSE 连接断开 → 提示「连接中断，请重试」
- AI 返回空内容 → 提示「AI 未返回内容，请重试」
- 网络异常 → 提示「网络异常，请重试」

## 4. 接口设计

### 4.1 会话接口

```
POST   /api/chat/sessions                  新建会话
  请求: { "title": "新对话" }
  响应: { "id": 1, "title": "新对话", "createTime": "...", "updateTime": "..." }

GET    /api/chat/sessions                  会话列表
  响应: [{ "id": 1, "title": "...", "lastMessage": "...", "updateTime": "..." }]

PATCH  /api/chat/sessions/{id}             重命名会话
  请求: { "title": "新标题" }

DELETE /api/chat/sessions/{id}             删除会话（级联删除消息）

GET    /api/chat/sessions/{id}/messages    历史消息
  响应: [{ "id": 1, "role": "USER", "content": "...", "createTime": "..." }]
```

### 4.2 对话接口（SSE 流式）

```
POST   /api/chat/sessions/{id}/messages    发送消息（SSE 流式返回）
  请求: { "content": "用户消息" }
  响应: text/event-stream
    data: {"type":"chunk","content":"你"}
    data: {"type":"chunk","content":"好"}
    ...
    data: {"type":"done","messageId":123}
    data: {"type":"error","message":"..."}
```

### 4.3 转待办接口

```
POST   /api/chat/messages/{id}/to-task     将某条 AI 回复转为待办
  请求: { "title": "...", "description": "...", "dueDate": "2026-07-15" }
  响应: { "id": 1, "title": "...", "status": "TODO" }
```

## 5. 数据库设计

```sql
CREATE TABLE sys_chat_session (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT NOT NULL,
  title       VARCHAR(100) NOT NULL DEFAULT '新对话',
  create_time DATETIME NOT NULL,
  update_time DATETIME NOT NULL,
  INDEX idx_user_update (user_id, update_time)
) COMMENT='AI对话会话';

CREATE TABLE sys_chat_message (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id  BIGINT NOT NULL,
  role        VARCHAR(20) NOT NULL COMMENT 'USER / ASSISTANT',
  content     TEXT NOT NULL,
  create_time DATETIME NOT NULL,
  INDEX idx_session_time (session_id, create_time)
) COMMENT='AI对话消息';
```

## 6. 技术栈

| 层 | 选型 | 说明 |
|----|------|------|
| AI 框架 | Spring AI Alibaba + DashScope Starter | `spring-ai-alibaba-starter-dashscope`，原生对接阿里云百炼平台；基于 Spring AI 构建，提供 `ChatClient` 统一抽象 |
| AI 服务 | 阿里云百炼（DashScope） | 通过百炼平台调用 DeepSeek（`deepseek-chat`）或通义千问（`qwen-max`），切换模型只需改配置 |
| 流式协议 | SSE（`text/event-stream`） | 后端 `chatClient.prompt(...).stream().content()` 返回 `Flux<String>`，直接转 SSE；前端用 `fetch + ReadableStream` 接收（因需 POST + Header，不用 EventSource） |
| 前端 Markdown 渲染 | `react-markdown` + `remark-gfm` | 支持 GFM（表格、任务列表、代码块） |
| 代码高亮 | `react-syntax-highlighter` | AI 回复中的代码块高亮 |
| 消息队列 | 不引入 | 同步请求-响应，个人应用无需 |
| Redis | 不引入 | JWT 无状态；单用户无限流需求 |

> **选型说明**：因 API Key 来自阿里云百炼（DashScope），采用 Spring AI Alibaba 的 `spring-ai-alibaba-starter-dashscope` 原生对接。该框架基于 Spring AI 构建，仍使用 `ChatClient` 抽象，流式/Function Calling/结构化输出均开箱即用。百炼平台支持 DeepSeek 与通义千问多模型，未来切换模型只需改配置。

## 7. 后端新增依赖

```xml
<!-- back/pom.xml — 版本管理 -->
<properties>
  <spring-ai.version>1.0.0</spring-ai.version>
  <spring-ai-alibaba.version>1.0.0.2</spring-ai-alibaba.version>
</properties>

<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.ai</groupId>
      <artifactId>spring-ai-bom</artifactId>
      <version>${spring-ai.version}</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
    <dependency>
      <groupId>com.alibaba.cloud.ai</groupId>
      <artifactId>spring-ai-alibaba-bom</artifactId>
      <version>${spring-ai-alibaba.version}</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>

<!-- 百炼（DashScope）模型服务适配，内含 WebClient，无需单独引入 webflux -->
<dependency>
  <groupId>com.alibaba.cloud.ai</groupId>
  <artifactId>spring-ai-alibaba-starter-dashscope</artifactId>
</dependency>
```

> 需在 `pom.xml` 配置 Spring 里程碑仓库与阿里云 Maven 仓库（见下），否则依赖无法下载。
> ```xml
> <repositories>
>   <repository>
>     <id>spring-milestones</id>
>     <url>https://repo.spring.io/milestone</url>
>   </repository>
>   <repository>
>     <id>aliyunmaven</id>
>     <url>https://maven.aliyun.com/repository/public</url>
>   </repository>
> </repositories>
> ```

## 8. 前端新增依赖

```
react-markdown remark-gfm react-syntax-highlighter
```

## 9. 配置新增

```yaml
# application.yml — Spring AI Alibaba 百炼配置
spring:
  ai:
    dashscope:
      api-key: ${DASHSCOPE_API_KEY}    # 百炼平台 API Key
      chat:
        options:
          model: deepseek-chat          # 可选 deepseek-chat / deepseek-r1 / qwen-max
          temperature: 0.7
          max-tokens: 4096
```

## 10. 非功能需求

- SSE 连接超时 60s，断线前端提示「连接中断，请重试」
- AI 回复限长 4096 tokens
- 单用户并发会话上限 50 个
- API Key 仅存后端 `application.yml`，前端永不接触
- 所有会话/消息查询必须按 `user_id` 过滤（数据隔离，同任务模块）
- 消息内容 TEXT 字段不限长，但前端显示超过 2000 字折叠

## 11. 后端模块结构（规划）

```
com.myplanner.chat
├── controller/ChatController.java        会话 + 消息 + 转待办接口
├── service/ChatService.java              业务逻辑（注入 ChatClient）
├── config/ChatClientConfig.java          ChatClient Bean 配置（defaultSystem 等）
├── entity/SysChatSession.java
├── entity/SysChatMessage.java
└── mapper/SysChatSessionMapper.java
    mapper/SysChatMessageMapper.java
```

### 关键代码示意（流式对话）

```java
// ChatService — 流式调用，返回 Flux 直接转 SSE
public Flux<String> streamChat(Long sessionId, String userMessage) {
    // 1. 取历史消息构造上下文
    List<Message> messages = buildContext(sessionId, userMessage);
    // 2. ChatClient 流式调用
    return chatClient.prompt()
        .messages(messages)
        .stream()
        .content();
}

// ChatController — SSE 端点
@PostMapping(value = "/sessions/{id}/messages", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ServerSentEvent<String>> sendMessage(...) {
    return chatService.streamChat(id, content)
        .map(chunk -> ServerSentEvent.builder(chunk).build());
}
```

## 12. 前端模块结构（规划）

```
src/
├── api/chat.js                           会话/消息/转待办 API
├── components/
│   ├── ChatMessage.jsx                   单条消息气泡（含 Markdown 渲染）
│   ├── ChatInput.jsx                     输入框 + 发送/停止按钮
│   └── SessionList.jsx                   左侧会话列表
└── pages/Chat.jsx                        替换占位页，实现完整对话
```
