%%{init: {
  "theme": "neutral",
  "flowchart": { "rankSpacing": 40, "nodeSpacing": 30 }
}}%%
graph LR
    classDef table fill:#ffffff,stroke:#000000,stroke-width:1px,color:#000000,font-size:14px;

    subgraph USERS
        U1["id : SERIAL (PK)"]:::table
        U2["email : VARCHAR"]:::table
        U3["password : VARCHAR"]:::table
        U4["created_at : TIMESTAMP"]:::table
    end

    subgraph ROOM_LAYOUTS
        R1["id : SERIAL (PK)"]:::table
        R2["user_id : INT (FK)"]:::table
        R3["layout_name : VARCHAR(100)"]:::table
        R4["layout_data : JSONB"]:::table
        R5["created_at : TIMESTAMP"]:::table
        R6["updated_at : TIMESTAMP"]:::table
    end

    USERS -->|1:N| ROOM_LAYOUTS
