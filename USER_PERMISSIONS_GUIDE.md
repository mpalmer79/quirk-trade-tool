# User Roles & Permissions System - Implementation Guide

## Overview
This document describes the complete user roles and permissions system for the Quirk Trade Tool.

## User Roles

### 1. Admin
- **Access**: Full system access
- **Permissions**:
  - Manage all users (create, edit, delete)
  - Access all dealerships
  - View system settings
  - Create and manage appraisals
  - View all reports
- **Dealership Assignment**: All dealerships

### 2. General Manager
- **Access**: Multiple dealerships
- **Permissions**:
  - View assigned dealerships
  - Create and edit appraisals
  - View dealership reports
- **Dealership Assignment**: Admin selects multiple dealerships
- **Restrictions**: Cannot manage users

### 3. General Sales Manager
- **Access**: Single dealership
- **Permissions**:
  - View assigned dealership
  - Add and remove Sales Managers for their dealership
  - Create and edit appraisals
  - View dealership reports
- **Dealership Assignment**: Exactly one dealership
- **User Management**: Can only manage Sales Managers within their dealership

### 4. Sales Manager
- **Access**: Single dealership
- **Permissions**:
  - View assigned dealership
  - Create trade appraisals
  - View appraisal history
- **Dealership Assignment**: Exactly one dealership
- **Restrictions**: Cannot edit appraisals, cannot manage users

## File Structure
```
frontend/
├── app/
│   ├── lib/
│   │   ├── auth-types.ts          # User types, roles, and permissions
│   │   ├── auth-context.tsx       # Authentication context and hooks
│   │   └── permissions.ts         # Permission checking utilities
│   └── users/
│       └── page.tsx               # User management page
└── components/
    ├── UserList.tsx               # User list component
    ├── UserForm.tsx               # User create/edit form
    └── PermissionGuard.tsx        # Permission guard components
```

## Setup Instructions

### 1. Wrap Your App with AuthProvider

Update your root layout to include the AuthProvider:
```typescript
// app/layout.tsx
import { AuthProvider } from "@/app/lib/auth-context";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Protect Routes with Authentication

Use the `useRequireAuth` hook to protect pages:
```typescript
// app/some-protected-page/page.tsx
"use client";

import { useRequireAuth } from "@/app/lib/auth-context";

export default function ProtectedPage() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading) return <div>Loading...</div>;

  return <div>Protected content for {user.name}</div>;
}
```

### 3. Check Permissions in Components

Use the `PermissionGuard` component to conditionally render UI:
```typescript
import { PermissionGuard } from "@/components/PermissionGuard";
import { Permission } from "@/app/lib/auth-types";

function MyComponent() {
  return (
    <PermissionGuard permission={Permission.CREATE_APPRAISAL}>
      <button>Create New Appraisal</button>
    </PermissionGuard>
  );
}
```

### 4. Check Dealership Access

Use the `DealershipGuard` component:
```typescript
import { DealershipGuard } from "@/components/PermissionGuard";

function DealershipComponent({ dealershipId }) {
  return (
    <DealershipGuard 
      dealershipId={dealershipId}
      fallback={<div>No access to this dealership</div>}
    >
      <div>Dealership content</div>
    </DealershipGuard>
  );
}
```

### 5. Use Permission Hooks

For conditional logic in components:
```typescript
import { usePermission, useDealershipAccess } from "@/components/PermissionGuard";
import { Permission } from "@/app/lib/auth-types";

