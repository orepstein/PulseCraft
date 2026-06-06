# RealTimeDash - Data Pipeline Architecture

## The Flow
`[HTTP POST]` -> **Backend** (Port 3000) -> **CloudAMQP** (RabbitMQ) -> **Worker** -> **PostgreSQL** (analytics_db)

## Infrastructure Fixes Applied in .idx/dev.nix

To ensure a stable and persistent development environment within IDX, the following critical infrastructure configurations were implemented:

1.  **Database Path**: Initialized locally inside `$PWD/db` to guarantee full read/write persistence within the workspace.
2.  **Network Binding**: Added `listen_addresses = 'localhost'` to enable TCP/IP network traffic on port 5432.
3.  **Permissions Bypass**: Configured `unix_socket_directories = '$DB_DIR'` to prevent crashes caused by restricted system paths (`/run/postgresql`).
4.  **Prisma Authentication**: Appended `user:@` prefix to the `DATABASE_URL` string to allow flawless migration deployment during startup.

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL
- Redis
- CloudAMQP Account (RabbitMQ)

### Installation
1. Clone the repository.
2. Run `npm install` in both `/backend` and `/worker` directories.
3. Ensure your `.idx/dev.nix` is loaded to automate the infrastructure startup.

### Environment Variables
The following environment variables are required:
- `RABBITMQ_URL`: Your CloudAMQP connection string.
- `DATABASE_URL`: `postgresql://user:@localhost:5432/analytics_db`

### Running the Pipeline
The environment is configured to auto-start all services. To manually trigger an event for testing:

```bash
curl -X POST -H "Content-Type: application/json" \
-d '{"event_type": "test_event", "user_id": "system_admin"}' \
http://localhost:3000/api/events
```

To verify the data in PostgreSQL:
```bash
psql -h localhost -d analytics_db -c "SELECT * FROM events;"
```