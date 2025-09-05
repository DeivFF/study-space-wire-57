# FeedHeader Search Functionality Implementation Plan

## Overview

This document outlines the implementation of real-time search functionality in the FeedHeader component to allow users to search for other users and send connection requests.

## Current Component Structure

The FeedHeader component currently has:

- A static search input field
- No search functionality implemented
- No connection to backend API

## Required Changes

### 1. State Management

Add the following state variables:

- `searchQuery`: Stores the current search text
- `searchResults`: Stores the search results from the API
- `showSearchResults`: Controls visibility of the search dropdown
- `isLoading`: Indicates when search is in progress

### 2. API Integration

Implement a function to call the search API:

- Endpoint: GET /api/connections/search
- Parameters: query (from search input)
- Handle loading states
- Handle errors appropriately

### 3. Search Input Enhancements

Modify the search input to:

- Trigger search on text changes (debounced)
- Show search results dropdown when results are available
- Hide dropdown when input is cleared or user clicks away

### 4. Search Results Dropdown

Create a dropdown component that:

- Displays user search results
- Shows user avatar, name, and nickname
- Provides a button to send connection request
- Handles click outside to close dropdown

### 5. Event Handling

Implement event handlers for:

- Input changes (with debouncing)
- Result selection
- Click outside detection
- Keyboard navigation (optional enhancement)

## Implementation Steps

### Step 1: Add State Variables

```javascript
const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState([]);
const [showSearchResults, setShowSearchResults] = useState(false);
const [isLoading, setIsLoading] = useState(false);
```

### Step 2: Implement Search Function

```javascript
const searchUsers = async (query) => {
  if (!query.trim()) {
    setSearchResults([]);
    setShowSearchResults(false);
    return;
  }

  setIsLoading(true);
  try {
    // API call to search users
    const response = await fetch(
      `/api/connections/search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();
    if (data.success) {
      setSearchResults(data.data);
      setShowSearchResults(true);
    }
  } catch (error) {
    console.error("Search error:", error);
  } finally {
    setIsLoading(false);
  }
};
```

### Step 3: Implement Debouncing

```javascript
useEffect(() => {
  const delayDebounce = setTimeout(() => {
    if (searchQuery) {
      searchUsers(searchQuery);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, 300);

  return () => clearTimeout(delayDebounce);
}, [searchQuery]);
```

### Step 4: Update Search Input

Modify the search input to use the new state:

```jsx
<input
  type="text"
  placeholder="Buscar no Estudo+..."
  className="w-full pl-10 pr-4 py-2 bg-app-muted border border-app-border rounded-lg text-app-text placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onFocus={() => searchQuery && setShowSearchResults(true)}
/>
```

### Step 5: Create Search Results Dropdown

Create a dropdown component to display results:

```jsx
{
  showSearchResults && (
    <div className="absolute top-full left-0 right-0 mt-1 bg-app-panel border border-app-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
      {isLoading ? (
        <div className="p-4 text-center text-app-text-muted">Buscando...</div>
      ) : searchResults.length > 0 ? (
        searchResults.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-3 hover:bg-app-muted cursor-pointer"
          >
            <div className="w-8 h-8 bg-app-accent text-white rounded-full flex items-center justify-center font-semibold text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-medium text-app-text">{user.name}</div>
              <div className="text-sm text-app-text-muted">
                @{user.nickname}
              </div>
            </div>
            <button
              className="px-3 py-1 bg-app-accent text-white text-sm rounded-lg hover:bg-opacity-90"
              onClick={() => sendConnectionRequest(user.id)}
            >
              Adicionar
            </button>
          </div>
        ))
      ) : (
        <div className="p-4 text-center text-app-text-muted">
          Nenhum usuário encontrado
        </div>
      )}
    </div>
  );
}
```

## Styling Considerations

- Ensure dropdown appears below search input
- Limit dropdown height and enable scrolling
- Match existing app styling
- Handle responsive behavior

## Error Handling

- Display user-friendly error messages
- Handle network errors gracefully
- Provide feedback for empty search results

## Performance Considerations

- Implement debouncing to reduce API calls
- Limit search results to prevent performance issues
- Cache recent search results (optional enhancement)
