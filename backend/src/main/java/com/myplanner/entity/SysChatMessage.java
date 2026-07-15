package com.myplanner.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_chat_message")
public class SysChatMessage {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long sessionId;
    private String role;
    private String content;
    /** AI 调用错误码，null 表示成功；非 null 表示本次 AI 响应失败 */
    private String errorCode;
    /** AI 调用错误详情，errorCode 非空时填充 */
    private String errorMessage;
    private Integer extracted;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
