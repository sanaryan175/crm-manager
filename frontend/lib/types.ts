// Organization Types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  industry?: string;
  website?: string;
  phone?: string;
  address?: string;
  country: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  fiscalYear: number;
  companySize?: string;
  setupComplete: boolean;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// RBAC Types
export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystem: boolean;
}

export interface Permission {
  name: string;
  resource: string;
  action: string;
}

// User Types
export type UserRole = 'owner' | 'admin' | 'sales_manager' | 'sales_rep' | 'marketing' | 'support';

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  isOwner: boolean;
  onboardingComplete: boolean;
  profileCompleted: boolean;
  timezone: string;
  language: string;
  phone?: string;
  jobTitle?: string;
  emailNotifications: boolean;
  taskReminders: boolean;
  meetingReminders: boolean;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  avatar?: string;
  lastLoginAt?: Date | string;
  createdAt: Date | string;
  organization?: Pick<Organization, 'id' | 'name' | 'country' | 'currency' | 'setupComplete' | 'timezone' | 'dateFormat' | 'timeFormat'>;
}

// Contact Types
export type ContactStatus = 'active' | 'inactive' | 'blocked';
export type ContactSource = 'website' | 'referral' | 'cold_outreach' | 'event' | 'partner' | 'other';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status: ContactStatus;
  source: ContactSource;
  tags: string[];
  assignedTo?: string | {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  } | null;
  notes?: string;
  createdBy: string; // User ID
  createdAt: Date | string;
  updatedAt: Date | string;
  _links?: {
    dealsCount: number;
    activitiesCount: number;
  };
}

// Deal Types
export type DealStage = 'new' | 'contacted' | 'demo_scheduled' | 'proposal_sent' | 'negotiation' | 'closed_won' | 'closed_lost';
export type DealPriority = 'low' | 'medium' | 'high';
export type DealCloseReason = 'won' | 'lost' | 'no_decision' | 'cancelled' | '';

export const DEAL_STAGES: Record<DealStage, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-gray-500' },
  contacted: { label: 'Contacted', color: 'bg-blue-500' },
  demo_scheduled: { label: 'Demo Scheduled', color: 'bg-cyan-500' },
  proposal_sent: { label: 'Proposal Sent', color: 'bg-purple-500' },
  negotiation: { label: 'Negotiation', color: 'bg-orange-500' },
  closed_won: { label: 'Closed Won', color: 'bg-green-500' },
  closed_lost: { label: 'Closed Lost', color: 'bg-red-500' },
};

export interface Deal {
  id: string;
  title: string;
  contactId?: string;
  company?: string;
  value: number;
  stage: DealStage;
  priority: DealPriority;
  expectedCloseDate?: Date | string;
  assignedTo?: string | {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  } | null;
  notes?: string;
  closeReason?: DealCloseReason;
  closedAt?: Date | string;
  createdBy: string; // User ID
  createdAt: Date | string;
  updatedAt: Date | string;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    company?: string;
    email: string;
  } | null;
}

// Activity Types
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task';

export const ACTIVITY_TYPES: Record<ActivityType, { label: string; icon: string; color: string }> = {
  call: { label: 'Call', icon: 'Phone', color: 'bg-blue-500' },
  email: { label: 'Email', icon: 'Mail', color: 'bg-purple-500' },
  meeting: { label: 'Meeting', icon: 'Calendar', color: 'bg-green-500' },
  note: { label: 'Note', icon: 'FileText', color: 'bg-gray-500' },
  task: { label: 'Task', icon: 'CheckSquare', color: 'bg-orange-500' },
};

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  description?: string;
  contactId?: string;
  dealId?: string;
  assignedTo?: string | {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  } | null;
  dueDate?: Date | string;
  completed: boolean;
  completedAt?: Date | string;
  createdBy: string; // User ID
  createdAt: Date | string;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    company?: string;
  } | null;
  deal?: {
    id: string;
    title: string;
    value: number;
  } | null;
}

// Invitation Types
export interface Invitation {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: Date | string;
  createdAt: Date | string;
  role: { name: string; displayName: string };
  invitedBy: { name: string; email: string };
}

// Dashboard Types
export interface DashboardTrends {
  contacts: number;
  pipeline: number;
  conversion: number;
  closed: number;
}

export interface DashboardMetrics {
  totalContacts: number;
  totalDeals: number;
  pipelineValue: number;
  closedWonThisMonth: number;
  conversionRate: number;
  averageDealSize: number;
  overdueTasks: number;
  thisWeekActivities: number;
  trends: DashboardTrends;
}

export interface PipelineMetrics {
  stageName: DealStage;
  count: number;
  value: number;
  avgValue: number;
}

// File Entry Types
export interface FileEntry {
  id: string;
  organizationId: string;
  uploadedById: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  folder: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface FileStructure {
  folders: string[];
  files: FileEntry[];
  tree: Record<string, FileEntry[]>;
}
