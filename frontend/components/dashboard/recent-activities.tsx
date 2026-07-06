'use client';

import React from 'react';
import Link from 'next/link';
import { useActivities } from '@/lib/hooks';
import { ACTIVITY_TYPES } from '@/lib/types';
import Card, { CardHeader } from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { useRegion } from '@/lib/context';

export default function RecentActivities() {
  const { activities, isLoading, error } = useActivities();
  const { formatDateTime } = useRegion();
  const recentActivities = activities.slice(0, 5);

  if (error) {
    return (
      <Card className="text-center py-6 text-red-500 text-xs">
        Failed to load recent activities.
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="py-6 flex justify-center items-center">
        <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Recent Activities"
        description="Latest updates from your team"
        action={
          <Link
            href="/activities"
            className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-3 h-3" />
          </Link>
        }
      />

      <div className="space-y-3">
        {recentActivities.map((activity) => {
          const contact = activity.contact;

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <Badge variant="primary" size="sm" className="flex-shrink-0">
                {activity.type.charAt(0).toUpperCase()}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {activity.subject}
                </p>
                {contact && (
                  <p className="text-xs text-muted-foreground truncate">
                    {contact.firstName} {contact.lastName}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex-shrink-0">
                {formatDateTime(activity.createdAt, { includeTime: false })}
              </p>
            </div>
          );
        })}
      </div>

      <Link
        href="/activities"
        className="block mt-4 pt-4 border-t border-border text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        View all activities
      </Link>
    </Card>
  );
}

