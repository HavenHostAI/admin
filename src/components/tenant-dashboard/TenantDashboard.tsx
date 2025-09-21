"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Users,
  Server,
  Database,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { api } from "~/trpc/react";

export function TenantDashboard() {
  const [settings, setSettings] = useState({
    tenantName: "My Tenant",
    timezone: "UTC",
    emailNotifications: true,
    systemAlerts: true,
    performanceWarnings: false,
  });

  // Fetch data from API
  const { data: stats, isLoading: statsLoading } =
    api.tenant.getStats.useQuery();
  const { data: recentActivity, isLoading: activityLoading } =
    api.tenant.getRecentActivity.useQuery();
  const { data: performanceMetrics, isLoading: metricsLoading } =
    api.tenant.getPerformanceMetrics.useQuery();

  const updateSettingsMutation = api.tenant.updateSettings.useMutation({
    onSuccess: () => {
      // Handle success
      console.log("Settings updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update settings:", error);
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Success
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            Warning
          </Badge>
        );
      case "info":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Info
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (statsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Tenant Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of your tenant&rsquo;s performance and activity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="border-green-200 text-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            All Systems Operational
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalUsers.toLocaleString() ?? "0"}
            </div>
            <p className="text-muted-foreground text-xs">
              <TrendingUp className="mr-1 inline h-3 w-3" />
              {stats?.monthlyGrowth ?? "0%"} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Servers
            </CardTitle>
            <Server className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeServers ?? "0"}
            </div>
            <p className="text-muted-foreground text-xs">
              {stats?.uptime ?? "0%"} uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <Database className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.databaseSize ?? "0 GB"}
            </div>
            <p className="text-muted-foreground text-xs">
              +0.2 GB from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.alerts ?? "0"}</div>
            <p className="text-muted-foreground text-xs">
              {stats?.completedTasks ?? "0"} tasks completed today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Server className="mr-2 h-4 w-4" />
                  Server Status
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="mr-2 h-4 w-4" />
                  Database Tools
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="mr-2 h-4 w-4" />
                  View Logs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Current system status and health metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Response Time</span>
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    45ms
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Database Connections
                  </span>
                  <Badge
                    variant="default"
                    className="bg-blue-100 text-blue-800"
                  >
                    12/50
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <Badge
                    variant="default"
                    className="bg-yellow-100 text-yellow-800"
                  >
                    78%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    23%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest events and actions in your tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="text-muted-foreground text-sm">
                    Loading activity...
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity?.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-4"
                    >
                      {getStatusIcon(activity.status)}
                      <div className="flex-1 space-y-1">
                        <p className="text-sm leading-none font-medium">
                          {activity.action}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {activity.user} • {activity.time}
                        </p>
                      </div>
                      {getStatusBadge(activity.status)}
                    </div>
                  )) ?? []}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {metricsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-muted-foreground text-sm">
                Loading performance metrics...
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Response Time</span>
                      <span>{performanceMetrics?.responseTime ?? 0}ms</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{
                          width: `${Math.min(((performanceMetrics?.responseTime ?? 0) / 100) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Throughput</span>
                      <span>
                        {performanceMetrics?.throughput?.toLocaleString() ?? 0}{" "}
                        req/min
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{
                          width: `${Math.min(((performanceMetrics?.throughput ?? 0) / 2000) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Error Rate</span>
                      <span>{performanceMetrics?.errorRate ?? 0}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{
                          width: `${Math.min((performanceMetrics?.errorRate ?? 0) * 10, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resource Usage</CardTitle>
                  <CardDescription>
                    Current resource consumption
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CPU</span>
                      <span>{performanceMetrics?.cpuUsage ?? 0}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{
                          width: `${performanceMetrics?.cpuUsage ?? 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Memory</span>
                      <span>{performanceMetrics?.memoryUsage ?? 0}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-yellow-500"
                        style={{
                          width: `${performanceMetrics?.memoryUsage ?? 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Storage</span>
                      <span>{performanceMetrics?.storageUsage ?? 0}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{
                          width: `${performanceMetrics?.storageUsage ?? 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Settings</CardTitle>
              <CardDescription>
                Configure your tenant preferences and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenantName">Tenant Name</Label>
                <Input
                  id="tenantName"
                  type="text"
                  value={settings.tenantName}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      tenantName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      timezone: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">
                    America/Los_Angeles
                  </option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Notification Preferences</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          emailNotifications: !!checked,
                        }))
                      }
                    />
                    <Label htmlFor="emailNotifications" className="text-sm">
                      Email notifications
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="systemAlerts"
                      checked={settings.systemAlerts}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          systemAlerts: !!checked,
                        }))
                      }
                    />
                    <Label htmlFor="systemAlerts" className="text-sm">
                      System alerts
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="performanceWarnings"
                      checked={settings.performanceWarnings}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          performanceWarnings: !!checked,
                        }))
                      }
                    />
                    <Label htmlFor="performanceWarnings" className="text-sm">
                      Performance warnings
                    </Label>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending
                  ? "Saving..."
                  : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
