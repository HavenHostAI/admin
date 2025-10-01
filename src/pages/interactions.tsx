import { useCallback, useEffect, useMemo, useState } from "react";
import { useGetIdentity, useNotify } from "ra-core";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, CheckCircle2, MessageSquare } from "lucide-react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/admin/spinner";

type IdentityWithCompany = {
  id: string;
  fullName?: string;
  companyId?: Id<"companies">;
};

type InteractionListItem = {
  id: Id<"interactions">;
  createdAt: number;
  channel: string;
  result: string;
  intent: string;
  durationSec: number;
  propertyId: Id<"properties">;
  propertyName: string;
  reviewedAt: number | null;
  reviewedByUserId: string | null;
};

type InteractionsListResponse = {
  interactions: InteractionListItem[];
  stats: {
    total: number;
    unreviewed: number;
  };
};

type ReviewerSummary = {
  id: string;
  name: string | null;
  email: string | null;
};

type InteractionDetails = {
  id: Id<"interactions">;
  createdAt: number;
  channel: string;
  intent: string;
  result: string;
  durationSec: number;
  propertyId: Id<"properties">;
  propertyName: string;
  transcriptSnippet: string | null;
  reviewedAt: number | null;
  reviewedBy: ReviewerSummary | null;
  reviewedByUserId: string | null;
};

const resolutionLabel = (result: string) => {
  const normalized = result.toLowerCase();
  if (
    normalized.includes("escalat") ||
    normalized.includes("handoff") ||
    normalized.includes("forward")
  ) {
    return "Escalated";
  }
  return "AI-resolved";
};

const channelLabel = (channel: string) => {
  switch (channel) {
    case "call":
      return "Phone";
    case "sms":
      return "SMS";
    case "chat":
      return "Chat";
    case "email":
      return "Email";
    default:
      return channel.charAt(0).toUpperCase() + channel.slice(1);
  }
};

const formatDateTime = (timestamp: number, formatter: Intl.DateTimeFormat) =>
  formatter.format(new Date(timestamp));

const formatDuration = (duration: number) => {
  if (!Number.isFinite(duration) || duration < 0) return "-";
  const totalSeconds = Math.round(duration);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
};

const emptyDetails: InteractionDetails = {
  id: "" as Id<"interactions">,
  createdAt: 0,
  channel: "",
  intent: "",
  result: "",
  durationSec: 0,
  propertyId: "" as Id<"properties">,
  propertyName: "",
  transcriptSnippet: null,
  reviewedAt: null,
  reviewedBy: null,
  reviewedByUserId: null,
};