function MyComponent() {
  const canEdit = usePermission(Permission.EDIT_APPRAISAL);
  const hasAccess = useDealershipAccess("quirk-chevy-braintree");

  return (
    <div>
      {canEdit && <button>Edit</button>}
      {hasAccess && <div>Dealership data</div>}
    </div>
  );
}
```

## Backend API Endpoints Needed

You'll need to implement the following API endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### User Management
- `GET /api/users` - List all users (filtered by permissions)
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Example User API Response
```json
{
  "id": "user_123",
  "email": "manager@quirkauto.com",
  "name": "John Manager",
  "role": "general_manager",
  "dealershipIds": ["quirk-chevy-braintree", "quirk-chevy-manchester"],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "isActive": true
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### User Dealerships Table (Many-to-Many)
```sql
CREATE TABLE user_dealerships (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  dealership_id VARCHAR(100) NOT NULL,
  PRIMARY KEY (user_id, dealership_id)
);
```

## Integration with Existing Trade Form

Update your trade appraisal form to filter dealerships by user access:
```typescript
// components/ValuationForm.tsx
import { useAuth } from "@/app/lib/auth-context";
import { getAccessibleDealerships } from "@/app/lib/permissions";
import { DEALERSHIPS } from "@/app/dealerships";

function ValuationForm() {
  const { user } = useAuth();
  
  // Filter dealerships based on user access
  const accessibleDealerships = DEALERSHIPS.filter(d => 
    getAccessibleDealerships(user, DEALERSHIPS.map(d => d.id)).includes(d.id)
  );

  return (
    <select>
      {accessibleDealerships.map(d => (
        <option key={d.id} value={d.id}>{d.name}</option>
      ))}
    </select>
  );
}
```

## Testing the System

### Test User Accounts (for development)

1. **Admin**
   - Email: admin@quirkauto.com
   - Can access everything

2. **General Manager**
   - Email: gm@quirkauto.com
   - Can access multiple dealerships

3. **General Sales Manager**
   - Email: gsm@quirkauto.com
   - Can access one dealership and manage Sales Managers

4. **Sales Manager**
   - Email: sm@quirkauto.com
   - Can only create appraisals and view history

## Security Best Practices

1. **Always validate on the backend**: Client-side permission checks are for UX only
2. **Use HTTPS in production**: Protect authentication tokens
3. **Implement rate limiting**: Prevent brute force attacks
4. **Hash passwords properly**: Use bcrypt or similar
5. **Implement session management**: Token expiration and refresh
6. **Log access attempts**: Track who accessed what and when

## Common Usage Patterns

### Check if user can edit an appraisal
```typescript
import { usePermission } from "@/components/PermissionGuard";
import { Permission } from "@/app/lib/auth-types";

function AppraisalCard({ appraisal }) {
  const canEdit = usePermission(Permission.EDIT_APPRAISAL);
  const canDelete = usePermission(Permission.DELETE_APPRAISAL);

  return (
    <div>
      {canEdit && <button>Edit</button>}
      {canDelete && <button>Delete</button>}
    </div>
  );
}
```

### Filter data by accessible dealerships
```typescript
import { useAuth } from "@/app/lib/auth-context";
import { getAccessibleDealerships } from "@/app/lib/permissions";

function AppraisalHistory() {
  const { user } = useAuth();
  const [appraisals, setAppraisals] = useState([]);

  const accessibleIds = getAccessibleDealerships(
    user, 
    DEALERSHIPS.map(d => d.id)
  );

  const filteredAppraisals = appraisals.filter(a => 
    accessibleIds.includes(a.dealershipId)
  );

  return <div>{/* Render filtered appraisals */}</div>;
}
```

## Troubleshooting

### User can't see any dealerships
- Check that `dealershipIds` array is populated
- Verify user role matches expected permissions
- Ensure `isActive` is true

### Permission checks not working
- Verify `AuthProvider` wraps the app
- Check that user object is loaded
- Confirm permission is in ROLE_PERMISSIONS mapping

### Form validation errors
- Ensure dealership assignments match role requirements
- Check that all required fields are filled
- Verify email format is valid

## Next Steps

1. Implement backend API endpoints
2. Set up database tables
3. Add authentication middleware
4. Implement password reset functionality
5. Add activity logging
6. Create admin dashboard for user analytics
