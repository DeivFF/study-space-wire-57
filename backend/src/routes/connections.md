# Connections Routes

## Overview

This file defines all the API endpoints for managing user connections (friendships) in the application.

## Route Definitions

### 1. Send Connection Request

- **Method**: POST
- **Path**: `/api/connections`
- **Middleware**: authenticateToken
- **Controller**: connectionsController.sendConnectionRequest
- **Description**: Send a connection request to another user

### 2. Search Users

- **Method**: GET
- **Path**: `/api/connections/search`
- **Middleware**: authenticateToken
- **Controller**: connectionsController.searchUsers
- **Description**: Search for users by name or nickname

### 3. Get Connection Requests

- **Method**: GET
- **Path**: `/api/connections/requests`
- **Middleware**: authenticateToken
- **Controller**: connectionsController.getConnectionRequests
- **Description**: Get pending connection requests for the current user

### 4. Respond to Connection Request

- **Method**: PUT
- **Path**: `/api/connections/:id`
- **Middleware**: authenticateToken
- **Controller**: connectionsController.respondToConnectionRequest
- **Description**: Accept or reject a connection request

### 5. Remove Connection

- **Method**: DELETE
- **Path**: `/api/connections/:id`
- **Middleware**: authenticateToken
- **Controller**: connectionsController.removeConnection
- **Description**: Remove an existing connection or cancel a pending request

### 6. Get Connections

- **Method**: GET
- **Path**: `/api/connections`
- **Middleware**: authenticateToken
- **Controller**: connectionsController.getConnections
- **Description**: Get all connections for the current user

### 7. Block User

- **Method**: POST
- **Path**: `/api/connections/block`
- **Middleware**: authenticateToken
- **Controller**: connectionsController.blockUser
- **Description**: Block a user from sending connection requests

### 8. Unblock User

- **Method**: DELETE
- **Path**: `/api/connections/block/:id`
- **Middleware**: authenticateToken
- **Controller**: connectionsController.unblockUser
- **Description**: Unblock a previously blocked user

## Implementation Notes

- All routes require authentication via the authenticateToken middleware
- Request validation should be implemented for routes that accept data
- Error handling should be consistent across all routes
- Proper HTTP status codes should be returned:
  - 200: Success
  - 201: Created
  - 400: Bad Request
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not Found
  - 500: Internal Server Error