export const InteractionsPage = () => {
  const notify = useNotify();
  const { data: identity, isLoading: identityLoading } =
    useGetIdentity<IdentityWithCompany>();
  const companyId = identity?.companyId;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Interactions | HavenHost Admin";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const interactionsResponse = useQuery(
    api.interactions.listForCompany,
    companyId ? { companyId } : "skip",
  ) as InteractionsListResponse | undefined;

  const [showUnreviewedOnly, setShowUnreviewedOnly] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] =
    useState<Id<"interactions"> | null>(null);

  const interactions = useMemo(
    () => interactionsResponse?.interactions ?? [],
    [interactionsResponse],
  );
  const stats = useMemo(
    () => interactionsResponse?.stats ?? { total: 0, unreviewed: 0 },
    [interactionsResponse],
  );

  const filteredInteractions = useMemo(() => {
    const sorted = [...interactions].sort(
      (a, b) => b.createdAt - a.createdAt,
    );
    if (showUnreviewedOnly) {
      return sorted.filter((interaction) => !interaction.reviewedAt);
    }
    return sorted;
  }, [interactions, showUnreviewedOnly]);

  const selectedSummary = useMemo(
    () =>
      selectedId
        ? interactions.find((interaction) => interaction.id === selectedId) ??
          null
        : null,
    [interactions, selectedId],
  );

  const interactionDetails = useQuery(
    api.interactions.getDetails,
    drawerOpen && selectedId ? { interactionId: selectedId } : "skip",
  ) as InteractionDetails | null | undefined;

  const markReviewed = useMutation(api.interactions.markReviewed);
  const [isReviewing, setIsReviewing] = useState(false);

  const handleRowClick = useCallback((interactionId: Id<"interactions">) => {
    setSelectedId(interactionId);
    setDrawerOpen(true);
  }, []);

  const handleDrawerChange = useCallback((open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      setSelectedId(null);
    }
  }, []);

  const handleMarkReviewed = useCallback(async () => {
    if (!selectedId) return;
    setIsReviewing(true);
    try {
      await markReviewed({
        interactionId: selectedId,
        reviewerId: identity?.id,
      });
      notify("Marked interaction as reviewed", { type: "info" });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to update interaction";
      notify(message, { type: "error", messageArgs: { _: message } });
    } finally {
      setIsReviewing(false);
    }
  }, [identity?.id, markReviewed, notify, selectedId]);

  const isLoading = companyId
    ? interactionsResponse === undefined
    : identityLoading;

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [],
  );

  if (!identityLoading && !companyId) {
    return (
      <div className="flex flex-1 flex-col gap-4 py-4">
        <Alert className="max-w-3xl">
          <AlertTriangle className="col-start-1 row-span-2 mt-1" />
          <AlertTitle>Connect to a company to view interactions</AlertTitle>
          <AlertDescription>
            Link your account to a company to review AI interactions and
            escalations captured by HavenHost.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const details = interactionDetails ?? emptyDetails;
  const drawerLoading = drawerOpen && interactionDetails === undefined;

  const totalLabel = stats.total === 1 ? "interaction" : "interactions";
  const unreviewedLabel =
    stats.unreviewed === 1 ? "unreviewed interaction" : "unreviewed interactions";

  return (
    <div className="flex flex-1 flex-col gap-6 pb-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Interactions
            </h1>
            <p className="text-muted-foreground text-sm">
              Review recent guest interactions, resolution outcomes, and follow up
              on escalations.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="text-sm font-medium">
              {stats.total.toLocaleString()} {totalLabel}
            </span>
            <span className="text-muted-foreground text-xs">
              {stats.unreviewed.toLocaleString()} {unreviewedLabel} awaiting review
            </span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="size-5" /> Recent interactions
            </CardTitle>
            <CardDescription>
              Click a row to inspect the transcript, resolution path, and review
              details.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="interactions-unreviewed"
              checked={showUnreviewedOnly}
              onCheckedChange={(checked) =>
                setShowUnreviewedOnly(Boolean(checked))
              }
            />
            <Label htmlFor="interactions-unreviewed" className="text-sm">
              Show unreviewed only
            </Label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">Date &amp; time</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead className="w-[120px]">Channel</TableHead>
                  <TableHead className="w-[160px]">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Skeleton className="h-4 w-36" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                      </TableRow>
                    ))
                  : filteredInteractions.length > 0
                    ? filteredInteractions.map((interaction) => (
                        <TableRow
                          key={interaction.id}
                          className={`cursor-pointer transition-colors hover:bg-muted/60 ${
                            interaction.reviewedAt ? "" : "border-l-2 border-l-primary"
                          }`}
                          onClick={() => handleRowClick(interaction.id)}
                        >
                          <TableCell className="align-middle">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {formatDateTime(
                                  interaction.createdAt,
                                  dateTimeFormatter,
                                )}
                              </span>
                              {interaction.reviewedAt ? (
                                <span className="text-muted-foreground text-xs">
                                  Reviewed {formatDateTime(interaction.reviewedAt, dateTimeFormatter)}
                                </span>
                              ) : (
                                <span className="text-primary text-xs font-medium">
                                  Awaiting review
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {interaction.propertyName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <Badge variant="secondary">
                              {channelLabel(interaction.channel)}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  resolutionLabel(interaction.result) ===
                                  "Escalated"
                                    ? "destructive"
                                    : "default"
                                }
                              >
                                {resolutionLabel(interaction.result)}
                              </Badge>
                              <span className="text-muted-foreground text-xs">
                                {interaction.intent}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="h-24 text-center text-muted-foreground"
                          >
                            {showUnreviewedOnly
                              ? "All interactions have been reviewed."
                              : "No interactions recorded for this company yet."}
                          </TableCell>
                        </TableRow>
                      )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Drawer open={drawerOpen} onOpenChange={handleDrawerChange}>
        <DrawerContent className="max-h-[92vh] overflow-y-auto">
          <DrawerHeader className="gap-2">
            <DrawerTitle>Interaction details</DrawerTitle>
            <DrawerDescription>
              {selectedSummary
                ? `Captured ${formatDateTime(
                    selectedSummary.createdAt,
                    dateTimeFormatter,
                  )}`
                : "Review transcript and resolution path."}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-6 px-4 pb-6">
            {drawerLoading ? (
              <div className="flex min-h-32 items-center justify-center">
                <Spinner size="large" />
              </div>
            ) : selectedSummary ? (
              <>
                <section className="grid gap-4 rounded-lg border bg-muted/30 p-4">
                  <div>
                    <span className="text-xs font-medium uppercase text-muted-foreground">
                      Property
                    </span>
                    <p className="text-base font-semibold">
                      {selectedSummary.propertyName}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        Channel
                      </span>
                      <p className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary">
                          {channelLabel(selectedSummary.channel)}
                        </Badge>
                        {resolutionLabel(selectedSummary.result) === "Escalated" ? (
                          <Badge variant="destructive">Escalated</Badge>
                        ) : (
                          <Badge>AI-resolved</Badge>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        Duration
                      </span>
                      <p className="text-sm font-medium">
                        {formatDuration(selectedSummary.durationSec)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        Intent
                      </span>
                      <p className="text-sm font-medium">{selectedSummary.intent}</p>
                    </div>
                    {details.reviewedBy ? (
                      <div>
                        <span className="text-xs font-medium uppercase text-muted-foreground">
                          Reviewed by
                        </span>
                        <p className="text-sm font-medium">
                          {details.reviewedBy.name ?? details.reviewedBy.email ?? details.reviewedBy.id}
                        </p>
                        {details.reviewedAt ? (
                          <p className="text-muted-foreground text-xs">
                            {formatDateTime(details.reviewedAt, dateTimeFormatter)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">Resolution path</h2>
                  </div>
                  <p className="whitespace-pre-line rounded-md border bg-muted/50 p-3 text-sm">
                    {details.result || "Resolution details unavailable."}
                  </p>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">Transcript snippet</h2>
                  </div>
                  <p className="whitespace-pre-line rounded-md border bg-muted/50 p-3 text-sm">
                    {details.transcriptSnippet ??
                      "A transcript snippet was not captured for this interaction."}
                  </p>
                </section>
              </>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="col-start-1 row-span-2 mt-1" />
                <AlertTitle>Unable to load interaction</AlertTitle>
                <AlertDescription>
                  We couldn&apos;t find this interaction. It may have been removed.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DrawerFooter>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {selectedSummary?.reviewedAt ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  Reviewed {formatDateTime(selectedSummary.reviewedAt, dateTimeFormatter)}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="size-4 text-amber-500" />
                  Awaiting review
                </div>
              )}
              <Button
                onClick={handleMarkReviewed}
                disabled={isReviewing || !selectedSummary || !!selectedSummary?.reviewedAt}
              >
                {isReviewing ? "Marking..." : "Mark as reviewed"}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default InteractionsPage;
