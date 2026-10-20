package com.finsight.finsight_api.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateNameRequest {
    @NotBlank(message = "Name cannot be empty.")
    @Size(min = 3, max = 150, message = "Name must be between 3 and 150 characters.")
    private String newName;
}