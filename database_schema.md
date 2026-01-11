# Database Schema Documentation

## Entity Relationship Diagram

```mermaid
erDiagram
    ROLE ||--o{ USER : "assigned to"
    LOCATION ||--o{ USER : "belongs to"
    TEAM ||--o{ USER : "part of"
    USER ||--o{ USER_SESSION : "has"
    USER ||--o{ AUTH_ATTEMPT : "performs"
    USER ||--o{ PASSWORD_RESET : "requests"
    USER ||--o{ PATIENT : "manages"
    USER ||--o{ PATIENT_AUDIT_LOG : "performs action"

    ROLE {
        uuid id PK
        string name UK
        string display_name
        string description
        integer hierarchy_level
        datetime created_at
    }

    LOCATION {
        uuid id PK
        string code UK
        string name
        string timezone
        boolean is_active
        datetime created_at
    }

    TEAM {
        uuid id PK
        string code UK
        string name
        string description
        boolean is_active
        datetime created_at
    }

    USER {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        uuid role_id FK
        uuid location_id FK
        uuid team_id FK
        boolean is_active
        integer failed_login_attempts
        datetime locked_until
        datetime created_at
        datetime updated_at
    }

    PATIENT {
        uuid id PK
        string patient_id UK "Plaintext"
        string first_name "AES-256 Encrypted"
        string last_name "AES-256 Encrypted"
        string date_of_birth "AES-256 Encrypted"
        string gender "AES-256 Encrypted"
        uuid manager_id FK
        datetime created_at
        datetime updated_at
    }

    PATIENT_AUDIT_LOG {
        uuid id PK
        string action
        uuid performed_by_id FK
        uuid patient_record_id
        string details
        string client_ip
        datetime timestamp
    }

    USER_SESSION {
        uuid id PK
        uuid user_id FK
        string access_token UK
        string refresh_token UK
        string ip_address
        text user_agent
        datetime expires_at
        datetime created_at
    }

    AUTH_ATTEMPT {
        uuid id PK
        uuid user_id FK
        string email
        boolean success
        string ip_address
        text user_agent
        text failure_reason
        datetime attempted_at
    }

    PASSWORD_RESET {
        uuid id PK
        uuid user_id FK
        string reset_token UK
        boolean is_used
        datetime expires_at
        datetime created_at
        datetime used_at
    }
```

## Table Descriptions

### roles
Defines the hierarchical permission structure (`hierarchy_level`: 1=Admin, 2=Manager, 3=User).

### locations
Geographic locations for user assignment (US, IN, EU, AU).

### teams
Organizational teams (AR, EPA, PRI).

### users
The central entity for authentication and authorization. Stores hashed passwords (Argon2id) and account status.

### patients (Assignment 2)
Stores patient records with **Application-Level Encryption (AES-256-GCM)** for all PII fields. Only `patient_id` remains in plaintext for indexing.

### phi_audit_logs (Assignment 2)
Maintains a strict record of all PHI access and modifications for HIPAA compliance.

### user_sessions
Tracks active JWT sessions for revocation capability during logout or security breaches.

### auth_attempts
Security audit log for all failed and successful login attempts.

### password_resets
Stores temporary tokens for the secure password reset flow.
