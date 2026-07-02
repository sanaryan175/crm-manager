import type { User, Contact, Deal, Activity } from './types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Sarah Chen',
    email: 'sarah@company.com',
    role: 'admin',
    isActive: true,
    avatar: 'SC',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'user-2',
    name: 'Marcus Johnson',
    email: 'marcus@company.com',
    role: 'manager',
    isActive: true,
    avatar: 'MJ',
    createdAt: new Date('2024-01-20'),
  },
  {
    id: 'user-3',
    name: 'Emily Rodriguez',
    email: 'emily@company.com',
    role: 'rep',
    isActive: true,
    avatar: 'ER',
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'user-4',
    name: 'David Kim',
    email: 'david@company.com',
    role: 'rep',
    isActive: true,
    avatar: 'DK',
    createdAt: new Date('2024-02-05'),
  },
];

// Mock Contacts
export const mockContacts: Contact[] = [
  {
    id: 'contact-1',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james.wilson@techcorp.com',
    phone: '+1-555-0101',
    company: 'TechCorp Inc',
    jobTitle: 'VP of Sales',
    status: 'active',
    source: 'referral',
    tags: ['enterprise', 'hot'],
    assignedTo: 'user-3',
    notes: 'Very interested in demo. Looking for Q3 implementation.',
    createdBy: 'user-1',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-28'),
    _links: { dealsCount: 2, activitiesCount: 5 },
  },
  {
    id: 'contact-2',
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'lisa@innovate.io',
    phone: '+1-555-0102',
    company: 'Innovate Labs',
    jobTitle: 'Founder & CEO',
    status: 'active',
    source: 'cold_outreach',
    tags: ['startup', 'interested'],
    assignedTo: 'user-4',
    notes: 'Met at SaaS conference. Requested pricing info.',
    createdBy: 'user-1',
    createdAt: new Date('2024-06-05'),
    updatedAt: new Date('2024-06-27'),
    _links: { dealsCount: 1, activitiesCount: 3 },
  },
  {
    id: 'contact-3',
    firstName: 'Robert',
    lastName: 'Martinez',
    email: 'robert@globalretail.com',
    phone: '+1-555-0103',
    company: 'Global Retail Co',
    jobTitle: 'Operations Director',
    status: 'active',
    source: 'website',
    tags: ['retail', 'large-account'],
    assignedTo: 'user-3',
    notes: 'Needs solution for multi-location management.',
    createdBy: 'user-1',
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-06-25'),
    _links: { dealsCount: 1, activitiesCount: 4 },
  },
  {
    id: 'contact-4',
    firstName: 'Amanda',
    lastName: 'Thompson',
    email: 'amanda@financeplus.com',
    phone: '+1-555-0104',
    company: 'FinancePlus',
    jobTitle: 'CFO',
    status: 'active',
    source: 'partner',
    tags: ['finance', 'compliance'],
    assignedTo: 'user-4',
    notes: 'Looking to improve reporting capabilities.',
    createdBy: 'user-1',
    createdAt: new Date('2024-06-10'),
    updatedAt: new Date('2024-06-26'),
    _links: { dealsCount: 0, activitiesCount: 2 },
  },
  {
    id: 'contact-5',
    firstName: 'Michael',
    lastName: 'Bennett',
    email: 'michael@consult.pro',
    company: 'Consulting Pro',
    jobTitle: 'Senior Partner',
    status: 'inactive',
    source: 'event',
    tags: ['consulting', 'follow-up-needed'],
    assignedTo: 'user-3',
    notes: 'Interested but postponed to Q4.',
    createdBy: 'user-1',
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-06-20'),
    _links: { dealsCount: 0, activitiesCount: 1 },
  },
];

