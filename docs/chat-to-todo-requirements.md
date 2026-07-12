# 聊天记录转待办功能需求文档

## 1. 功能目标

- 选择一个历史会话，AI 自动扫描全部消息，用 Function Calling 抽取可执行的任务候选清单
- 用户勾选/编辑/删除候选任务，确认后批量创建为待办
- 抽取结果可追溯：每条候选任务标注来源消息片段
- 已抽取过的消息不再重复抽取（去重标记）

## 2. 用户故事

- 作为用户，我希望选一个之前讨论计划的会话，AI 帮我提炼出所有待办事项
- 作为用户，我希望对 AI 抽取的任务逐条确认/修改/取消，再批量加入待办
- 作为用户，我希望知道每条任务是从哪句对话里提炼出来的（可回溯）
- 作为用户，我希望已抽取过的会话再次抽取时，只返回新增的任务

## 3. 交互流程

### 3.1 选择会话与抽取
1. 进入 `/chat-to-todo` → 显示会话选择器（下拉 + 会话预览卡片，含消息数/最后更新时间）
2. 选择会话后 → 点击「智能抽取待办」主按钮
3. Loading 态：显示「AI 正在分析对话...」+ 骨架屏（预计 3-8s）
4. 抽取完成 → 展示候选任务卡片列表

### 3.2 候选任务编辑
每张候选任务卡片含：
- 勾选框（默认勾选）
- 标题（可编辑，inline 输入框）
- 描述（可编辑，textarea）
- 截止日期（可编辑，date picker，AI 推断或留空）
- 来源片段（折叠展示原文，点击展开高亮匹配句）
- 删除按钮（移除该候选）

### 3.3 批量创建
1. 底部固定操作栏：「已选 N 项」+「全选/反选」+「批量创建 (N)」按钮
2. 点击「批量创建」→ 二次确认 → 调用批量创建接口
3. 创建成功：Toast「成功创建 N 个任务」→ 清空候选列表 → 显示成功状态
4. 部分失败：标记失败项，保留可重试

### 3.4 空状态与边界
- 无会话：显示「还没有对话记录，先去 AI 对话页聊聊吧」+ 跳转按钮
- 会话无消息：显示「该会话暂无消息」
- AI 未抽取到任务：显示「AI 没有从对话中发现可执行的任务」
- 已全部抽取过：显示「该会话的任务已全部抽取」

## 4. 接口设计

### 4.1 抽取任务接口

```
POST /api/chat/sessions/{id}/extract-tasks
  请求: { }（读取该会话全部未抽取消息）
  响应（同步）:
  {
    "candidates": [
      {
        "title": "完成季度报告",
        "description": "整理 Q3 数据并撰写报告",
        "dueDate": "2026-07-20",
        "sourceMessageId": 45,
        "sourceSnippet": "你下周需要完成季度报告，整理 Q3 数据..."
      }
    ],
    "extractedMessageIds": [44, 45, 46]
  }
```

### 4.2 批量创建接口

```
POST /api/chat/tasks/batch
  请求:
  {
    "tasks": [
      { "title": "完成季度报告", "description": "...", "dueDate": "2026-07-20" }
    ]
  }
  响应:
  { "created": 3, "failed": 0 }
```

## 5. Function Calling Schema

```json
{
  "name": "create_tasks",
  "description": "从对话中抽取待办任务，仅抽取明确的、可执行的任务",
  "parameters": {
    "type": "object",
    "properties": {
      "tasks": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "description": "任务标题，简洁可执行，不超过50字"
            },
            "description": {
              "type": "string",
              "description": "任务详细描述，可包含上下文"
            },
            "dueDate": {
              "type": "string",
              "format": "date",
              "description": "截止日期 YYYY-MM-DD，若对话中无明确日期则留空"
            }
          },
          "required": ["title"]
        }
      }
    },
    "required": ["tasks"]
  }
}
```

