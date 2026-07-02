import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import type { User, Organization } from './types';
import { apiFetch } from './api';
import { formatCurrency, formatDate } from './regions';

// Auth Context
interface AuthContextType {
  user:        User | null;
  permissions: Set<string>;
  isLoading:   boolean;
  login:       (email: string, password: string) => Promise<void>;
  register:    (organizationName: string, ownerName: string, email: string, password: string) => Promise<void>;
  logout:      () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]               = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading]     = useState(true);

  // Restore user session on mount
  useEffect(() => {
    async function restoreSession() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) { setIsLoading(false); return; }
      try {
        const profile = await apiFetch('/auth/me');
        setUser(profile);
        // Load permissions
        const org   = await apiFetch('/organization');
        const roles = await apiFetch('/organization/roles');
        const myRole = roles.find((r: any) => r.id === profile.role.id);
        if (myRole) {
          setPermissions(new Set(myRole.rolePermissions.map((rp: any) => rp.permission.name)));
        }
      } catch {
        if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const _loadPermissions = useCallback(async (roleId: string) => {
    try {
      const roles  = await apiFetch('/organization/roles');
      const myRole = roles.find((r: any) => r.id === roleId);
      if (myRole) {
        setPermissions(new Set(myRole.rolePermissions.map((rp: any) => rp.permission.name)));
      }
    } catch { /* ignore */ }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body:   JSON.stringify({ email, password }),
      });
      setUser(data.user);
      if (typeof window !== 'undefined') localStorage.setItem('auth_token', data.token);
      await _loadPermissions(data.user.role.id);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [_loadPermissions]);

  // register = create organization + owner
  const register = useCallback(async (
    organizationName: string,
    ownerName:        string,
    email:            string,
    password:         string
  ) => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body:   JSON.stringify({ organizationName, ownerName, ownerEmail: email, ownerPassword: password }),
      });
      setUser(data.user);
      if (typeof window !== 'undefined') localStorage.setItem('auth_token', data.token);
      await _loadPermissions(data.user.role.id);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [_loadPermissions]);

  const logout = useCallback(() => {
    setUser(null);
    setPermissions(new Set());
    if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
  }, []);

  const hasPermission = useCallback(
    (permission: string) => permissions.has(permission),
    [permissions]
  );

  return (
    <AuthContext.Provider value={{ user, permissions, isLoading, login, register, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// UI Context for modals, notifications, etc.
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface UIContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const duration = toast.duration || 3000;

    setToasts((prev) => [...prev, { ...toast, id }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  return (
    <UIContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
};

// Filter Context
interface FilterContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  const setFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilters({});
  }, []);

  return (
    <FilterContext.Provider
      value={{ searchQuery, setSearchQuery, filters, setFilter, clearFilters }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within FilterProvider');
  }
  return context;
};

// Region Context — provides org currency/country to the whole app
interface RegionContextType {
  organization: Organization | null;
  isLoading: boolean;
  formatMoney: (value: number, overrideCurrency?: string) => string;
  formatMoneyCompact: (value: number, overrideCurrency?: string) => string;
  formatRegionDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  defaultCurrency: string;
  country: string;
  refreshOrganization: () => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export const RegionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrg = useCallback(async () => {
    try {
      const data = await apiFetch('/organization');
      setOrganization(data);
    } catch {
      // fallback defaults used
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  const defaultCurrency = organization?.currency ?? 'USD';
  const country = organization?.country ?? 'US';

  const formatMoney = useCallback(
    (value: number, overrideCurrency?: string) =>
      formatCurrency(value, overrideCurrency ?? defaultCurrency),
    [defaultCurrency]
  );

  const formatMoneyCompact = useCallback(
    (value: number, overrideCurrency?: string) =>
      formatCurrency(value, overrideCurrency ?? defaultCurrency, { compact: true }),
    [defaultCurrency]
  );

  const formatRegionDate = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, country, options),
    [country]
  );

  return (
    <RegionContext.Provider
      value={{
        organization,
        isLoading,
        formatMoney,
        formatMoneyCompact,
        formatRegionDate,
        defaultCurrency,
        country,
        refreshOrganization: fetchOrg,
      }}
    >
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error('useRegion must be used within RegionProvider');
  }
  return context;
};

