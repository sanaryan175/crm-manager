/**
 * All system permissions.
 * Format: resource.action
 * Stored in DB per organization — never hardcoded in middleware.
 */
export const PERMISSIONS = {
  // Contacts
  CONTACT_CREATE:  'contact.create',
  CONTACT_READ:    'contact.read',
  CONTACT_UPDATE:  'contact.update',
  CONTACT_DELETE:  'contact.delete',
  CONTACT_IMPORT:  'contact.import',

  // Deals
  DEAL_CREATE:     'deal.create',
  DEAL_READ:       'deal.read',
  DEAL_UPDATE:     'deal.update',
  DEAL_DELETE:     'deal.delete',

  // Activities
  ACTIVITY_CREATE: 'activity.create',
  ACTIVITY_READ:   'activity.read',
  ACTIVITY_UPDATE: 'activity.update',
  ACTIVITY_DELETE: 'activity.delete',

  // Users
  USER_INVITE:     'user.invite',
  USER_READ:       'user.read',
  USER_UPDATE:     'user.update',
  USER_REMOVE:     'user.remove',

  // Organization
  ORG_SETTINGS:    'org.settings',
  ORG_DELETE:      'org.delete',

  // Pipeline
  PIPELINE_MANAGE: 'pipeline.manage',

  // Reports
  REPORTS_VIEW:    'reports.view',

  // Billing
  BILLING_MANAGE:  'billing.manage',

  // Audit
  AUDIT_VIEW:      'audit.view',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ─── Role definitions ─────────────────────────────────────────────────────────
// Which permissions each built-in role receives by default.
// These are seeded per organization on creation.

export const ROLE_DEFINITIONS = [
  {
    name: 'owner',
    displayName: 'Owner',
    description: 'Full access. Can manage billing and delete organization.',
    isSystem: true,
    permissions: Object.values(PERMISSIONS), // everything
  },
  {
    name: 'admin',
    displayName: 'Admin',
    description: 'Manages users and CRM settings. Cannot delete org or manage billing.',
    isSystem: true,
    permissions: [
      PERMISSIONS.CONTACT_CREATE, PERMISSIONS.CONTACT_READ,
      PERMISSIONS.CONTACT_UPDATE, PERMISSIONS.CONTACT_DELETE,
      PERMISSIONS.CONTACT_IMPORT,
      PERMISSIONS.DEAL_CREATE, PERMISSIONS.DEAL_READ,
      PERMISSIONS.DEAL_UPDATE, PERMISSIONS.DEAL_DELETE,
      PERMISSIONS.ACTIVITY_CREATE, PERMISSIONS.ACTIVITY_READ,
      PERMISSIONS.ACTIVITY_UPDATE, PERMISSIONS.ACTIVITY_DELETE,
      PERMISSIONS.USER_INVITE, PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_REMOVE,
      PERMISSIONS.ORG_SETTINGS,
      PERMISSIONS.PIPELINE_MANAGE,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.AUDIT_VIEW,
    ],
  },
  {
    name: 'sales_manager',
    displayName: 'Sales Manager',
    description: 'Manages team deals and contacts. Can view team reports.',
    isSystem: true,
    permissions: [
      PERMISSIONS.CONTACT_CREATE, PERMISSIONS.CONTACT_READ,
      PERMISSIONS.CONTACT_UPDATE, PERMISSIONS.CONTACT_DELETE,
      PERMISSIONS.DEAL_CREATE, PERMISSIONS.DEAL_READ,
      PERMISSIONS.DEAL_UPDATE, PERMISSIONS.DEAL_DELETE,
      PERMISSIONS.ACTIVITY_CREATE, PERMISSIONS.ACTIVITY_READ,
      PERMISSIONS.ACTIVITY_UPDATE, PERMISSIONS.ACTIVITY_DELETE,
      PERMISSIONS.USER_READ,
      PERMISSIONS.REPORTS_VIEW,
    ],
  },
  {
    name: 'sales_rep',
    displayName: 'Sales Representative',
    description: 'Creates and manages own leads, contacts, and deals.',
    isSystem: true,
    permissions: [
      PERMISSIONS.CONTACT_CREATE, PERMISSIONS.CONTACT_READ,
      PERMISSIONS.CONTACT_UPDATE,
      PERMISSIONS.DEAL_CREATE, PERMISSIONS.DEAL_READ,
      PERMISSIONS.DEAL_UPDATE,
      PERMISSIONS.ACTIVITY_CREATE, PERMISSIONS.ACTIVITY_READ,
      PERMISSIONS.ACTIVITY_UPDATE,
      PERMISSIONS.USER_READ,
      PERMISSIONS.REPORTS_VIEW,
    ],
  },
  {
    name: 'marketing',
    displayName: 'Marketing',
    description: 'Imports contacts, manages campaigns, views analytics.',
    isSystem: true,
    permissions: [
      PERMISSIONS.CONTACT_CREATE, PERMISSIONS.CONTACT_READ,
      PERMISSIONS.CONTACT_UPDATE, PERMISSIONS.CONTACT_IMPORT,
      PERMISSIONS.DEAL_READ,
      PERMISSIONS.ACTIVITY_CREATE, PERMISSIONS.ACTIVITY_READ,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.USER_READ,
    ],
  },
  {
    name: 'support',
    displayName: 'Support',
    description: 'Views customer data and manages support activities.',
    isSystem: true,
    permissions: [
      PERMISSIONS.CONTACT_READ,
      PERMISSIONS.DEAL_READ,
      PERMISSIONS.ACTIVITY_CREATE, PERMISSIONS.ACTIVITY_READ,
      PERMISSIONS.ACTIVITY_UPDATE,
      PERMISSIONS.USER_READ,
      PERMISSIONS.REPORTS_VIEW,
    ],
  },
] as const;

// ─── Invitation hierarchy ─────────────────────────────────────────────────────
// Key = inviter role name, value = roles they are allowed to invite
export const INVITE_PERMISSIONS: Record<string, string[]> = {
  owner:         ['owner', 'admin', 'sales_manager', 'sales_rep', 'marketing', 'support'],
  admin:         ['sales_manager', 'sales_rep', 'marketing', 'support'],
  sales_manager: ['sales_rep'],
  sales_rep:     [],
  marketing:     [],
  support:       [],
};
