import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from './api';
import type { Contact, Deal, Activity, DashboardMetrics, Organization, User, Invitation, Role } from './types';

// Simple event synchronization map for keeping multiple hook consumers in sync
const listeners = new Map<string, Set<() => void>>();

export const triggerRefresh = (keyPrefix: string) => {
  listeners.forEach((cbs, key) => {
    if (key === keyPrefix || key.startsWith(`${keyPrefix}?`) || key.startsWith(`${keyPrefix}/`)) {
      cbs.forEach((cb) => cb());
    }
  });
};

function useQuery<T>(key: string, url: string) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetcher = useCallback(async () => {
    try {
      const res = await apiFetch(url);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetcher();

    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }
    listeners.get(key)!.add(fetcher);

    return () => {
      listeners.get(key)?.delete(fetcher);
    };
  }, [key, fetcher]);

  return { data, isLoading, error, refetch: fetcher };
}

// Contacts Hook
// Contacts Hook
export const useContacts = (filters: { status?: string; source?: string; search?: string } = {}) => {
  const query = new URLSearchParams();
  if (filters.status) query.append('status', filters.status);
  if (filters.source) query.append('source', filters.source);
  if (filters.search) query.append('q', filters.search);

  const queryString = query.toString();
  const cacheKey = `contacts?${queryString}`;

  const { data, isLoading, error } = useQuery<Contact[]>(cacheKey, `/contacts?${queryString}`);

  const createContact = async (contactData: Partial<Contact>) => {
    const response = await apiFetch('/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
    triggerRefresh('contacts');
    triggerRefresh('dashboard');
    return response;
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    const response = await apiFetch(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    triggerRefresh('contacts');
    triggerRefresh('dashboard');
    return response;
  };

  const deleteContact = async (id: string) => {
    const response = await apiFetch(`/contacts/${id}`, {
      method: 'DELETE',
    });
    triggerRefresh('contacts');
    triggerRefresh('dashboard');
    return response;
  };

  const bulkAction = async (action: 'assign' | 'tag' | 'delete', ids: string[], additionalData?: any) => {
    const response = await apiFetch('/contacts/bulk', {
      method: 'POST',
      body: JSON.stringify({ action, ids, data: additionalData }),
    });
    triggerRefresh('contacts');
    triggerRefresh('dashboard');
    return response;
  };

  return {
    contacts: data || [],
    isLoading,
    error,
    createContact,
    updateContact,
    deleteContact,
    bulkAction,
  };
};

// Deals Hook
// Deals Hook
export const useDeals = (filters: { stage?: string } = {}) => {
  const query = new URLSearchParams();
  if (filters.stage) query.append('stage', filters.stage);

  const queryString = query.toString();
  const cacheKey = `deals?${queryString}`;
  const { data, isLoading, error } = useQuery<Deal[]>(cacheKey, `/deals?${queryString}`);

  const createDeal = async (dealData: Partial<Deal>) => {
    const response = await apiFetch('/deals', {
      method: 'POST',
      body: JSON.stringify(dealData),
    });
    triggerRefresh('deals');
    triggerRefresh('dashboard');
    return response;
  };

  const updateDeal = async (id: string, updates: Partial<Deal>) => {
    const response = await apiFetch(`/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    triggerRefresh('deals');
    triggerRefresh('dashboard');
    return response;
  };

  const updateDealStage = async (id: string, stage: string, closeReason?: string) => {
    const response = await apiFetch(`/deals/${id}/stage`, {
      method: 'PUT',
      body: JSON.stringify({ stage, closeReason }),
    });
    triggerRefresh('deals');
    triggerRefresh('dashboard');
    return response;
  };

  const deleteDeal = async (id: string) => {
    const response = await apiFetch(`/deals/${id}`, {
      method: 'DELETE',
    });
    triggerRefresh('deals');
    triggerRefresh('dashboard');
    return response;
  };

  return {
    deals: data || [],
    isLoading,
    error,
    createDeal,
    updateDeal,
    updateDealStage,
    deleteDeal,
  };
};

// Activities Hook
// Activities Hook
export const useActivities = (filters: { contactId?: string; dealId?: string; type?: string } = {}) => {
  const query = new URLSearchParams();
  if (filters.contactId) query.append('contactId', filters.contactId);
  if (filters.dealId) query.append('dealId', filters.dealId);
  if (filters.type) query.append('type', filters.type);

  const queryString = query.toString();
  const cacheKey = `activities?${queryString}`;
  const { data, isLoading, error } = useQuery<Activity[]>(cacheKey, `/activities?${queryString}`);

  const createActivity = async (activityData: Partial<Activity>) => {
    const response = await apiFetch('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
    triggerRefresh('activities');
    triggerRefresh('dashboard');
    return response;
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    const response = await apiFetch(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    triggerRefresh('activities');
    triggerRefresh('dashboard');
    return response;
  };

  const completeActivity = async (id: string, completed: boolean) => {
    const response = await apiFetch(`/activities/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    });
    triggerRefresh('activities');
    triggerRefresh('dashboard');
    return response;
  };

  const deleteActivity = async (id: string) => {
    const response = await apiFetch(`/activities/${id}`, {
      method: 'DELETE',
    });
    triggerRefresh('activities');
    triggerRefresh('dashboard');
    return response;
  };

  return {
    activities: data || [],
    isLoading,
    error,
    createActivity,
    updateActivity,
    completeActivity,
    deleteActivity,
  };
};

// Dashboard Metrics Hook
export const useDashboardMetrics = () => {
  const { data, isLoading, error } = useQuery<DashboardMetrics>('dashboard', '/dashboard/metrics');

  return {
    metrics: data,
    isLoading,
    error,
  };
};

// Organization Hook
export const useOrganization = () => {
  const { data, isLoading, error, refetch } = useQuery<Organization>('organization', '/organization');

  const updateOrganization = async (updates: { name?: string; country?: string; currency?: string; timezone?: string; website?: string; phone?: string; address?: string }) => {
    const response = await apiFetch('/organization', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    triggerRefresh('organization');
    return response;
  };

  return {
    organization: data,
    isLoading,
    error,
    refetch,
    updateOrganization,
  };
};

// Team Members Hook
export const useTeamMembers = () => {
  const { data, isLoading, error, refetch } = useQuery<User[]>('users', '/users');

  const changeRole = async (userId: string, roleId: string) => {
    const response = await apiFetch(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ roleId }),
    });
    triggerRefresh('users');
    return response;
  };

  const deactivateUser = async (userId: string) => {
    const response = await apiFetch(`/users/${userId}`, { method: 'DELETE' });
    triggerRefresh('users');
    return response;
  };

  return {
    members: data || [],
    isLoading,
    error,
    refetch,
    changeRole,
    deactivateUser,
  };
};

