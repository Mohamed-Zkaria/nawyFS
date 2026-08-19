```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant API as API Server
    participant DB as Database

    Admin->>API: DELETE /api/apartments/123
    Note over Admin,API: Request includes Admin Token
    
    API->>API: Validate Admin Token
    alt Invalid Token / Not Admin
        API-->>Admin: 403 Forbidden
    else Valid Admin
        API->>DB: Check if apartment 123 exists
        DB-->>API: Return result
        
        alt Apartment not found
            API-->>Admin: 404 Not Found
        else Apartment found
            API->>DB: DELETE FROM apartments WHERE id = 123
            DB-->>API: Deletion successful
            API-->>Admin: 204 No Content
        end
    end
```