'use client';

import React from 'react';
import { motion } from 'framer-motion';
import DashboardMetrics from '@/components/dashboard/metrics';
import PipelineOverview from '@/components/dashboard/pipeline-overview';
import RecentActivities from '@/components/dashboard/recent-activities';
import QuickStats from '@/components/dashboard/quick-stats';

export default function DashboardPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      className="p-6 space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s your sales overview.</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants}>
        <QuickStats />
      </motion.div>

      {/* Metrics Grid */}
      <motion.div variants={itemVariants}>
        <DashboardMetrics />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <PipelineOverview />
        </motion.div>
        <motion.div variants={itemVariants}>
          <RecentActivities />
        </motion.div>
      </div>
    </motion.div>
  );
}
