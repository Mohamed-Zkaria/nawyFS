```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant API as API Server
    participant DB as Database

    Admin->>API: GET /api/apartments/123
    Note over Admin,API: Request includes Admin Token
    
    API->>API: Validate Admin Token
    alt Invalid Token / Not Admin
        API-->>Admin: 403 Forbidden
    else Valid Admin
        API->>DB: SELECT * FROM apartments WHERE id = 123
        DB-->>API: Return result
        
        alt Apartment not found
            API-->>Admin: 404 Not Found
        else Apartment found
            API-->>Admin: 200 OK (Returns apartment object)
        end
    end

```