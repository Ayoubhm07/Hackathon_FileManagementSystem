package io.docflow.auth.service;

import io.docflow.auth.dto.CreateUserRequest;
import io.docflow.auth.dto.UserResponse;
import jakarta.ws.rs.core.Response;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;

@Service
public class KeycloakUserService {

    private static final Logger log = LoggerFactory.getLogger(KeycloakUserService.class);

    private final Keycloak keycloak;
    private final String realm;

    public KeycloakUserService(Keycloak keycloak,
                               @Value("${keycloak.realm}") String realm) {
        this.keycloak = keycloak;
        this.realm = realm;
    }

    public UserResponse createUser(CreateUserRequest req) {
        UserRepresentation user = new UserRepresentation();
        user.setEmail(req.email());
        user.setUsername(req.email());
        user.setFirstName(req.firstName());
        user.setLastName(req.lastName());
        user.setEnabled(true);
        user.setEmailVerified(true);

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(req.password());
        credential.setTemporary(false);
        user.setCredentials(List.of(credential));

        UsersResource usersResource = realmResource().users();
        try (Response response = usersResource.create(user)) {
            if (response.getStatus() == 409) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists: " + req.email());
            }
            if (response.getStatus() != 201) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Keycloak returned: " + response.getStatus());
            }

            String location = response.getHeaderString("Location");
            String userId = location.substring(location.lastIndexOf('/') + 1);
            log.info("User created id={} email={}", userId, req.email());
            return getUser(userId);
        }
    }

    public UserResponse getUser(String userId) {
        UserRepresentation rep = realmResource().users().get(userId).toRepresentation();
        List<String> roles = realmResource().users().get(userId)
                .roles().realmLevel().listEffective()
                .stream()
                .map(RoleRepresentation::getName)
                .filter(r -> r.startsWith("ROLE_"))
                .toList();

        return new UserResponse(rep.getId(), rep.getEmail(), rep.getFirstName(),
                rep.getLastName(), Boolean.TRUE.equals(rep.isEnabled()), roles);
    }

    public UserResponse assignRole(String userId, String roleName) {
        RoleRepresentation role = realmResource().roles().get(roleName).toRepresentation();
        realmResource().users().get(userId).roles().realmLevel()
                .add(Collections.singletonList(role));
        log.info("Role {} assigned to user {}", roleName, userId);
        return getUser(userId);
    }

    private RealmResource realmResource() {
        return keycloak.realm(realm);
    }
}
