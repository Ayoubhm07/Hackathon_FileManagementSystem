package io.docflow.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AssignRoleRequest(
        @NotBlank
        @Pattern(regexp = "ROLE_OPERATOR|ROLE_VALIDATOR|ROLE_ADMIN",
                 message = "Role must be one of: ROLE_OPERATOR, ROLE_VALIDATOR, ROLE_ADMIN")
        String role
) {}
