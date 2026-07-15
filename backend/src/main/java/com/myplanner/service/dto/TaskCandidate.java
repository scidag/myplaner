package com.myplanner.service.dto;

import lombok.Data;

@Data
public class TaskCandidate {
    private String title;
    private String description;
    private String dueDate;
    private Long sourceMessageId;
    private String sourceSnippet;
}
