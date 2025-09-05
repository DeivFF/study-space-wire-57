# Backend Setup and Migration Guide

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- Bun package manager

## Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Set up the database:

   - Make sure PostgreSQL is running
   - Update the database configuration in `.env` if needed

3. Run migrations:
   ```bash
   bun run migrate
   ```

## Migration Files

The migrations are run in numerical order:

1. `001_create_auth_tables.sql` - Creates the basic authentication tables
2. `002_add_name_to_users.sql` - Adds name column to users table
3. `003_add_refresh_tokens_table.sql` - Adds refresh tokens table
4. `004_add_onboarding_fields.sql` - Adds onboarding completed flag and profile constraints
5. `005_add_profile_fields.sql` - Adds additional profile fields

## Running the Server

To start the development server:

```bash
bun run dev
```

The backend API will be available at `http://localhost:3002`

## Testing the Connection

To verify that the backend is running and accessible:

````bash
bun run test-connection
## Testing Profile Endpoint

To test the profile endpoint:
```bash
## Checking Database Schema

To check if the database schema is correct:
```bash
bun run check-schema
```
bun run test-profile
````

```

```