### Prompt 模板（草案）

```
system: 你是任务抽取助手。分析以下对话，用 create_tasks 工具抽取所有明确的、可执行的任务。
要求：
1. 仅抽取可执行的具体任务，忽略寒暄、提问、意见
2. 标题简洁（动词开头），不超过50字
3. 若对话中提到明确日期则填 dueDate，否则留空
4. 不要编造对话中未提及的信息

user: [会话全部消息拼接，带序号]
```

## 6. 数据库补充

复用 Part 2 的 `sys_chat_session` / `sys_chat_message` 表，新增去重标记字段：

```sql
ALTER TABLE sys_chat_message ADD COLUMN extracted TINYINT NOT NULL DEFAULT 0
  COMMENT '是否已被抽取过任务 0否1是';
```

抽取时仅扫描 `extracted = 0` 的消息，抽取完成后将对应消息标记为 `extracted = 1`。

## 7. 技术栈

复用 Part 2 的 Spring AI Alibaba + DashScope 基础设施：

| 层 | 选型 | 说明 |
|----|------|------|
| AI 抽取 | Spring AI ChatClient + Function Calling | 用 `@Tool` 注解定义抽取方法，ChatClient 自动处理工具调用循环，无需手写 JSON schema 解析 |
| 响应模式 | 同步（非流式） | 抽取为一次性操作，用 `chatClient.prompt(...).entity(TaskList.class)` 直接映射 POJO，无需打字机效果 |
| 结构化输出 | Spring AI `entity()` | AI 返回自动反序列化为 `TaskList` 对象，避免手动解析 JSON |
| 前端组件 | 复用 `TaskForm` 样式 | 候选任务卡片复用现有表单组件风格 |
| 批量创建 | 复用现有 Task 接口风格 | 新增 `POST /api/chat/tasks/batch` |

### 关键代码示意（Function Calling 抽取）

```java
// 用 @Tool 注解定义抽取工具，ChatClient 自动处理调用循环
public class TaskExtractorTool {

    @Tool(description = "从对话中抽取待办任务，仅抽取明确的、可执行的任务")
    public List<TaskCandidate> createTasks(
            @ToolParam(description = "抽取出的任务列表") List<TaskCandidate> tasks) {
        return tasks;  // 框架自动将 AI 返回的 JSON 映射为 POJO
    }
}

// ChatService — 同步调用，结构化输出
public List<TaskCandidate> extractTasks(Long sessionId) {
    String conversation = buildConversationContext(sessionId);
    return chatClient.prompt()
        .system("你是任务抽取助手。分析对话，用 createTasks 工具抽取可执行任务...")
        .user(conversation)
        .tools(new TaskExtractorTool())
        .call()
        .entity(new ParameterizedTypeReference<List<TaskCandidate>>() {});
}
```

## 8. 非功能需求

- 单次抽取会话消息上限 100 条（超出则截断最早的，并提示「仅分析最近100条消息」）
- 抽取超时 30s，超时前端提示「AI 分析超时，请重试」
- 候选任务标题去重（同一会话内已抽取过的消息不再抽取）
- 抽取请求串行（同一会话不允许并发抽取，防止重复标记）
- 所有操作按 `user_id` 隔离

## 9. 前端模块结构（规划）

```
src/
├── api/chatToTodo.js                     抽取 + 批量创建 API
├── components/
│   ├── SessionSelector.jsx               会话选择器
│   ├── TaskCandidateCard.jsx             候选任务卡片（可编辑）
│   └── CandidateToolbar.jsx              底部操作栏
└── pages/ChatToTodo.jsx                  替换占位页，实现完整功能
```

## 10. 后端模块补充（规划）

在 `com.myplanner.chat` 包下新增：

```
├── controller/ChatToTodoController.java  抽取 + 批量创建接口
└── service/TaskExtractor.java            Function Calling 抽取逻辑
```