// Mock Deals
export const mockDeals: Deal[] = [
  {
    id: 'deal-1',
    title: 'TechCorp Enterprise Contract',
    contactId: 'contact-1',
    company: 'TechCorp Inc',
    value: 250000,
    stage: 'proposal_sent',
    priority: 'high',
    expectedCloseDate: new Date('2024-07-15'),
    assignedTo: 'user-3',
    notes: 'Waiting for steering committee approval.',
    createdBy: 'user-1',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-28'),
  },
  {
    id: 'deal-2',
    title: 'TechCorp Support Package',
    contactId: 'contact-1',
    company: 'TechCorp Inc',
    value: 35000,
    stage: 'negotiation',
    priority: 'medium',
    expectedCloseDate: new Date('2024-07-01'),
    assignedTo: 'user-3',
    notes: 'Negotiating annual support terms.',
    createdBy: 'user-1',
    createdAt: new Date('2024-06-15'),
    updatedAt: new Date('2024-06-27'),
  },
  {
    id: 'deal-3',
    title: 'Innovate Labs Pilot',
    contactId: 'contact-2',
    company: 'Innovate Labs',
    value: 25000,
    stage: 'demo_scheduled',
    priority: 'high',
    expectedCloseDate: new Date('2024-08-01'),
    assignedTo: 'user-4',
    notes: 'Demo scheduled for July 8th.',
    createdBy: 'user-1',
    createdAt: new Date('2024-06-05'),
    updatedAt: new Date('2024-06-26'),
  },
  {
    id: 'deal-4',
    title: 'Global Retail Multi-Location',
    contactId: 'contact-3',
    company: 'Global Retail Co',
    value: 180000,
    stage: 'contacted',
    priority: 'high',
    expectedCloseDate: new Date('2024-09-30'),
    assignedTo: 'user-3',
    notes: 'Initial discovery call completed.',
    createdBy: 'user-1',
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-06-25'),
  },
  {
    id: 'deal-5',
    title: 'FinancePlus Reporting Module',
    contactId: 'contact-4',
    company: 'FinancePlus',
    value: 45000,
    stage: 'new',
    priority: 'medium',
    expectedCloseDate: new Date('2024-10-15'),
    assignedTo: 'user-4',
    notes: 'Preliminary interest expressed.',
    createdBy: 'user-1',
    createdAt: new Date('2024-06-10'),
    updatedAt: new Date('2024-06-26'),
  },
  {
    id: 'deal-6',
    title: 'Closed Won - XYZ Marketing',
    contactId: undefined,
    company: 'XYZ Marketing',
    value: 95000,
    stage: 'closed_won',
    priority: 'high',
    expectedCloseDate: new Date('2024-06-15'),
    assignedTo: 'user-3',
    closeReason: 'won',
    closedAt: new Date('2024-06-15'),
    notes: 'Successfully closed. Implementation starts July 1.',
    createdBy: 'user-1',
    createdAt: new Date('2024-04-15'),
    updatedAt: new Date('2024-06-15'),
  },
];

