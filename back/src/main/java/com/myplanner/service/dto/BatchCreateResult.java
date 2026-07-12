package com.myplanner.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BatchCreateResult {
    private int created;
    private int failed;
}
