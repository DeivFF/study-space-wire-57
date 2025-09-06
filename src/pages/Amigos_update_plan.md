# Amigos Page Update Plan

## Overview

This document outlines the implementation needed to transform the Amigos page from a placeholder to a fully functional friends list page.

## Current Page Structure

The Amigos page currently:

- Shows a simple placeholder message
- Does not fetch or display any friend data
- Does not have any interactive elements
- Uses the Layout component

## Required Features

### 1. Friend List Display

- Fetch and display the user's friends
- Show friend information (avatar, name, status)
- Implement pagination for large friend lists

### 2. Friend Search

- Add search functionality to find friends
- Filter friends list based on search query

### 3. Friend Actions

- Remove friends
- View friend profiles
- Send messages (if messaging is implemented)

### 4. Connection Requests

- Show pending connection requests
- Provide accept/reject functionality

### 5. Friend Suggestions

- Show suggested friends based on interests or connections
- Provide "Add Friend" functionality for suggestions

## Implementation Steps

### Step 1: Update Component Structure

Replace the placeholder with a proper friends page structure:

```jsx
export default function Amigos() {
  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-app-text">Amigos</h1>
          <button className="px-4 py-2 bg-app-accent text-white rounded-lg hover:bg-opacity-90">
            Adicionar amigo
          </button>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar amigos..."
            className="w-full p-3 bg-app-muted border border-app-border rounded-lg text-app-text placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-app-accent"
          />
        </div>

        {/* Tabs for different sections */}
        <div className="mb-6 border-b border-app-border">
          <nav className="flex space-x-6">
            <button className="py-2 px-1 border-b-2 border-app-accent text-app-accent font-medium">
              Todos os amigos
            </button>
            <button className="py-2 px-1 border-b-2 border-transparent text-app-text-muted hover:text-app-text">
              Solicitações
            </button>
            <button className="py-2 px-1 border-b-2 border-transparent text-app-text-muted hover:text-app-text">
              Sugestões
            </button>
          </nav>
        </div>

        {/* Friends list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Friend cards will be rendered here */}
        </div>
      </div>
    </Layout>
  );
}
```

### Step 2: Implement State Management

Add state for:

- Friends list
- Search query
- Active tab
- Loading states
- Error handling

```javascript
const [friends, setFriends] = useState([]);
const [searchQuery, setSearchQuery] = useState("");
const [activeTab, setActiveTab] = useState("friends"); // friends, requests, suggestions
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

### Step 3: Fetch Friends Data

Implement API calls to fetch friends data:

```javascript
useEffect(() => {
  const fetchFriends = async () => {
    setLoading(true);
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
      setError("Erro ao carregar lista de amigos");
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchFriends();
}, []);
```

### Step 4: Implement Friend Card Component

Create a reusable friend card component:

```jsx
const FriendCard = ({ friend, onRemove }) => {
  return (
    <div className="bg-app-panel border border-app-border rounded-lg p-4 flex items-center gap-3">
      <div className="relative">
        <div className="w-12 h-12 bg-app-accent text-white rounded-full flex items-center justify-center font-semibold">
          {friend.name.charAt(0)}
        </div>
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-app-panel ${
            friend.status === "online" ? "bg-app-success" : "bg-app-text-muted"
          }`}
        />
      </div>
      <div className="flex-1">
        <div className="font-medium text-app-text">{friend.name}</div>
        <div className="text-sm text-app-text-muted capitalize">
          {friend.status}
        </div>
      </div>
      <button
        onClick={() => onRemove(friend.id)}
        className="text-app-text-muted hover:text-app-danger"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
```

### Step 5: Add Friend Actions

Implement friend actions:

```javascript
const handleRemoveFriend = async (friendId) => {
  try {
    const response = await fetch(`/api/connections/${friendId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (data.success) {
      // Remove from friends list
      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
    }
  } catch (error) {
    console.error("Error removing friend:", error);
  }
};
```

### Step 6: Implement Search Functionality

Filter friends based on search query:

```javascript
const filteredFriends = friends.filter(
  (friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
);
```

### Step 7: Add Responsive Design

Ensure the page works well on all screen sizes:

- Single column on mobile
- Two columns on tablet
- Three columns on desktop

## Additional Features

### 1. Connection Requests Tab

- Display pending requests
- Implement accept/reject functionality
- Show requester information

### 2. Friend Suggestions Tab

- Fetch friend suggestions from API
- Show mutual friends count
- Implement "Add Friend" functionality

### 3. Empty States

- Show appropriate messages when no friends, requests, or suggestions exist
- Provide guidance for new users

## Error Handling

- Display user-friendly error messages
- Handle network errors gracefully
- Provide retry functionality

## Performance Considerations

- Implement pagination for large datasets
- Add loading skeletons for better UX
- Cache data to reduce API calls

## Styling Considerations

- Match existing app styling
- Ensure consistent spacing and typography
- Use appropriate colors for different states