// Mock Activities
export const mockActivities: Activity[] = [
  {
    id: 'activity-1',
    type: 'call',
    subject: 'Discovery call with James Wilson',
    description: 'Discussed current pain points and timeline. Very interested in demo.',
    contactId: 'contact-1',
    dealId: 'deal-1',
    assignedTo: 'user-3',
    completed: true,
    completedAt: new Date('2024-06-25'),
    createdBy: 'user-3',
    createdAt: new Date('2024-06-25'),
  },
  {
    id: 'activity-2',
    type: 'email',
    subject: 'Sent proposal for TechCorp Enterprise',
    description: 'Sent detailed proposal with pricing and implementation timeline.',
    contactId: 'contact-1',
    dealId: 'deal-1',
    assignedTo: 'user-3',
    completed: true,
    completedAt: new Date('2024-06-26'),
    createdBy: 'user-3',
    createdAt: new Date('2024-06-26'),
  },
  {
    id: 'activity-3',
    type: 'meeting',
    subject: 'Schedule demo with Innovate Labs',
    description: 'Demo confirmed for July 8th at 2 PM PST.',
    contactId: 'contact-2',
    dealId: 'deal-3',
    assignedTo: 'user-4',
    dueDate: new Date('2024-07-08'),
    completed: false,
    createdBy: 'user-4',
    createdAt: new Date('2024-06-20'),
  },
  {
    id: 'activity-4',
    type: 'task',
    subject: 'Follow up on Global Retail proposal',
    description: 'Check in on proposal status and timeline.',
    contactId: 'contact-3',
    dealId: 'deal-4',
    assignedTo: 'user-3',
    dueDate: new Date('2024-07-01'),
    completed: false,
    createdBy: 'user-3',
    createdAt: new Date('2024-06-25'),
  },
  {
    id: 'activity-5',
    type: 'note',
    subject: 'Notes from market research',
    description: 'Global Retail is expanding to 15 new locations. Great growth opportunity.',
    contactId: 'contact-3',
    dealId: 'deal-4',
    completed: true,
    createdBy: 'user-3',
    createdAt: new Date('2024-06-24'),
  },
  {
    id: 'activity-6',
    type: 'email',
    subject: 'Initial outreach to Lisa Anderson',
    description: 'Cold email about our platform. Got positive response.',
    contactId: 'contact-2',
    completed: true,
    completedAt: new Date('2024-06-05'),
    createdBy: 'user-4',
    createdAt: new Date('2024-06-05'),
  },
  {
    id: 'activity-7',
    type: 'task',
    subject: 'Send pricing info to FinancePlus',
    description: 'Amanda Thompson requested detailed pricing and use cases.',
    contactId: 'contact-4',
    dealId: 'deal-5',
    assignedTo: 'user-4',
    dueDate: new Date('2024-06-30'),
    completed: false,
    createdBy: 'user-4',
    createdAt: new Date('2024-06-26'),
  },
];

// Get current user (for auth context)
export const getCurrentUser = (): User => mockUsers[0];

// Get deals by stage for pipeline
export const getDealsByStage = () => {
  const stages: Record<string, Deal[]> = {};
  mockDeals.forEach((deal) => {
    if (!stages[deal.stage]) {
      stages[deal.stage] = [];
    }
    stages[deal.stage].push(deal);
  });
  return stages;
};

// Get contact with activities
export const getContactWithActivities = (contactId: string) => {
  const contact = mockContacts.find((c) => c.id === contactId);
  const activities = mockActivities.filter((a) => a.contactId === contactId);
  return { contact, activities };
};

// Get deal with activities
export const getDealWithActivities = (dealId: string) => {
  const deal = mockDeals.find((d) => d.id === dealId);
  const activities = mockActivities.filter((a) => a.dealId === dealId);
  return { deal, activities };
};

// Dashboard metrics
export const getDashboardMetrics = () => {
  const totalContacts = mockContacts.length;
  const totalDeals = mockDeals.length;
  const pipelineValue = mockDeals
    .filter((d) => !['closed_won', 'closed_lost'].includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0);
  const closedWonThisMonth = mockDeals
    .filter(
      (d) =>
        d.stage === 'closed_won' &&
        d.closedAt &&
        d.closedAt.getMonth() === new Date().getMonth()
    )
    .reduce((sum, d) => sum + d.value, 0);
  const overdueTasks = mockActivities.filter(
    (a) => a.type === 'task' && a.dueDate && a.dueDate < new Date() && !a.completed
  ).length;

  return {
    totalContacts,
    totalDeals,
    pipelineValue,
    closedWonThisMonth,
    conversionRate: 68,
    averageDealSize: Math.round(pipelineValue / (totalDeals - 1)),
    overdueTasks,
    thisWeekActivities: mockActivities.filter(
      (a) =>
        a.createdAt.getTime() >
        new Date(new Date().setDate(new Date().getDate() - 7)).getTime()
    ).length,
  };
};
