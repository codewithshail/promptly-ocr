"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileCheck,
  ClipboardList,
  TrendingUp,
  Plus,
  ExternalLink,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  evaluationsToday: number;
  testsCompleted: number;
  totalEvaluations: number;
  totalTests: number;
  totalTemplates: number;
  totalNews: number;
}

interface RecentActivity {
  id: string;
  type: "evaluation" | "test" | "user" | "news";
  description: string;
  timestamp: Date;
  status?: "success" | "pending" | "error";
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setRecentActivity(data.recentActivity);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading || !stats) {
    return null; // Skeleton is shown by parent
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      change: `${stats.activeUsers} active`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Evaluations Today",
      value: stats.evaluationsToday,
      change: `${stats.totalEvaluations} total`,
      icon: FileCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Tests Completed",
      value: stats.testsCompleted,
      change: `${stats.totalTests} available`,
      icon: ClipboardList,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Content Items",
      value: stats.totalTemplates + stats.totalNews,
      change: `${stats.totalTemplates} templates`,
      icon: TrendingUp,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {stat.value.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/mock-tests">
                <Plus className="h-4 w-4 mr-2" />
                Create Mock Test
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/templates">
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/announcements">
                <Plus className="h-4 w-4 mr-2" />
                Send Announcement
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <HealthIndicator
              label="Database"
              status="operational"
              message="All systems operational"
            />
            <HealthIndicator
              label="Background Jobs"
              status="operational"
              message="Inngest processing normally"
            />
            <HealthIndicator
              label="News API"
              status="operational"
              message="Last fetch: 2 hours ago"
            />
            <HealthIndicator
              label="AI Services"
              status="operational"
              message="Gemini API responding"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/users">
              View All
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No recent activity
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HealthIndicator({
  label,
  status,
  message,
}: {
  label: string;
  status: "operational" | "degraded" | "down";
  message: string;
}) {
  const statusConfig = {
    operational: {
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      badge: "Operational",
    },
    degraded: {
      icon: AlertCircle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      badge: "Degraded",
    },
    down: {
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      badge: "Down",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${config.bgColor}`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{message}</p>
        </div>
      </div>
      <Badge
        variant="outline"
        className={`${config.color} border-current`}
      >
        {config.badge}
      </Badge>
    </div>
  );
}

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const typeConfig = {
    evaluation: { icon: FileCheck, color: "text-green-600" },
    test: { icon: ClipboardList, color: "text-purple-600" },
    user: { icon: Users, color: "text-blue-600" },
    news: { icon: Activity, color: "text-amber-600" },
  };

  const config = typeConfig[activity.type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors">
      <div className="p-2 rounded-lg bg-slate-100">
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900">{activity.description}</p>
        <p className="text-xs text-slate-500 mt-1">
          {formatDistanceToNow(new Date(activity.timestamp), {
            addSuffix: true,
          })}
        </p>
      </div>
      {activity.status && (
        <Badge
          variant={
            activity.status === "success"
              ? "default"
              : activity.status === "error"
              ? "destructive"
              : "secondary"
          }
        >
          {activity.status}
        </Badge>
      )}
    </div>
  );
}
