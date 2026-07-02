# API Integration Guide

This guide shows how to connect the CRM frontend to backend APIs.

## Overview

The application is structured to make API integration seamless. Mock data is currently used, but can be easily replaced with API calls.

## Current Architecture

```typescript
// Current: Mock data
import { mockContacts } from '@/lib/mockData';
const contacts = mockContacts;

// Future: API call
const { data: contacts } = useFetch('/api/contacts');
```

## Integration Steps

### Step 1: Replace Mock Data with API Calls

**Before** (mockData.ts):
```typescript
export const mockContacts: Contact[] = [
  { id: 'contact-1', firstName: 'James', ... }
];
```

**After** (hooks/useContacts.ts):
```typescript
import useSWR from 'swr';

export const useContacts = () => {
  const { data, error, isLoading } = useSWR('/api/contacts', fetch);
  return { contacts: data || [], error, isLoading };
};
```

### Step 2: Update Components

**Before**:
```typescript
import { mockContacts } from '@/lib/mockData';

function ContactsList() {
  return (
    <div>
      {mockContacts.map(contact => (
        <ContactCard key={contact.id} contact={contact} />
      ))}
    </div>
  );
}
```

**After**:
```typescript
import { useContacts } from '@/hooks/useContacts';

function ContactsList() {
  const { contacts, isLoading } = useContacts();
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div>
      {contacts.map(contact => (
        <ContactCard key={contact.id} contact={contact} />
      ))}
    </div>
  );
}
```

## API Endpoints Reference

### Contacts API

```typescript
// Get all contacts
GET /api/contacts
Response: Contact[]

// Get single contact
GET /api/contacts/:id
Response: Contact

// Create contact
POST /api/contacts
Body: { firstName, lastName, email, phone, company, jobTitle, ... }
Response: Contact

// Update contact
PUT /api/contacts/:id
Body: Partial<Contact>
Response: Contact

// Delete contact
DELETE /api/contacts/:id
Response: { success: boolean }

// Search contacts
GET /api/contacts/search?q=query
Response: Contact[]

// Bulk operations
POST /api/contacts/bulk
Body: { action: 'assign' | 'tag' | 'delete', ids: [], data: {} }
Response: { success: boolean, count: number }
```

### Deals API

```typescript
// Get all deals
GET /api/deals
Response: Deal[]

// Get deals by stage
GET /api/deals?stage=new
Response: Deal[]

// Get single deal
GET /api/deals/:id
Response: Deal

// Create deal
POST /api/deals
Body: { title, contactId, company, value, stage, ... }
Response: Deal

// Update deal
PUT /api/deals/:id
Body: Partial<Deal>
Response: Deal

// Move deal between stages
PUT /api/deals/:id/stage
Body: { stage: DealStage }
Response: Deal

// Delete deal
DELETE /api/deals/:id
Response: { success: boolean }
```

### Activities API

```typescript
// Get all activities
GET /api/activities
Response: Activity[]

// Get activities for contact
GET /api/activities?contactId=:id
Response: Activity[]

// Get activities for deal
GET /api/activities?dealId=:id
Response: Activity[]

// Create activity
POST /api/activities
Body: { type, subject, description, contactId?, dealId?, ... }
Response: Activity

// Mark activity complete
PUT /api/activities/:id/complete
Response: Activity

// Update activity
PUT /api/activities/:id
Body: Partial<Activity>
Response: Activity

// Delete activity
DELETE /api/activities/:id
Response: { success: boolean }
```

### Auth API

```typescript
// Login
POST /api/auth/login
Body: { email, password }
Response: { user: User, token: string }

// Logout
POST /api/auth/logout
Response: { success: boolean }

// Get current user
GET /api/auth/me
Response: User

// Refresh token
POST /api/auth/refresh
Response: { token: string }
```

## Example: Full Integration

### 1. Create a hooks directory

```
lib/
  hooks/
    useContacts.ts
    useDeals.ts
    useActivities.ts
```

### 2. Create useContacts hook

