import { PrismaClient, ContactStatus, ContactSource, DealStage, DealPriority, DealCloseReason, ActivityType } from '@prisma/client';
import { OnboardingService } from '../src/services/onboarding.service';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean all tables in correct dependency order
  await prisma.fileEntry.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.user.deleteMany();           // users before roles
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.organization.deleteMany();

  // Create organization + owner atomically
  const { organization: org, user: owner } = await OnboardingService.registerOwner({
    ownerName:     'Sarah Chen',
    ownerEmail:    'sarah@company.com',
    ownerPassword: 'password123',
  });
  console.log('Created org:', org.name, '| Owner:', owner.name);

  // Complete setup for the seed org
  await OnboardingService.completeSetup(org.id, owner.id, {
    name:        'Acme Corp',
    industry:    'Technology',
    companySize: '11–50 employees',
    country:     'US',
    currency:    'USD',
    timezone:    'America/New_York',
    fiscalYear:  1,
  });

  // Get role IDs for seeding other users
  const roles = await prisma.role.findMany({ where: { organizationId: org.id } });
  const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));

  // Create additional users with different roles
  const bcrypt = await import('bcryptjs');
  const hash   = await bcrypt.hash('password123', 12);

  const marcus = await prisma.user.create({
    data: {
      organizationId: org.id,
      roleId:         roleMap['admin'],
      name:           'Marcus Johnson',
      email:          'marcus@company.com',
      password:       hash,
      avatar:         'MJ',
    },
  });

  const emily = await prisma.user.create({
    data: {
      organizationId: org.id,
      roleId:         roleMap['sales_manager'],
      name:           'Emily Rodriguez',
      email:          'emily@company.com',
      password:       hash,
      avatar:         'ER',
    },
  });

  const david = await prisma.user.create({
    data: {
      organizationId: org.id,
      roleId:         roleMap['sales_rep'],
      name:           'David Kim',
      email:          'david@company.com',
      password:       hash,
      avatar:         'DK',
    },
  });

  console.log('Created users:', [marcus.name, emily.name, david.name].join(', '));

  // ─── Data assigned to Sarah (owner) so she sees notifications ───
  const sarahContact = await prisma.contact.create({
    data: {
      organizationId: org.id,
      firstName: 'Priya', lastName: 'Sharma',
      email: 'priya@startupxyz.com', phone: '+1-555-0201',
      company: 'StartupXYZ', jobTitle: 'CEO',
      status: ContactStatus.active, source: ContactSource.website,
      tags: ['startup', 'hot'],
      assignedToId: owner.id, createdById: owner.id,
    },
  });
  await prisma.contact.create({
    data: {
      organizationId: org.id,
      firstName: 'Tom', lastName: 'Nash',
      email: 'tom@nashconsulting.com', phone: '+1-555-0202',
      company: 'Nash Consulting', jobTitle: 'Principal',
      status: ContactStatus.inactive, source: ContactSource.event,
      tags: ['consulting', 'follow-up'],
      assignedToId: owner.id, createdById: owner.id,
    },
  });

  const sarahDeal = await prisma.deal.create({
    data: {
      organizationId: org.id,
      title: 'StartupXYZ SaaS Partnership',
      contactId: sarahContact.id, company: 'StartupXYZ',
      value: 75000,
      stage: DealStage.negotiation, priority: DealPriority.high,
      expectedCloseDate: new Date('2026-08-15'),
      assignedToId: owner.id, createdById: owner.id,
      notes: 'Interested in annual plan with onboarding.',
    },
  });
  await prisma.deal.create({
    data: {
      organizationId: org.id,
      title: 'Nash Consulting Retainer',
      value: 12000,
      stage: DealStage.new, priority: DealPriority.low,
      assignedToId: owner.id, createdById: owner.id,
    },
  });

  await prisma.activity.createMany({
    data: [
      {
        organizationId: org.id, type: ActivityType.meeting,
        subject: 'Strategy call with Priya Sharma',
        contactId: sarahContact.id, dealId: sarahDeal.id,
        assignedToId: owner.id, createdById: owner.id,
        dueDate: new Date('2026-07-20'), completed: false,
      },
      {
        organizationId: org.id, type: ActivityType.task,
        subject: 'Draft partnership agreement for StartupXYZ',
        contactId: sarahContact.id, dealId: sarahDeal.id,
        assignedToId: owner.id, createdById: owner.id,
        dueDate: new Date('2026-07-25'), completed: false,
      },
      {
        organizationId: org.id, type: ActivityType.email,
        subject: 'Follow-up with Tom Nash',
        assignedToId: owner.id, createdById: owner.id,
        dueDate: new Date('2026-07-18'), completed: false,
      },
    ],
  });
  console.log('Created data assigned to Sarah (owner) for notifications');

  // Contacts
  const c1 = await prisma.contact.create({
    data: {
      organizationId: org.id,
      firstName: 'James', lastName: 'Wilson',
      email: 'james.wilson@techcorp.com', phone: '+1-555-0101',
      company: 'TechCorp Inc', jobTitle: 'VP of Sales',
      status: ContactStatus.active, source: ContactSource.referral,
      tags: ['enterprise', 'hot'],
      assignedToId: emily.id, createdById: owner.id,
    },
  });
  const c2 = await prisma.contact.create({
    data: {
      organizationId: org.id,
      firstName: 'Lisa', lastName: 'Anderson',
      email: 'lisa@innovate.io', phone: '+1-555-0102',
      company: 'Innovate Labs', jobTitle: 'Founder & CEO',
      status: ContactStatus.active, source: ContactSource.cold_outreach,
      tags: ['startup', 'interested'],
      assignedToId: david.id, createdById: owner.id,
    },
  });
  const c3 = await prisma.contact.create({
    data: {
      organizationId: org.id,
      firstName: 'Robert', lastName: 'Martinez',
      email: 'robert@globalretail.com', phone: '+1-555-0103',
      company: 'Global Retail Co', jobTitle: 'Operations Director',
      status: ContactStatus.active, source: ContactSource.website,
      tags: ['retail', 'large-account'],
      assignedToId: emily.id, createdById: owner.id,
    },
  });
  const c4 = await prisma.contact.create({
    data: {
      organizationId: org.id,
      firstName: 'Amanda', lastName: 'Thompson',
      email: 'amanda@financeplus.com', phone: '+1-555-0104',
      company: 'FinancePlus', jobTitle: 'CFO',
      status: ContactStatus.active, source: ContactSource.partner,
      tags: ['finance', 'compliance'],
      assignedToId: david.id, createdById: owner.id,
    },
  });
  await prisma.contact.create({
    data: {
      organizationId: org.id,
      firstName: 'Michael', lastName: 'Bennett',
      email: 'michael@consult.pro',
      company: 'Consulting Pro', jobTitle: 'Senior Partner',
      status: ContactStatus.inactive, source: ContactSource.event,
      tags: ['consulting'],
      assignedToId: emily.id, createdById: owner.id,
    },
  });
  console.log('Created 5 contacts');

  // Deals
  const d1 = await prisma.deal.create({
    data: {
      organizationId: org.id,
      title: 'TechCorp Enterprise Contract',
      contactId: c1.id, company: 'TechCorp Inc',
      value: 250000,
      stage: DealStage.proposal_sent, priority: DealPriority.high,
      expectedCloseDate: new Date('2025-07-15'),
      assignedToId: emily.id, createdById: owner.id,
      notes: 'Waiting for steering committee approval.',
    },
  });
  await prisma.deal.create({
    data: {
      organizationId: org.id,
      title: 'TechCorp Support Package',
      contactId: c1.id, company: 'TechCorp Inc',
      value: 35000,
      stage: DealStage.negotiation, priority: DealPriority.medium,
      assignedToId: emily.id, createdById: owner.id,
    },
  });
  const d3 = await prisma.deal.create({
    data: {
      organizationId: org.id,
      title: 'Innovate Labs Pilot',
      contactId: c2.id, company: 'Innovate Labs',
      value: 25000,
      stage: DealStage.demo_scheduled, priority: DealPriority.high,
      expectedCloseDate: new Date('2025-08-01'),
      assignedToId: david.id, createdById: owner.id,
    },
  });
  const d4 = await prisma.deal.create({
    data: {
      organizationId: org.id,
      title: 'Global Retail Multi-Location',
      contactId: c3.id, company: 'Global Retail Co',
      value: 180000,
      stage: DealStage.contacted, priority: DealPriority.high,
      assignedToId: emily.id, createdById: owner.id,
    },
  });
  const d5 = await prisma.deal.create({
    data: {
      organizationId: org.id,
      title: 'FinancePlus Reporting Module',
      contactId: c4.id, company: 'FinancePlus',
      value: 45000,
      stage: DealStage.new, priority: DealPriority.medium,
      assignedToId: david.id, createdById: owner.id,
    },
  });
  await prisma.deal.create({
    data: {
      organizationId: org.id,
      title: 'Closed Won - XYZ Marketing',
      company: 'XYZ Marketing',
      value: 95000,
      stage: DealStage.closed_won, priority: DealPriority.high,
      closeReason: DealCloseReason.won,
      closedAt: new Date('2025-06-15'),
      assignedToId: emily.id, createdById: owner.id,
    },
  });
  console.log('Created 6 deals');

  // Activities
  await prisma.activity.createMany({
    data: [
      {
        organizationId: org.id, type: ActivityType.call,
        subject: 'Discovery call with James Wilson',
        contactId: c1.id, dealId: d1.id,
        assignedToId: emily.id, createdById: emily.id,
        completed: true, completedAt: new Date(),
      },
      {
        organizationId: org.id, type: ActivityType.email,
        subject: 'Sent proposal for TechCorp',
        contactId: c1.id, dealId: d1.id,
        assignedToId: emily.id, createdById: emily.id,
        completed: true, completedAt: new Date(),
      },
      {
        organizationId: org.id, type: ActivityType.meeting,
        subject: 'Demo with Innovate Labs',
        contactId: c2.id, dealId: d3.id,
        assignedToId: david.id, createdById: david.id,
        dueDate: new Date('2025-07-08'), completed: false,
      },
      {
        organizationId: org.id, type: ActivityType.task,
        subject: 'Follow up on Global Retail proposal',
        contactId: c3.id, dealId: d4.id,
        assignedToId: emily.id, createdById: emily.id,
        dueDate: new Date('2025-07-01'), completed: false,
      },
      {
        organizationId: org.id, type: ActivityType.task,
        subject: 'Send pricing info to FinancePlus',
        contactId: c4.id, dealId: d5.id,
        assignedToId: david.id, createdById: david.id,
        dueDate: new Date('2025-06-30'), completed: false,
      },
    ],
  });
  console.log('Created activities');
  console.log('\n✅ Seeding complete!');
  console.log('Login: sarah@company.com / password123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
