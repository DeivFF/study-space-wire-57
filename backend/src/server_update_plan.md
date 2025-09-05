# Server.js Update Plan

## Overview

This document outlines the changes needed to register the connections routes in the main server file.

## Current Server Structure

The server.js file currently imports and registers the following routes:

- authRoutes: `/api/auth`
- profileRoutes: `/api/profile`

## Required Changes

1. Import the connections routes module
2. Register the connections routes with the appropriate path

## Implementation Steps

### 1. Import Connections Routes

Add the following import statement near the other route imports:

```javascript
import connectionsRoutes from "./routes/connections.js";
```

### 2. Register Connections Routes

Add the following line near the other app.use route registrations:

```javascript
app.use("/api/connections", connectionsRoutes);
```

## Final Structure

After the changes, the route registration section should look like this:

```javascript
// API routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/connections", connectionsRoutes);
```

## Testing

After implementing these changes, verify that:

1. The server starts without errors
2. The new routes are accessible
3. Existing routes continue to work as expected
