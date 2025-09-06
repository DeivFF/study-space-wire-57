# Notifications System Implementation Plan

## Overview

This document outlines the implementation of a notifications system to inform users about connection requests, acceptances, and other social interactions.

## Current System Structure

The current system has:

- Basic notification icons in the header (Friends and Chat)
- Friend requests count in the header
- No dedicated notifications system
- No persistent notification storage
- No notification history

## Required Notification Features

### 1. Notification Types

- Connection request received
- Connection request accepted
- Connection request rejected
- New friend activity (optional)
- Profile view (optional, only for private profiles)

### 2. Notification Storage

- Store notifications in the database
- Track read/unread status
- Implement notification expiration (optional)

### 3. Real-time Delivery

- Show notifications as they occur
- Update notification counts in real-time
- Handle multiple notifications

### 4. Notification Management

- View notification history
- Mark notifications as read
- Delete notifications
- Configure notification preferences

## Database Design

### notifications Table

```sql
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'connection_request', 'connection_accepted', etc.
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    related_id UUID, -- ID of related entity (connection request ID, etc.)
    title VARCHAR(25),
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
```

## Implementation Steps

### Step 1: Create Notifications Migration

Create a database migration for the notifications table:

- Define the table structure
- Add appropriate indexes
- Consider notification expiration (optional)

### Step 2: Create Notifications API

Implement API endpoints for notifications:

- GET /api/notifications - Get user notifications
- PUT /api/notifications/:id/read - Mark notification as read
- DELETE /api/notifications/:id - Delete notification
- PUT /api/notifications/read-all - Mark all as read

### Step 3: Implement Notification Triggers

Add notification creation to relevant actions:

- When sending a connection request
- When accepting a connection request
- When rejecting a connection request

Example for connection request:

```javascript
const createConnectionRequestNotification = async (requesterId, receiverId) => {
  try {
    const requesterResult = await pool.query(
      "SELECT name FROM users WHERE id = $1",
      [requesterId]
    );

    const requesterName = requesterResult.rows[0]?.name || "Alguém";

    await pool.query(
      `INSERT INTO notifications (user_id, type, sender_id, title, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        receiverId,
        "connection_request",
        requesterId,
        "Nova solicitação de conexão",
        `${requesterName} enviou uma solicitação de conexão`,
      ]
    );
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};
```

### Step 4: Update Header Component

Modify the FeedHeader to show notifications:

- Add notification icon with count
- Create notification dropdown
- Implement real-time updates

```jsx
// Add to FeedHeader state
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);

// Fetch notifications
const fetchNotifications = async () => {
  try {
    const response = await fetch("/api/notifications", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (data.success) {
      setNotifications(data.data.notifications);
      setUnreadCount(data.data.unreadCount);
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
};

// Mark notification as read
const markAsRead = async (notificationId) => {
  try {
    await fetch(`/api/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Update local state
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );

    setUnreadCount((prev) => Math.max(0, prev - 1));
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};
```

### Step 5: Create Notification Dropdown

Create a dropdown to display notifications:

```jsx
const NotificationDropdown = ({ notifications, onClose, onMarkAsRead }) => {
  return (
    <div className="absolute right-0 mt-2 w-80 bg-app-panel border border-app-border rounded-lg shadow-lg z-50">
      <div className="p-3 border-b border-app-border">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-app-text">Notificações</h3>
          <button
            onClick={onClose}
            className="text-app-text-muted hover:text-app-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-app-text-muted">
            Nenhuma notificação
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 border-b border-app-border hover:bg-app-muted ${
                !notification.read ? "bg-app-bg-soft" : ""
              }`}
            >
              <div className="flex justify-between">
                <div className="font-medium text-app-text">
                  {notification.title}
                </div>
                {!notification.read && (
                  <span className="w-2 h-2 bg-app-accent rounded-full"></span>
                )}
              </div>
              <p className="text-sm text-app-text-muted mt-1">
                {notification.message}
              </p>
              <div className="text-xs text-app-text-muted mt-2">
                {formatTimeAgo(notification.createdAt)}
              </div>
              {!notification.read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-xs text-app-accent hover:underline mt-1"
                >
                  Marcar como lida
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-app-border text-center">
        <button className="text-sm text-app-accent hover:underline">
          Ver todas as notificações
        </button>
      </div>
    </div>
  );
};
```

### Step 6: Update Friend Requests Count

Modify the friend requests count to use notifications:

```javascript
// Instead of a separate friendRequestsCount, use unread notifications
// of type 'connection_request'
const connectionRequestNotifications = notifications.filter(
  (n) => n.type === "connection_request" && !n.read
);
```

### Step 7: Add Notification Preferences

Allow users to configure notification preferences:

- Enable/disable specific notification types
- Configure notification delivery (email, push, in-app)

## Real-time Considerations

- Implement WebSocket connections for real-time notifications (optional enhancement)
- Use polling as a fallback for real-time updates
- Handle notification batching for multiple simultaneous notifications

## Performance Considerations

- Implement pagination for notification history
- Add indexes for efficient querying
- Consider archiving old notifications
- Cache frequently accessed notifications

## Error Handling

- Handle network errors gracefully
- Provide offline notification support
- Retry failed notification deliveries
- Show user-friendly error messages

## UI/UX Considerations

- Design consistent notification styling
- Provide clear visual indicators for unread notifications
- Ensure notifications are accessible
- Make notification management intuitive
- Handle notification overflow appropriately

## Testing Considerations

- Test notification creation and delivery
- Verify notification persistence
- Test edge cases (offline, errors, etc.)
- Ensure notification preferences work correctly
- Test real-time updates (if implemented)
