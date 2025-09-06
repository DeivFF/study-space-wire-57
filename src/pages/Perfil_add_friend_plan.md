# Perfil Page Add Friend Button Implementation Plan

## Overview

This document outlines the implementation of an "Add Friend" button on user profiles to allow users to send connection requests.

## Current Profile Page Structure

The Perfil page currently:

- Displays the user's own profile information
- Has mock data for profile information
- Has basic profile actions for the own profile
- Does not handle viewing other users' profiles
- Does not have connection functionality

## Required Changes

### 1. Profile Viewing Logic

Update the profile page to:

- Allow viewing other users' profiles (not just own profile)
- Determine the relationship between current user and profile user
- Display appropriate actions based on connection status

### 2. Connection Status Detection

Implement logic to determine the connection status between users:

- Not connected
- Pending request (sent or received)
- Connected (friends)
- Blocked

### 3. Add Friend Button Implementation

Create an "Add Friend" button that:

- Appears when users are not connected
- Sends a connection request when clicked
- Updates UI to reflect pending status after request is sent

### 4. Connection Status Indicators

Add visual indicators for different connection states:

- "Add Friend" button for not connected
- "Request Sent" for pending outgoing requests
- "Accept/Reject" buttons for pending incoming requests
- "Friends" indicator for connected users
- "Blocked" indicator for blocked users

## Implementation Steps

### Step 1: Update Profile Fetching Logic

Modify the profile fetching to handle viewing other users:

```javascript
// Check if user is trying to access their own profile
const isOwnProfile = currentUser && id === currentUser.id;

// If not own profile, fetch with appropriate permissions
if (!isOwnProfile) {
  // Fetch public profile data or data based on connection status
  // Implement privacy settings checks
}
```

### Step 2: Implement Connection Status Check

Create a function to determine connection status:

```javascript
const getConnectionStatus = async (userId, profileUserId) => {
  try {
    const response = await fetch(
      `/api/connections/status?userId=${profileUserId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();
    if (data.success) {
      return data.data.status; // not_connected, pending, accepted, blocked
    }
  } catch (error) {
    console.error("Error checking connection status:", error);
  }
  return "not_connected";
};
```

### Step 3: Add Connection Action Buttons

Update the profile actions section to show appropriate buttons:

```jsx
const renderProfileActions = () => {
  if (isOwnProfile) {
    return renderOwnProfileActions();
  }

  switch (connectionStatus) {
    case "not_connected":
      return (
        <button
          className="perfil-btn perfil-btn-primary"
          onClick={() => sendConnectionRequest(profile.id)}
        >
          <span>👥</span> Adicionar amigo
        </button>
      );
    case "pending":
      return (
        <button className="perfil-btn perfil-btn-outline" disabled>
          <span>⏳</span> Solicitação enviada
        </button>
      );
    case "accepted":
      return (
        <button className="perfil-btn perfil-btn-outline" disabled>
          <span>✅</span> Amigos
        </button>
      );
    case "blocked":
      return (
        <button className="perfil-btn perfil-btn-outline" disabled>
          <span>🚫</span> Bloqueado
        </button>
      );
    default:
      return null;
  }
};
```

### Step 4: Implement Send Connection Request Function

```javascript
const sendConnectionRequest = async (receiverId) => {
  try {
    const response = await fetch("/api/connections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ receiverId }),
    });

    const data = await response.json();
    if (data.success) {
      // Update connection status
      setConnectionStatus("pending");
      // Show success message
      alert("Solicitação de amizade enviada com sucesso!");
    } else {
      alert(data.message || "Erro ao enviar solicitação de amizade");
    }
  } catch (error) {
    console.error("Error sending connection request:", error);
    alert("Erro ao enviar solicitação de amizade");
  }
};
```

### Step 5: Update Profile Rendering

Modify the profile rendering to include the action buttons:

```jsx
<div className="perfil-action-row">{renderProfileActions()}</div>
```

## Privacy Considerations

- Only show profile information based on user's privacy settings
- Handle private profiles appropriately
- Implement proper error handling for unauthorized access

## Error Handling

- Display user-friendly error messages
- Handle network errors gracefully
- Provide feedback for successful actions

## Styling Considerations

- Match existing button styles
- Ensure responsive behavior
- Provide visual feedback for interactions
