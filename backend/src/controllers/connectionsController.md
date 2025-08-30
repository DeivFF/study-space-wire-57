# Connections Controller

## Overview

This controller handles all user connection (friendship) functionality including sending requests, accepting/rejecting requests, and managing connections.

## Functions

### 1. sendConnectionRequest

- **Endpoint**: POST /api/connections
- **Description**: Send a connection request to another user
- **Parameters**:
  - `receiverId` (UUID): ID of the user to send the request to
- **Returns**:
  - Success message and connection object
- **Error Cases**:
  - User tries to connect with themselves
  - Connection request already exists
  - Receiver user not found
  - User is blocked by receiver

### 2. searchUsers

- **Endpoint**: GET /api/connections/search
- **Description**: Search for users by name/nickname
- **Parameters**:
  - `query` (string): Search term
  - `limit` (number, optional): Maximum number of results (default: 10)
- **Returns**:
  - Array of user objects with id, name, nickname, avatar
- **Error Cases**:
  - Invalid search query
  - Database error

### 3. getConnectionRequests

- **Endpoint**: GET /api/connections/requests
- **Description**: Get pending connection requests for the current user
- **Parameters**: None
- **Returns**:
  - Array of connection request objects with requester info
- **Error Cases**:
  - Database error

### 4. respondToConnectionRequest

- **Endpoint**: PUT /api/connections/:id
- **Description**: Accept or reject a connection request
- **Parameters**:
  - `id` (UUID): ID of the connection request
  - `action` (string): "accept" or "reject"
- **Returns**:
  - Success message and updated connection object
- **Error Cases**:
  - Connection request not found
- User not authorized to respond to this request
- Invalid action parameter

### 5. removeConnection

- **Endpoint**: DELETE /api/connections/:id
- **Description**: Remove an existing connection or cancel a pending request
- **Parameters**:
  - `id` (UUID): ID of the connection
- **Returns**:
  - Success message
- **Error Cases**:
  - Connection not found
  - User not authorized to remove this connection

### 6. getConnections

- **Endpoint**: GET /api/connections
- **Description**: Get all connections for the current user
- **Parameters**:
  - `status` (string, optional): Filter by connection status (default: "accepted")
- **Returns**:
  - Array of connection objects with user info
- **Error Cases**:
  - Database error

### 7. blockUser

- **Endpoint**: POST /api/connections/block
- **Description**: Block a user from sending connection requests
- **Parameters**:
  - `userId` (UUID): ID of the user to block
- **Returns**:
  - Success message
- **Error Cases**:
  - User tries to block themselves
  - User already blocked

### 8. unblockUser

- **Endpoint**: DELETE /api/connections/block/:id
- **Description**: Unblock a previously blocked user
- **Parameters**:
  - `id` (UUID): ID of the blocked connection
- **Returns**:
  - Success message
- **Error Cases**:
  - Block relationship not found
  - User not authorized to unblock

## Data Models

### Connection Object

```json
{
  "id": "uuid",
  "requesterId": "uuid",
  "receiverId": "uuid",
  "status": "pending|accepted|rejected|blocked",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### User Object (for search results)

```json
{
  "id": "uuid",
  "name": "string",
  "nickname": "string",
  "avatarUrl": "string"
}
```

## Implementation Notes

- All functions should be wrapped in asyncHandler for error handling
- Authentication is required for all endpoints
- Proper validation should be implemented for all inputs
- Database queries should use parameterized statements to prevent SQL injection
- Consider implementing pagination for search results and connection lists
