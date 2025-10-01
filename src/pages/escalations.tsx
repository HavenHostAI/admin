import { useCallback, useEffect, useMemo, useState } from "react";
import { useNotify } from "ra-core";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { AlertTriangle, CheckCircle2, UserRound } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/admin/spinner";

const PRIORITY_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive"
> = {
  high: "destructive",
  urgent: "destructive",
  medium: "default",
  normal: "default",
  low: "secondary",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive"> =
  {
    open: "destructive",
    pending: "default",
    acknowledged: "default",
    resolved: "secondary",
    closed: "secondary",
    completed: "secondary",
  };

type EscalationListItem = {
  id: string;
  propertyId: string;
  propertyName: string;
  priority: string;
  status: string;
  topic: string;
  assigneeContact: string | null;
  createdAt: number;
};

type EscalationDetail = EscalationListItem & {
  summary: string | null;
  resolvedAt: number | null;
  transcriptRef: string | null;
};

type PropertySummary = {
  id: string;
  name: string;
};

type FilterResponse = {
  properties: PropertySummary[];
  priorities: string[];
  statuses: string[];
};

const formatPriorityLabel = (priority: string) => {
  if (!priority) return "Unspecified";
  return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
};

const formatStatusLabel = (status: string) => {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const getBadgeVariant = (
  value: string,
  mapping: Record<string, "default" | "secondary" | "destructive">,
) => {
  const normalized = value.trim().toLowerCase();
  return mapping[normalized] ?? "default";
};

const formatDateTime = (value: number | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const EMPTY_FILTERS: FilterResponse = {
  properties: [],
  priorities: [],
  statuses: [],
};

const ALL_OPTION = "__all__";

const EscalationsPage = () => {
  const notify = useNotify();
  const convexUrl = import.meta.env.VITE_CONVEX_URL;

  if (!convexUrl) {
    throw new Error(
      "VITE_CONVEX_URL must be defined to manage escalation records.",
    );
  }

  const convexClient = useMemo(
    () => new ConvexHttpClient(convexUrl),
    [convexUrl],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("better-auth:token");
    if (token) {
      convexClient.setAuth(token);
    } else {
      convexClient.clearAuth();
    }
  }, [convexClient]);

  const [filters, setFilters] = useState({
    propertyId: ALL_OPTION,
    priority: ALL_OPTION,
    status: ALL_OPTION,
  });
  const [filterOptions, setFilterOptions] =
    useState<FilterResponse>(EMPTY_FILTERS);
  const [loadingFilters, setLoadingFilters] = useState(false);

  const [escalations, setEscalations] = useState<EscalationListItem[]>([]);
  const [escalationsLoading, setEscalationsLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeEscalationId, setActiveEscalationId] = useState<string | null>(
    null,
  );
  const [activeEscalation, setActiveEscalation] =
    useState<EscalationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [assignmentValue, setAssignmentValue] = useState("");
  const [updatingAssignment, setUpdatingAssignment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadFilters = useCallback(async () => {
    setLoadingFilters(true);
    try {
      const response = await convexClient.query(
        api.escalations.listFilters,
        {},
      );
      setFilterOptions(response ?? EMPTY_FILTERS);
    } catch (error) {
      console.error(error);
      notify("Unable to load escalation filters", { type: "error" });
      setFilterOptions(EMPTY_FILTERS);
    } finally {
      setLoadingFilters(false);
    }
  }, [convexClient, notify]);

  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  const loadEscalations = useCallback(async () => {
    setEscalationsLoading(true);
    try {
      const response = await convexClient.query(
        api.escalations.listEscalations,
        {
          propertyId:
            filters.propertyId === ALL_OPTION ? undefined : filters.propertyId,
          priority:
            filters.priority === ALL_OPTION ? undefined : filters.priority,
          status: filters.status === ALL_OPTION ? undefined : filters.status,
        },
      );
      setEscalations(response ?? []);
    } catch (error) {
      console.error(error);
      notify("Unable to load escalations", { type: "error" });
      setEscalations([]);
    } finally {
      setEscalationsLoading(false);
    }
  }, [
    convexClient,
    filters.propertyId,
    filters.priority,
    filters.status,
    notify,
  ]);

  useEffect(() => {
    void loadEscalations();
  }, [loadEscalations]);

  const handleOpenDrawer = useCallback(
    async (escalationId: string) => {
      setDrawerOpen(true);
      setActiveEscalationId(escalationId);
      setDetailLoading(true);
      try {
        const detail = await convexClient.query(api.escalations.getEscalation, {
          id: escalationId,
        });
        setActiveEscalation(detail);
        setAssignmentValue(detail?.assigneeContact ?? "");
      } catch (error) {
        console.error(error);
        notify("Unable to load escalation details", { type: "error" });
        setActiveEscalation(null);
        setAssignmentValue("");
      } finally {
        setDetailLoading(false);
      }
    },
    [convexClient, notify],
  );

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setActiveEscalationId(null);
    setActiveEscalation(null);
    setAssignmentValue("");
  }, []);

  const handleAssignmentUpdate = useCallback(async () => {
    if (!activeEscalationId) return;
    setUpdatingAssignment(true);
    try {
      const updated = await convexClient.mutation(
        api.escalations.assignContact,
        {
          id: activeEscalationId,
          contact: assignmentValue.trim() || undefined,
        },
      );
      setActiveEscalation(updated);
      notify("Escalation assignee updated", { type: "success" });
      void loadEscalations();
    } catch (error) {
      console.error(error);
      notify("Unable to update assignee", { type: "error" });
    } finally {
      setUpdatingAssignment(false);
    }
  }, [
    activeEscalationId,
    assignmentValue,
    convexClient,
    loadEscalations,
    notify,
  ]);

  const handleStatusUpdate = useCallback(
    async (status: string) => {
      if (!activeEscalationId) return;
      setUpdatingStatus(true);
      try {
        const updated = await convexClient.mutation(
          api.escalations.updateStatus,
          {
            id: activeEscalationId,
            status,
          },
        );
        setActiveEscalation(updated);
        notify("Escalation status updated", { type: "success" });
        void loadEscalations();
      } catch (error) {
        console.error(error);
        notify("Unable to update status", { type: "error" });
      } finally {
        setUpdatingStatus(false);
      }
    },
    [activeEscalationId, convexClient, loadEscalations, notify],
  );

  const handleFilterChange =
    (key: "propertyId" | "priority" | "status") => (value: string) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    };

  const clearFilters = () => {
    setFilters({
      propertyId: ALL_OPTION,
      priority: ALL_OPTION,
      status: ALL_OPTION,
    });
  };

  const hasActiveFilters =
    filters.propertyId !== ALL_OPTION ||
    filters.priority !== ALL_OPTION ||
    filters.status !== ALL_OPTION;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Escalations</CardTitle>
            <CardDescription>
              Track open issues, assign follow-up contacts, and resolve
              escalations.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={escalationsLoading || !hasActiveFilters}
            >
              Reset filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="property-filter">Property</Label>
              <Select
                value={filters.propertyId}
                onValueChange={handleFilterChange("propertyId")}
                disabled={loadingFilters}
              >
                <SelectTrigger id="property-filter">
                  <SelectValue placeholder="All properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>All properties</SelectItem>
                  {filterOptions.properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority-filter">Priority</Label>
              <Select
                value={filters.priority}
                onValueChange={handleFilterChange("priority")}
                disabled={loadingFilters}
              >
                <SelectTrigger id="priority-filter">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>All priorities</SelectItem>
                  {filterOptions.priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {formatPriorityLabel(priority)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filters.status}
                onValueChange={handleFilterChange("status")}
                disabled={loadingFilters}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>All statuses</SelectItem>
                  {filterOptions.statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Priority
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Assignee
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Created
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escalationsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <Spinner />
                    </TableCell>
                  </TableRow>
                ) : escalations.length ? (
                  escalations.map((escalation) => (
                    <TableRow
                      key={escalation.id}
                      className="hover:bg-muted/60 cursor-pointer"
                      onClick={() => void handleOpenDrawer(escalation.id)}
                    >
                      <TableCell className="max-w-[240px] font-medium">
                        {escalation.topic}
                      </TableCell>
                      <TableCell>{escalation.propertyName}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant={getBadgeVariant(
                            escalation.priority,
                            PRIORITY_VARIANTS,
                          )}
                        >
                          {formatPriorityLabel(escalation.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant={getBadgeVariant(
                            escalation.status,
                            STATUS_VARIANTS,
                          )}
                        >
                          {formatStatusLabel(escalation.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {escalation.assigneeContact ? (
                          <span className="inline-flex items-center gap-1">
                            <UserRound className="size-4" />
                            {escalation.assigneeContact}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDateTime(escalation.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground py-12 text-center"
                    >
                      No escalations match the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => (!open ? closeDrawer() : undefined)}
      >
        <DrawerContent className="max-h-[90vh] overflow-y-auto">
          <DrawerHeader className="space-y-2 text-left">
            <DrawerTitle>
              {activeEscalation?.topic ?? "Escalation details"}
            </DrawerTitle>
            <DrawerDescription>
              Review the conversation summary and take action on this
              escalation.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-6 px-6 pb-6">
            {detailLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : activeEscalation ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase">
                      Property
                    </Label>
                    <div className="text-sm font-medium">
                      {activeEscalation.propertyName}
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-muted-foreground text-xs uppercase">
                      Priority
                    </Label>
                    <Badge
                      variant={getBadgeVariant(
                        activeEscalation.priority,
                        PRIORITY_VARIANTS,
                      )}
                    >
                      {formatPriorityLabel(activeEscalation.priority)}
                    </Badge>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-muted-foreground text-xs uppercase">
                      Status
                    </Label>
                    <Badge
                      variant={getBadgeVariant(
                        activeEscalation.status,
                        STATUS_VARIANTS,
                      )}
                    >
                      {formatStatusLabel(activeEscalation.status)}
                    </Badge>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-muted-foreground text-xs uppercase">
                      Created at
                    </Label>
                    <div className="text-sm">
                      {formatDateTime(activeEscalation.createdAt)}
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-muted-foreground text-xs uppercase">
                      Resolved at
                    </Label>
                    <div className="text-sm">
                      {formatDateTime(activeEscalation.resolvedAt)}
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase">
                    Summary
                  </Label>
                  <p className="text-sm whitespace-pre-line">
                    {activeEscalation.summary ?? "No summary provided."}
                  </p>
                </div>
                {activeEscalation.transcriptRef ? (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs uppercase">
                      Transcript Reference
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      {activeEscalation.transcriptRef}
                    </p>
                  </div>
                ) : null}
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="assignment"
                      className="text-muted-foreground text-xs uppercase"
                    >
                      Assign contact
                    </Label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        id="assignment"
                        value={assignmentValue}
                        onChange={(event) =>
                          setAssignmentValue(event.target.value)
                        }
                        placeholder="Email or phone number"
                      />
                      <Button
                        onClick={() => void handleAssignmentUpdate()}
                        disabled={updatingAssignment}
                      >
                        {updatingAssignment ? "Saving" : "Save"}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase">
                      Update status
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.statuses.map((status) => (
                        <Button
                          key={status}
                          variant={
                            activeEscalation.status.toLowerCase() ===
                            status.toLowerCase()
                              ? "default"
                              : "outline"
                          }
                          onClick={() => void handleStatusUpdate(status)}
                          disabled={updatingStatus}
                        >
                          {formatStatusLabel(status)}
                        </Button>
                      ))}
                      {!filterOptions.statuses.some(
                        (status) =>
                          status.toLowerCase() ===
                          activeEscalation.status.toLowerCase(),
                      ) ? (
                        <Button variant="outline" disabled>
                          {formatStatusLabel(activeEscalation.status)}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center">
                <AlertTriangle className="size-6" />
                <span>Escalation not found.</span>
              </div>
            )}
          </div>
          <DrawerFooter className="text-muted-foreground flex flex-col items-start gap-2 border-t px-6 py-4 text-sm">
            <div className="flex items-center gap-2 text-xs uppercase">
              <CheckCircle2 className="size-4" />
              Escalation updates notify assigned contacts automatically.
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default EscalationsPage;
export { EscalationsPage };
