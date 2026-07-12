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
    private Integer extracted;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
