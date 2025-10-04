import { useCallback, useEffect, useMemo, useState } from "react";
import { useGetIdentity } from "ra-core";
import { AlertTriangle, Activity, Bot, Building2 } from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useQuery } from "convex/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type IdentityWithCompany = {
  id: string;
  fullName?: string;
  companyId?: Id<"companies">;
};

type DashboardMetrics = {
  callsHandled: number;
  aiResolutionRate: number;
  openEscalations: number;
  unitsUnderManagement: number;
};

type CallsOverTimePoint = {
  date: string;
  count: number;
};

type EscalationsByPriorityPoint = {
  priority: string;
  value: number;
};

type DashboardResponse = {
  metrics: DashboardMetrics;
  charts: {
    callsOverTime: CallsOverTimePoint[];
    escalationsByPriority: EscalationsByPriorityPoint[];
  };
  lastUpdated: number | null;
};

const DEFAULT_WINDOW_DAYS = 7;
const PRIORITY_COLORS = ["#2563eb", "#7c3aed", "#f97316", "#ef4444", "#14b8a6"];

const generateDateWindow = (days: number) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const window: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - offset);
    window.push(date.toISOString().slice(0, 10));
  }
  return window;
};

const createFallbackData = (days: number): DashboardResponse => ({
  metrics: {
    callsHandled: 0,
    aiResolutionRate: 0,
    openEscalations: 0,
    unitsUnderManagement: 0,
  },
  charts: {
    callsOverTime: generateDateWindow(days).map((date) => ({
      date,
      count: 0,
    })),
    escalationsByPriority: [],
  },
  lastUpdated: null,
});

const fallbackData = createFallbackData(DEFAULT_WINDOW_DAYS);

const isNonZero = (value: number) => value > 0;

export const Dashboard = () => {
  const { data: identity, isLoading: identityLoading } =
    useGetIdentity<IdentityWithCompany>();
  const companyId = identity?.companyId;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Dashboard | HavenHost Admin";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const dashboardData = useQuery(
    api.admin.dashboard,
    companyId ? { companyId } : "skip",
  );

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setHasError(false);
      return;
    }

    if (dashboardData !== undefined) {
      setHasError(false);
      return;
    }

    const timeout = window.setTimeout(() => setHasError(true), 4000);
    return () => window.clearTimeout(timeout);
  }, [companyId, dashboardData]);

  const isLoading =
    identityLoading ||
    (companyId ? dashboardData === undefined && !hasError : false);

  const data: DashboardResponse = dashboardData ?? fallbackData;

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }),
    [],
  );
  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "percent",
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }),
    [],
  );
  const dateLabelFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }),
    [],
  );
  const dateFormatter = useCallback(
    (value: string) => {
      const date = new Date(`${value}T00:00:00Z`);
      return dateLabelFormatter.format(date);
    },
    [dateLabelFormatter],
  );

  const lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : undefined;
  const metrics = data.metrics;
  const callsOverTime = data.charts.callsOverTime;
  const windowLength = callsOverTime.length;
  const escalationsByPriority = data.charts.escalationsByPriority;

  const metricsList = useMemo(
    () => [
      {
        key: "callsHandled" as const,
        label: "Calls handled",
        value: numberFormatter.format(metrics.callsHandled),
        description: "Live calls processed during the selected window.",
        icon: Activity,
      },
      {
        key: "aiResolutionRate" as const,
        label: "AI resolution",
        value: percentFormatter.format(metrics.aiResolutionRate),
        description: "Share of calls automatically resolved by the AI.",
        icon: Bot,
      },
      {
        key: "openEscalations" as const,
        label: "Open escalations",
        value: numberFormatter.format(metrics.openEscalations),
        description: "Issues awaiting follow-up across all priorities.",
        icon: AlertTriangle,
      },
      {
        key: "unitsUnderManagement" as const,
        label: "Units under management",
        value: numberFormatter.format(metrics.unitsUnderManagement),
        description: "Active properties connected to HavenHost.",
        icon: Building2,
      },
    ],
    [metrics, numberFormatter, percentFormatter],
  );

  if (!identityLoading && !companyId) {
    return (
      <div className="flex flex-1 flex-col gap-4 py-4">
        <Alert className="max-w-3xl">
          <AlertTriangle className="col-start-1 row-span-2 mt-1" />
          <AlertTitle>Connect to a company to view the dashboard</AlertTitle>
          <AlertDescription>
            <p>
              The dashboard surfaces real-time data for a company. Sign in with
              an account that belongs to a company or finish onboarding to see
              live KPIs and charts.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pb-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          {lastUpdated ? (
            <span className="text-muted-foreground text-sm">
              Last updated{" "}
              {dateFormatter(lastUpdated.toISOString().slice(0, 10))}
            </span>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          Monitor call performance, automation coverage, and escalation load in
          real time.
        </p>
        {hasError ? (
          <Alert className="max-w-3xl border-amber-500/60 bg-amber-100/70 text-amber-900 dark:border-amber-400/60 dark:bg-amber-500/10 dark:text-amber-100">
            <AlertTriangle className="col-start-1 row-span-2 mt-1" />
            <AlertTitle>Live data is temporarily unavailable</AlertTitle>
            <AlertDescription>
              <p>
                We couldn&apos;t reach Convex to refresh metrics. The data below
                shows the last cached values and will update automatically once
                the connection is restored.
              </p>
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="mb-2 h-8 w-20" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))
          : metricsList.map(
              ({ key, label, value, description, icon: Icon }) => (
                <Card key={key}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {label}
                    </CardTitle>
                    <Icon className="text-muted-foreground h-5 w-5" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold tracking-tight">
                      {value}
                    </div>
                    <CardDescription>{description}</CardDescription>
                  </CardContent>
                </Card>
              ),
            )}
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-4">
            <CardTitle>Calls over time</CardTitle>
            <CardDescription>
              Daily call volume over the last {windowLength} day
              {windowLength === 1 ? "" : "s"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <div className="h-[260px] w-full">
                {callsOverTime.some((point) => isNonZero(point.count)) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={callsOverTime}
                      margin={{ top: 5, right: 16, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={dateFormatter}
                        className="text-muted-foreground text-xs"
                      />
                      <YAxis
                        allowDecimals={false}
                        className="text-muted-foreground text-xs"
                      />
                      <Tooltip
                        labelFormatter={(value) =>
                          `Date: ${dateFormatter(value as string)}`
                        }
                        formatter={(value: number) => [
                          numberFormatter.format(value),
                          "Calls",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-center text-sm">
                    <span>No call activity recorded in this window yet.</span>
                    <span>New calls will appear here in real time.</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-4">
            <CardTitle>Escalations by priority</CardTitle>
            <CardDescription>Open issues grouped by urgency.</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : escalationsByPriority.length ? (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={escalationsByPriority}
                      dataKey="value"
                      nameKey="priority"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                    >
                      {escalationsByPriority.map((entry, index) => (
                        <Cell
                          key={entry.priority}
                          fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        numberFormatter.format(value)
                      }
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "0.75rem" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-muted-foreground flex h-[260px] flex-col items-center justify-center gap-2 text-center text-sm">
                <span>No open escalations at the moment.</span>
                <span>Escalations will appear here as they are created.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
