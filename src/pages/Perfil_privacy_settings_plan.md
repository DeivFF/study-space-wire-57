# Perfil Privacy Settings Implementation Plan

## Overview

This document outlines the implementation of privacy settings for user profiles to control who can view profile information and send connection requests.

## Current Profile Structure

The profile system currently:

- Has basic profile fields in the database
- Has some privacy-related fields (private_profile, contact_visible_to_friends)
- Does not have a UI for managing privacy settings
- Does not enforce privacy restrictions in the API

## Required Privacy Features

### 1. Profile Visibility

- Public profiles: Visible to all users
- Private profiles: Require approval for viewing (except basic info)
- Friends-only profiles: Only visible to friends

### 2. Connection Request Settings

- Anyone can send requests
- Only friends of friends can send requests
- No one can send requests (except existing friends)

### 3. Contact Information Visibility

- Visible to everyone
- Visible to friends only
- Hidden from everyone

### 4. Activity Visibility

- Public activity feed
- Friends-only activity feed
- Private activity feed

## Database Considerations

The profiles table already has some privacy-related fields:

- `private_profile`: BOOLEAN - Makes profile private
- `contact_visible_to_friends`: BOOLEAN - Controls contact visibility

Additional fields may be needed:

- `activity_visibility`: VARCHAR - Controls who can see activity
- `connection_request_setting`: VARCHAR - Controls who can send requests

## Implementation Steps

### Step 1: Add New Privacy Fields (Migration)

Create a migration to add new privacy fields:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activity_visibility VARCHAR(20) DEFAULT 'public';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS connection_request_setting VARCHAR(20) DEFAULT 'anyone';
```

### Step 2: Update Profile API

Modify the profile API to:

- Return appropriate data based on privacy settings
- Enforce privacy restrictions
- Allow users to update their privacy settings

### Step 3: Create Privacy Settings Component

Create a new component for managing privacy settings:

```jsx
const PrivacySettings = ({ profile, onUpdate }) => {
  const [settings, setSettings] = useState({
    privateProfile: profile.private_profile || false,
    activityVisibility: profile.activity_visibility || "public",
    connectionRequestSetting: profile.connection_request_setting || "anyone",
    contactVisibleToFriends: profile.contact_visible_to_friends || false,
  });

  const handleSave = async () => {
    try {
      const response = await fetch("/api/profile/privacy", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (data.success) {
        onUpdate(settings);
        alert("Configurações de privacidade atualizadas com sucesso!");
      }
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      alert("Erro ao atualizar configurações de privacidade");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-app-text mb-2">
          Privacidade do Perfil
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.privateProfile}
              onChange={(e) =>
                setSettings({ ...settings, privateProfile: e.target.checked })
              }
              className="rounded text-app-accent focus:ring-app-accent"
            />
            <span className="text-app-text">
              Perfil privado (requer aprovação para conectar)
            </span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-app-text mb-2">
          Solicitações de Conexão
        </h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="connectionRequestSetting"
              value="anyone"
              checked={settings.connectionRequestSetting === "anyone"}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  connectionRequestSetting: e.target.value,
                })
              }
              className="text-app-accent focus:ring-app-accent"
            />
            <span className="text-app-text">
              Qualquer pessoa pode enviar solicitações
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="connectionRequestSetting"
              value="friends_of_friends"
              checked={
                settings.connectionRequestSetting === "friends_of_friends"
              }
              onChange={(e) =>
                setSettings({
                  ...settings,
                  connectionRequestSetting: e.target.value,
                })
              }
              className="text-app-accent focus:ring-app-accent"
            />
            <span className="text-app-text">
              Apenas amigos de amigos podem enviar solicitações
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="connectionRequestSetting"
              value="none"
              checked={settings.connectionRequestSetting === "none"}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  connectionRequestSetting: e.target.value,
                })
              }
              className="text-app-accent focus:ring-app-accent"
            />
            <span className="text-app-text">
              Ninguém pode enviar solicitações
            </span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-app-text mb-2">
          Informações de Contato
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.contactVisibleToFriends}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  contactVisibleToFriends: e.target.checked,
                })
              }
              className="rounded text-app-accent focus:ring-app-accent"
            />
            <span className="text-app-text">
              Mostrar e-mail apenas para amigos
            </span>
          </label>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="px-4 py-2 bg-app-accent text-white rounded-lg hover:bg-opacity-90"
      >
        Salvar Alterações
      </button>
    </div>
  );
};
```

### Step 4: Update Profile Page

Add privacy settings to the profile page:

- Add a "Privacidade" tab or section
- Include the PrivacySettings component
- Handle saving and updating settings

### Step 5: Implement Privacy Enforcement

Update the backend to enforce privacy settings:

- Check profile visibility before returning profile data
- Check connection request settings before allowing requests
- Check contact visibility before showing contact information

### Step 6: Update Connection Logic

Modify connection request logic to respect privacy settings:

- Check if user can send requests based on settings
- Handle friends-of-friends logic
- Provide appropriate error messages

## Privacy States and Logic

### Profile Visibility

1. **Public**: Profile visible to all users
2. **Private**: Profile requires approval to view (except basic info like name/avatar)
3. **Friends Only**: Profile only visible to friends

### Connection Request Settings

1. **Anyone**: Any user can send connection requests
2. **Friends of Friends**: Only friends of friends can send requests
3. **None**: No one can send requests (except existing friends)

### Contact Information Visibility

1. **Everyone**: Contact info visible to all users
2. **Friends Only**: Contact info visible only to friends
3. **Hidden**: Contact info hidden from everyone

## Error Handling

- Display appropriate error messages for privacy violations
- Handle edge cases (e.g., trying to connect with a user who has disabled requests)
- Provide clear feedback when privacy settings prevent actions

## UI/UX Considerations

- Make privacy settings easy to understand
- Provide clear explanations of what each setting does
- Show visual indicators of privacy status (e.g., lock icon for private profiles)
- Ensure settings are easily accessible from the profile page

## Testing Considerations

- Test all combinations of privacy settings
- Verify that privacy restrictions are properly enforced
- Test edge cases and error conditions
- Ensure that existing functionality is not broken by privacy changes
