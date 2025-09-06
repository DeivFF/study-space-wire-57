# FriendsPanel Update Plan

## Overview

This document outlines the updates needed for the FriendsPanel component to manage connection requests and friends list.

## Current Component Structure

The FriendsPanel component currently:

- Has mock data for friend requests
- Has mock data for friends list
- Implements basic accept/deny functionality for requests
- Does not connect to backend API
- Does not fetch real data

## Required Changes

### 1. API Integration

Implement API calls to:

- Fetch real connection requests
- Fetch real friends list
- Accept/reject connection requests
- Remove friends

### 2. State Management

Update state management to:

- Store real data from API
- Handle loading states
- Handle errors appropriately

### 3. Request Management

Enhance request management to:

- Show requester information (name, avatar, mutual friends)
- Implement accept/reject functionality with API calls
- Update UI after actions

### 4. Friends List

Enhance friends list to:

- Show real friends with status (online/offline)
- Implement remove friend functionality
- Add search/filter capabilities

## Implementation Steps

### Step 1: Add API Integration Functions

```javascript
// Fetch connection requests
const fetchConnectionRequests = async () => {
  try {
    const response = await fetch("/api/connections/requests", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (data.success) {
      setRequests(data.data);
    }
  } catch (error) {
    console.error("Error fetching requests:", error);
  }
};

// Fetch friends list
const fetchFriends = async () => {
  try {
    const response = await fetch("/api/connections?status=accepted", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (data.success) {
      setFriends(data.data);
    }
  } catch (error) {
    console.error("Error fetching friends:", error);
  }
};
```

### Step 2: Update Component State

```javascript
const [requests, setRequests] = useState([]);
const [friends, setFriends] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

### Step 3: Implement Request Actions

```javascript
// Accept connection request
const handleAcceptRequest = async (requestId) => {
  try {
    const response = await fetch(`/api/connections/${requestId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ action: "accept" }),
    });

    const data = await response.json();
    if (data.success) {
      // Remove from requests list
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
      // Update requests count
      onRequestsUpdate(requests.length - 1);
      // Optionally refresh friends list
    }
  } catch (error) {
    console.error("Error accepting request:", error);
  }
};

// Deny connection request
const handleDenyRequest = async (requestId) => {
  try {
    const response = await fetch(`/api/connections/${requestId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ action: "reject" }),
    });

    const data = await response.json();
    if (data.success) {
      // Remove from requests list
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
      // Update requests count
      onRequestsUpdate(requests.length - 1);
    }
  } catch (error) {
    console.error("Error denying request:", error);
  }
};
```

### Step 4: Update Data Fetching

```javascript
// Fetch data when panel opens
useEffect(() => {
  if (isOpen) {
    fetchConnectionRequests();
    fetchFriends();
  }
}, [isOpen]);
```

### Step 5: Update UI Components

Update the requests tab to use real data:

```jsx
{
  requests.length === 0 ? (
    <div className="text-center py-8 text-app-text-muted">
      Nenhuma solicitação pendente
    </div>
  ) : (
    requests.map((request) => (
      <div
        key={request.id}
        className="flex items-center gap-2 p-2 border border-app-border rounded-lg"
      >
        <div className="w-8 h-8 bg-app-muted rounded-full flex items-center justify-center font-medium text-sm text-app-text">
          {request.requester.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm text-app-text">
            {request.requester.name}
          </div>
          <div className="text-xs text-app-text-muted">
            {request.mutualFriends || 0} amigos em comum
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => handleAcceptRequest(request.id)}
            className="w-6 h-6 bg-app-success hover:bg-opacity-80 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleDenyRequest(request.id)}
            className="w-6 h-6 bg-app-muted hover:bg-app-border text-app-text rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    ))
  );
}
```

Update the friends tab to use real data:

```jsx
{
  friends.map((friend) => (
    <div
      key={friend.id}
      className="flex items-center gap-2 p-2 border border-app-border rounded-lg hover:bg-app-muted transition-colors"
    >
      <div className="relative">
        <div className="w-8 h-8 bg-app-muted rounded-full flex items-center justify-center font-medium text-sm text-app-text">
          {friend.name.charAt(0)}
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-app-panel ${
            friend.status === "online" ? "bg-app-success" : "bg-app-text-muted"
          }`}
        />
      </div>
      <div className="flex-1">
        <div className="font-medium text-sm text-app-text">{friend.name}</div>
        <div className="text-xs text-app-text-muted capitalize">
          {friend.status}
        </div>
      </div>
      <button
        onClick={() => handleRemoveFriend(friend.id)}
        className="text-app-text-muted hover:text-app-danger"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  ));
}
```

## Error Handling

- Display user-friendly error messages
- Handle network errors gracefully
- Provide feedback for successful actions

## Performance Considerations

- Implement pagination for large friend lists
- Add loading states for better UX
- Cache data to reduce API calls

## Styling Considerations

- Maintain existing styling
- Ensure responsive behavior
- Match app theme and colors
