'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle } from 'lucide-react';
import { useActivities } from '@/lib/hooks';
import { ACTIVITY_TYPES } from '@/lib/types';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import { useFilters, useUI } from '@/lib/context';

export default function ActivitiesPage() {
  const { searchQuery, setSearchQuery, filters, setFilter } = useFilters();
  const [filterType, setFilterType] = useState<string>('');
  const { addToast } = useUI();

  const { activities, isLoading, error, completeActivity } = useActivities({
    type: filterType || undefined,
  });

  // Filter activities client-side based on search and completion status
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        activity.subject.toLowerCase().includes(searchLower) ||
        (activity.description && activity.description.toLowerCase().includes(searchLower));

      const matchesCompleted = !filters.showCompleted || activity.completed;

      return matchesSearch && matchesCompleted;
    });
  }, [activities, searchQuery, filters.showCompleted]);

  const handleToggleComplete = async (id: string, currentCompleted: boolean) => {
    try {
      await completeActivity(id, !currentCompleted);
      addToast({
        type: 'success',
        message: `Activity marked as ${!currentCompleted ? 'completed' : 'incomplete'}.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        message: 'Failed to update activity completion.',
      });
    }
  };

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activities</h1>
          <p className="text-muted-foreground mt-1">
            Track all your calls, emails, meetings, and tasks
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          New Activity
        </button>
      </div>

      {/* Toolbar */}
      <Card className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-xs">
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-muted/50 outline-none text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg bg-muted/50 outline-none text-sm"
          >
            <option value="">All types</option>
            {Object.entries(ACTIVITY_TYPES).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          <button
            onClick={() =>
              setFilter('showCompleted', !(filters as any).showCompleted)
            }
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
              (filters as any).showCompleted
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent/10 text-foreground'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Completed
          </button>
        </div>
      </Card>

      {/* Activities list */}
      {error ? (
        <div className="text-center text-red-500 py-12">
          Failed to load activities. Make sure API is running.
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredActivities.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-muted-foreground">No activities found</p>
            </Card>
          ) : (
            filteredActivities.map((activity, index) => {
              const config = ACTIVITY_TYPES[activity.type];
              const contact = activity.contact;
              const user = typeof activity.assignedTo === 'object' && activity.assignedTo ? activity.assignedTo : null;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`p-4 ${activity.completed ? 'opacity-60' : ''}`}>
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={activity.completed}
                        onChange={() => handleToggleComplete(activity.id, activity.completed)}
                        className="w-5 h-5 rounded-lg mt-1 cursor-pointer"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4
                              className={`font-medium ${
                                activity.completed
                                  ? 'text-muted-foreground line-through'
                                  : 'text-foreground'
                              }`}
                            >
                              {activity.subject}
                            </h4>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {activity.description}
                              </p>
                            )}

                            {/* Links */}
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="default" size="sm">
                                {config.label}
                              </Badge>
                              {contact && (
                                <span className="text-xs text-muted-foreground">
                                  {contact.firstName} {contact.lastName}
                                </span>
                              )}
                              {user && (
                                <span className="text-xs text-muted-foreground">
                                  Assigned: {user.name}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            {activity.dueDate && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(activity.dueDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: new Date(activity.dueDate).getFullYear() !== new Date().getFullYear() ? '2-digit' : undefined,
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </motion.div>
  );
}