// Invitations Hook
export const useInvitations = () => {
  const { data, isLoading, error, refetch } = useQuery<Invitation[]>('invitations', '/invitations');

  const sendInvitation = async (email: string, roleId: string) => {
    const response = await apiFetch('/invitations', {
      method: 'POST',
      body: JSON.stringify({ email, roleId }),
    });
    triggerRefresh('invitations');
    if (response && response.emailSent === false) {
      throw new Error('Invitation created but email delivery failed. Share the invite link manually.');
    }
    return response;
  };

  const revokeInvitation = async (id: string) => {
    const response = await apiFetch(`/invitations/${id}`, { method: 'DELETE' });
    triggerRefresh('invitations');
    return response;
  };

  const resendInvitation = async (id: string) => {
    const response = await apiFetch(`/invitations/${id}/resend`, { method: 'POST' });
    triggerRefresh('invitations');
    if (response && response.emailSent === false) {
      throw new Error('Invitation resent but email delivery failed. Share the invite link manually.');
    }
    return response;
  };

  return {
    invitations: data || [],
    isLoading,
    error,
    refetch,
    sendInvitation,
    revokeInvitation,
    resendInvitation,
  };
};

// Roles Hook
export const useRoles = () => {
  const { data, isLoading, error } = useQuery<Role[]>('roles', '/organization/roles');
  return { roles: data || [], isLoading, error };
};
