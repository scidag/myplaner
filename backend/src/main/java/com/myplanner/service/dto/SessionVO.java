package com.myplanner.service.dto;

import com.myplanner.entity.SysChatSession;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionVO {
    private SysChatSession session;
    private String lastMessage;
}
