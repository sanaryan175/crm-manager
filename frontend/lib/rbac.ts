/**
 * Frontend copy of the invitation hierarchy rules.
 * Used to show/hide the Invite button and filter
 * which roles are available in the invite form.
 *
 * The backend ALWAYS re-validates this — frontend is UI only.
 */
export const INVITE_PERMISSIONS: Record<string, string[]> = {
  owner:         ['admin', 'sales_manager', 'sales_rep', 'marketing', 'support'],
  admin:         ['sales_manager', 'sales_rep', 'marketing', 'support'],
  sales_manager: ['sales_rep'],
  sales_rep:     [],
  marketing:     [],
  support:       [],
};