```typescript
// lib/hooks/useContacts.ts
import useSWR from 'swr';
import type { Contact } from '@/lib/types';

const fetcher = (url: string) =>
  fetch(url).then(r => r.json());

export const useContacts = (filters?: Record<string, any>) => {
  const query = new URLSearchParams(filters || {}).toString();
  const { data, error, isLoading, mutate } = useSWR(
    `/api/contacts${query ? `?${query}` : ''}`,
    fetcher
  );

  const createContact = async (contact: Partial<Contact>) => {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    });
    const newContact = await res.json();
    mutate([...(data || []), newContact]);
    return newContact;
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    const res = await fetch(`/api/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const updated = await res.json();
    mutate((data || []).map(c => c.id === id ? updated : c));
    return updated;
  };

  const deleteContact = async (id: string) => {
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
    mutate((data || []).filter(c => c.id !== id));
  };

  return {
    contacts: data || [],
    isLoading,
    error,
    createContact,
    updateContact,
    deleteContact,
  };
};
```

### 3. Update component

```typescript
// app/contacts/page.tsx
'use client';

import { useContacts } from '@/lib/hooks/useContacts';
import { useState } from 'react';

export default function ContactsPage() {
  const { contacts, isLoading, error, createContact } = useContacts();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter(c =>
    c.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) return <div>Error loading contacts: {error.message}</div>;

  return (
    <div className="p-6">
      <input
        type="text"
        placeholder="Search contacts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {filteredContacts.map(contact => (
            <div key={contact.id}>{contact.firstName} {contact.lastName}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Backend Setup Example

### Using Node.js + Express + PostgreSQL

```typescript
// server.ts
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Contacts endpoints
app.get('/api/contacts', async (req, res) => {
  const contacts = await db.query('SELECT * FROM contacts');
  res.json(contacts);
});

app.post('/api/contacts', async (req, res) => {
  const { firstName, lastName, email, phone, company } = req.body;
  const contact = await db.query(
    'INSERT INTO contacts (first_name, last_name, email, phone, company) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [firstName, lastName, email, phone, company]
  );
  res.json(contact);
});

// Similar for deals, activities, auth...

app.listen(3001, () => console.log('API running on :3001'));
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_TIMEOUT=10000
```

Then use in your fetcher:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const fetcher = (url: string) =>
  fetch(`${API_URL}${url}`).then(r => r.json());
```

## Error Handling

```typescript
export const useContacts = () => {
  const { data, error, isLoading } = useSWR('/api/contacts', fetcher);

  if (error) {
    console.error('Failed to load contacts:', error);
    // Show toast notification
    addToast({
      type: 'error',
      message: 'Failed to load contacts. Please try again.',
    });
  }

  return { contacts: data || [], isLoading, error };
};
```

## Authentication Integration

```typescript
// lib/context.tsx
const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('auth_token')
  );

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error('Login failed');

    const { user, token } = await res.json();
    setUser(user);
    setToken(token);
    localStorage.setItem('auth_token', token);
  };

  // In fetcher:
  const fetcher = (url: string) =>
    fetch(`${API_URL}${url}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(r => r.json());

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Best Practices

1. **Use SWR for data fetching** - Built-in caching, revalidation, and deduplication
2. **Separate API calls from components** - Create custom hooks
3. **Handle loading states** - Show spinners while fetching
4. **Error handling** - Display user-friendly error messages
5. **Authentication** - Store tokens securely, refresh on expiry
6. **Rate limiting** - Implement exponential backoff for retries
7. **Optimistic updates** - Update UI before server confirmation
8. **Cache invalidation** - Use mutate() to refresh data

## Testing API Integration

```typescript
// Create mock server responses
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  rest.get('/api/contacts', (req, res, ctx) => {
    return res(ctx.json([{ id: '1', firstName: 'John' }]));
  }),
];

const server = setupServer(...handlers);

// In your test:
test('loads contacts', async () => {
  render(<ContactsList />);
  
  await waitFor(() => {
    expect(screen.getByText('John')).toBeInTheDocument();
  });
});
```

## Migration Timeline

**Week 1**: Set up backend infrastructure
**Week 2**: Create API endpoints
**Week 3**: Create custom hooks
**Week 4**: Integrate with components
**Week 5**: Testing and refinement

## Resources

- [SWR Documentation](https://swr.vercel.app/)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [React Query](https://tanstack.com/query/latest) (Alternative to SWR)
- [MSW - Mock Service Worker](https://mswjs.io/)

## Questions?

Refer to individual component documentation or the API_ENDPOINTS.md file for specific endpoint details.
