package io.docflow.auth.controller;

import io.docflow.auth.dto.AssignRoleRequest;
import io.docflow.auth.dto.CreateUserRequest;
import io.docflow.auth.dto.UserResponse;
import io.docflow.auth.service.KeycloakUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {

    private final KeycloakUserService userService;

    public UserController(KeycloakUserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@Valid @RequestBody CreateUserRequest request) {
        return userService.createUser(request);
    }

    @GetMapping("/{userId}")
    public UserResponse getUser(@PathVariable String userId) {
        return userService.getUser(userId);
    }

    @PostMapping("/{userId}/roles")
    public UserResponse assignRole(@PathVariable String userId,
                                   @Valid @RequestBody AssignRoleRequest request) {
        return userService.assignRole(userId, request.role());
    }
}
