> Updated to match what shipped (see root `README.md` → "Deviations from
> `InitialSystemDesign/`" for the full list and reasoning). Original draft
> had a flat `apartments.project` string and a single `image` field —
> shipped with `projects` normalized into its own table and images as a
> one-to-many `apartment_images` table.

```mermaid
erDiagram
    PROJECTS ||--o{ APARTMENTS : has
    APARTMENTS ||--o{ APARTMENT_IMAGES : has

    PROJECTS {
        uuid id PK
        string name
        string slug UK
        string city
    }

    APARTMENTS {
        uuid id PK
        string unit_name
        string unit_number
        uuid project_id FK
        string description
        numeric price
        smallint bedrooms
        smallint bathrooms
        numeric area_sqm
        timestamp deleted_at "soft delete"
    }

    APARTMENT_IMAGES {
        uuid id PK
        uuid apartment_id FK
        string url "admin-supplied external URL, not an upload"
        smallint sort_order
    }

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string role "admin | normal"
    }
```
