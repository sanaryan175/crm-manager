# CRM - Customer Relationship Management System

A production-grade CRM application built with React, Next.js 16, TypeScript, Tailwind CSS, and Framer Motion. Designed for sales teams to manage contacts, deals, and activities in one unified platform.

## Features

- **Dashboard**: Real-time KPIs, pipeline overview, and activity feed
- **Contacts Management**: CRUD operations, search, filter, tagging, assignment
- **Sales Pipeline**: Kanban board with drag-and-drop, deal tracking, priority management
- **Activities Tracking**: Call, email, meeting, note, and task logging
- **Modern UI**: Dark mode, smooth animations, responsive design
- **Type-Safe**: Full TypeScript coverage with Zod validation

## Technology Stack

- **Frontend Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 4 + custom design system
- **Animations**: Framer Motion 12
- **Components**: shadcn/ui
- **Charts**: Recharts
- **State Management**: React Context API
- **Forms**: React Hook Form + Zod

## Project Structure

```
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home (redirects to dashboard)
│   ├── dashboard/               # Dashboard page
│   ├── contacts/                # Contacts module
│   ├── deals/                   # Deals/Pipeline module
│   ├── activities/              # Activities module
│   ├── settings/                # Settings page
│   └── globals.css              # Design system & tokens
├── components/
│   ├── layout/                  # Layout components (sidebar, nav, toast)
│   ├── dashboard/               # Dashboard components (metrics, charts)
│   ├── contacts/                # Contacts components
│   ├── deals/                   # Deals components (Kanban board)
│   └── ui/                      # Reusable UI components (card, badge, modal)
├── lib/
│   ├── types.ts                 # TypeScript type definitions
│   ├── mockData.ts              # Mock data for development
│   ├── context.tsx              # React Context providers
│   └── utils.ts                 # Utility functions
└── package.json                 # Dependencies

```

## Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You'll be automatically redirected to the dashboard.

### Mock Authentication

The app uses mock data for development. The current user is:
- **Name**: Sarah Chen
- **Email**: sarah@company.com
- **Role**: Admin

No login required for testing.

## Core Components

### Dashboard (`/dashboard`)
- KPI cards with trend indicators
- Sales pipeline chart
- Recent activities feed
- Quick stats (overdue tasks, avg deal size)

### Contacts (`/contacts`)
- List view with search and filter
- Contact details
- Assignment management
- Tag system
- Activity history

### Deals (`/deals`)
- **Kanban Board**: Drag-and-drop deal management
- Pipeline stages: New → Contacted → Demo Scheduled → Proposal Sent → Negotiation → Closed Won/Lost
- Deal cards with priority and value
- Pipeline overview chart

### Activities (`/activities`)
- Activity types: Call, Email, Meeting, Note, Task
- Search and filtering
- Completion tracking
- Linked to contacts and deals

## Design System

### Color Palette
- **Primary**: Purple/Blue (#6366f1)
- **Accent**: Lavender (#8b5cf6)
- **Background**: Dark (#1c1c1c in dark mode)
- **Card**: Slightly lighter gray (#1f2937)
- **Borders**: Subtle gray (#374151)

### Typography
- **Font**: Geist Sans (headings and body)
- **Mono**: Geist Mono (code)
- **Line Height**: 1.6 for readability

### Spacing & Sizing
- Uses Tailwind's standard spacing scale (0.25rem increments)
- Border radius: 0.625rem (default)
- Icons: 16px, 20px, 24px

## Features Ready for Backend Integration

The codebase is structured for easy API integration:

1. **Mock Data Layer**: Replace `mockData.ts` with API calls
2. **Context Hooks**: `useAuth()`, `useUI()`, `useFilters()` provide state management
3. **Type Definitions**: `types.ts` defines all data models
4. **API-Ready Patterns**: Components use data props, not direct API calls

### Example Integration Points

```typescript
// Instead of:
const { contacts } = mockData;

// Switch to:
const { data: contacts } = useFetch('/api/contacts');
```

## Performance Optimizations

- Lazy component loading with React.lazy()
- Memoization for expensive components
- Optimized re-renders with proper key props
- Chart animations only on mount
- Responsive images with Next.js Image component

## Accessibility

- Semantic HTML elements
- WCAG AA color contrast
- Keyboard navigation support
- ARIA labels on interactive elements
- Focus management in modals

## Responsive Design

- **Mobile**: Single column, collapsed sidebar
- **Tablet**: 2-column layout, hamburger menu
- **Desktop**: Full layout with persistent sidebar

Tested at: 375px (mobile), 768px (tablet), 1024px (desktop), 1920px (wide)

## Future Enhancements

### Phase 2 (Backend Integration)
- [ ] Database integration (PostgreSQL/Supabase)
- [ ] Real authentication
- [ ] Real-time updates via WebSockets
- [ ] CSV import/export
- [ ] Advanced filtering and saved views

### Phase 3 (Advanced Features)
- [ ] Custom fields per contact/deal
- [ ] Email integration
- [ ] Workflow automation
- [ ] Reporting & analytics
- [ ] Team collaboration features

### Phase 4 (Mobile & Integrations)
- [ ] React Native mobile app
- [ ] Salesforce integration
- [ ] HubSpot sync
- [ ] Google Calendar integration
- [ ] Slack notifications

## Development Commands

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

## Environment Variables

No environment variables required for development (mock mode).

For production with real backend:
- `NEXT_PUBLIC_API_URL`: Backend API endpoint
- `NEXT_PUBLIC_AUTH_URL`: Authentication service URL

## Deployment

### Vercel (Recommended)
```bash
# Connect repository to Vercel
# Auto-deploys on push
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the development team.
