import { useCallback, useEffect, useMemo, useState } from "react";
import { useNotify } from "ra-core";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { resolveConvexUrl } from "../lib/convexUrl";
import { BookOpen, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { getStoredToken } from "@/lib/authStorage";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagPicker } from "@/components/knowledge-base/tag-picker";
import { Spinner } from "@/components/admin/spinner";
import { Confirm } from "@/components/admin/confirm";

const FAQ_CATEGORIES = [
  "General",
  "Check-in",
  "Amenities",
  "Policies",
  "Troubleshooting",
];

const FAQ_TAG_SUGGESTIONS = [
  "wifi",
  "parking",
  "checkin",
  "checkout",
  "pets",
  "security",
];

const LOCAL_REC_CATEGORIES = [
  "Food & Drink",
  "Shopping",
  "Activities",
  "Transportation",
  "Emergency",
  "Wellness",
];

const LOCAL_REC_TAG_SUGGESTIONS = [
  "family",
  "late-night",
  "walkable",
  "delivery",
  "outdoors",
];

type FaqRecord = {
  id: string;
  propertyId: string;
  text: string;
  category: string | null;
  tags: string[];
  updatedAt: number;
};

type LocalRecommendationRecord = {
  id: string;
  propertyId: string;
  name: string;
  category: string;
  url: string | null;
  tips: string | null;
  hours: string | null;
  tags: string[];
  updatedAt: number;
};

type PropertySummary = {
  id: string;
  name: string;
};

type FaqFormState = {
  propertyId: string;
  text: string;
  category: string;
  tags: string[];
};

type LocalRecFormState = {
  propertyId: string;
  name: string;
  category: string;
  url: string;
  tips: string;
  hours: string;
  tags: string[];
};

const defaultFaqForm: FaqFormState = {
  propertyId: "",
  text: "",
  category: "",
  tags: [],
};

const defaultLocalRecForm: LocalRecFormState = {
  propertyId: "",
  name: "",
  category: "",
  url: "",
  tips: "",
  hours: "",
  tags: [],
};

const formatDateTime = (value: number) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const KnowledgeBasePage = () => {
  const notify = useNotify();
  const convexUrl = resolveConvexUrl(
    "VITE_CONVEX_URL must be defined to use the Knowledge Base management tools.",
  );

  const convexClient = useMemo(
    () => new ConvexHttpClient(convexUrl),
    [convexUrl],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = getStoredToken();
    if (token) {
      convexClient.setAuth(token);
    } else {
      convexClient.clearAuth();
    }
  }, [convexClient]);

  const [activeTab, setActiveTab] = useState<"faqs" | "local">("faqs");

  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);

  const [faqs, setFaqs] = useState<FaqRecord[]>([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [localRecs, setLocalRecs] = useState<LocalRecommendationRecord[]>([]);
  const [localRecsLoading, setLocalRecsLoading] = useState(false);

  const [faqSearch, setFaqSearch] = useState("");
  const [faqPropertyFilter, setFaqPropertyFilter] = useState<string | null>(
    null,
  );
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string | null>(
    null,
  );

  const [localSearch, setLocalSearch] = useState("");
  const [localPropertyFilter, setLocalPropertyFilter] = useState<string | null>(
    null,
  );
  const [localCategoryFilter, setLocalCategoryFilter] = useState<string | null>(
    null,
  );

  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [faqFormState, setFaqFormState] =
    useState<FaqFormState>(defaultFaqForm);
  const [faqSubmitting, setFaqSubmitting] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqRecord | null>(null);
  const [faqPendingDelete, setFaqPendingDelete] = useState<FaqRecord | null>(
    null,
  );
  const [faqDeleting, setFaqDeleting] = useState(false);

  const [localDialogOpen, setLocalDialogOpen] = useState(false);
  const [localFormState, setLocalFormState] =
    useState<LocalRecFormState>(defaultLocalRecForm);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [editingLocalRec, setEditingLocalRec] =
    useState<LocalRecommendationRecord | null>(null);
  const [localPendingDelete, setLocalPendingDelete] =
    useState<LocalRecommendationRecord | null>(null);
  const [localDeleting, setLocalDeleting] = useState(false);

  const propertyNameMap = useMemo(() => {
    const entries: Record<string, string> = {};
    for (const property of properties) {
      entries[property.id] = property.name;
    }
    return entries;
  }, [properties]);

  const fetchProperties = useCallback(async () => {
    setPropertiesLoading(true);
    try {
      const result = await convexClient.query(
        api.knowledgeBase.listProperties,
        {},
      );
      setProperties(result);
    } catch (error) {
      console.error(error);
      notify("Failed to load properties", { type: "error" });
    } finally {
      setPropertiesLoading(false);
    }
  }, [convexClient, notify]);

  const fetchFaqs = useCallback(async () => {
    setFaqLoading(true);
    try {
      const result = await convexClient.query(api.knowledgeBase.listFaqs, {});
      setFaqs(result);
    } catch (error) {
      console.error(error);
      notify("Failed to load FAQs", { type: "error" });
    } finally {
      setFaqLoading(false);
    }
  }, [convexClient, notify]);

  const fetchLocalRecs = useCallback(async () => {
    setLocalRecsLoading(true);
    try {
      const result = await convexClient.query(
        api.knowledgeBase.listLocalRecommendations,
        {},
      );
      setLocalRecs(result);
    } catch (error) {
      console.error(error);
      notify("Failed to load local recommendations", { type: "error" });
    } finally {
      setLocalRecsLoading(false);
    }
  }, [convexClient, notify]);

  useEffect(() => {
    void fetchProperties();
    void fetchFaqs();
    void fetchLocalRecs();
  }, [fetchProperties, fetchFaqs, fetchLocalRecs]);

  const openFaqDialog = useCallback((record?: FaqRecord) => {
    if (record) {
      setEditingFaq(record);
      setFaqFormState({
        propertyId: record.propertyId,
        text: record.text,
        category: record.category ?? "",
        tags: record.tags,
      });
    } else {
      setEditingFaq(null);
      setFaqFormState(defaultFaqForm);
    }
    setFaqDialogOpen(true);
  }, []);

  const closeFaqDialog = useCallback(() => {
    setFaqDialogOpen(false);
    setEditingFaq(null);
    setFaqFormState(defaultFaqForm);
  }, []);

  const openLocalDialog = useCallback((record?: LocalRecommendationRecord) => {
    if (record) {
      setEditingLocalRec(record);
      setLocalFormState({
        propertyId: record.propertyId,
        name: record.name,
        category: record.category,
        url: record.url ?? "",
        tips: record.tips ?? "",
        hours: record.hours ?? "",
        tags: record.tags,
      });
    } else {
      setEditingLocalRec(null);
      setLocalFormState(defaultLocalRecForm);
    }
    setLocalDialogOpen(true);
  }, []);

  const closeLocalDialog = useCallback(() => {
    setLocalDialogOpen(false);
    setEditingLocalRec(null);
    setLocalFormState(defaultLocalRecForm);
  }, []);

  const handleFaqSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFaqSubmitting(true);
      try {
        if (!faqFormState.propertyId) {
          notify("Select a property before saving", { type: "warning" });
          return;
        }
        if (!faqFormState.text.trim()) {
          notify("FAQ content cannot be empty", { type: "warning" });
          return;
        }
        await convexClient.mutation(api.knowledgeBase.saveFaq, {
          id: editingFaq?.id,
          propertyId: faqFormState.propertyId,
          text: faqFormState.text,
          category: faqFormState.category || undefined,
          tags: faqFormState.tags,
        });
        notify("FAQ saved", { type: "success" });
        closeFaqDialog();
        await fetchFaqs();
      } catch (error) {
        console.error(error);
        notify("Unable to save FAQ", { type: "error" });
      } finally {
        setFaqSubmitting(false);
      }
    },
    [
      closeFaqDialog,
      convexClient,
      editingFaq?.id,
      faqFormState,
      fetchFaqs,
      notify,
    ],
  );

  const handleLocalSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLocalSubmitting(true);
      try {
        if (!localFormState.propertyId) {
          notify("Select a property before saving", { type: "warning" });
          return;
        }
        if (!localFormState.category) {
          notify("Choose a category for the recommendation", {
            type: "warning",
          });
          return;
        }
        if (!localFormState.name.trim()) {
          notify("Recommendation name cannot be empty", { type: "warning" });
          return;
        }
        await convexClient.mutation(api.knowledgeBase.saveLocalRecommendation, {
          id: editingLocalRec?.id,
          propertyId: localFormState.propertyId,
          name: localFormState.name,
          category: localFormState.category,
          url: localFormState.url || undefined,
          tips: localFormState.tips || undefined,
          hours: localFormState.hours || undefined,
          tags: localFormState.tags,
        });
        notify("Recommendation saved", { type: "success" });
        closeLocalDialog();
        await fetchLocalRecs();
      } catch (error) {
        console.error(error);
        notify("Unable to save recommendation", { type: "error" });
      } finally {
        setLocalSubmitting(false);
      }
    },
    [
      closeLocalDialog,
      convexClient,
      editingLocalRec?.id,
      fetchLocalRecs,
      localFormState,
      notify,
    ],
  );

  const confirmFaqDelete = useCallback(async () => {
    if (!faqPendingDelete) return;
    setFaqDeleting(true);
    try {
      await convexClient.mutation(api.knowledgeBase.deleteFaq, {
        id: faqPendingDelete.id,
      });
      notify("FAQ deleted", { type: "success" });
      setFaqPendingDelete(null);
      await fetchFaqs();
    } catch (error) {
      console.error(error);
      notify("Unable to delete FAQ", { type: "error" });
    } finally {
      setFaqDeleting(false);
    }
  }, [convexClient, faqPendingDelete, fetchFaqs, notify]);

  const confirmLocalDelete = useCallback(async () => {
    if (!localPendingDelete) return;
    setLocalDeleting(true);
    try {
      await convexClient.mutation(api.knowledgeBase.deleteLocalRecommendation, {
        id: localPendingDelete.id,
      });
      notify("Recommendation deleted", { type: "success" });
      setLocalPendingDelete(null);
      await fetchLocalRecs();
    } catch (error) {
      console.error(error);
      notify("Unable to delete recommendation", { type: "error" });
    } finally {
      setLocalDeleting(false);
    }
  }, [convexClient, fetchLocalRecs, localPendingDelete, notify]);

  const propertyOptions = useMemo(() => {
    const options = properties.map((property) => ({
      id: property.id,
      name: property.name,
    }));
    return options;
  }, [properties]);

  const filteredFaqs = useMemo(() => {
    const search = faqSearch.trim().toLowerCase();
    return faqs.filter((faq) => {
      if (faqPropertyFilter && faq.propertyId !== faqPropertyFilter) {
        return false;
      }
      if (faqCategoryFilter && (faq.category ?? "") !== faqCategoryFilter) {
        return false;
      }
      if (!search) return true;
      const haystack = [
        faq.text,
        faq.category ?? "",
        propertyNameMap[faq.propertyId] ?? "",
        faq.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [faqCategoryFilter, faqPropertyFilter, faqSearch, faqs, propertyNameMap]);

  const filteredLocalRecs = useMemo(() => {
    const search = localSearch.trim().toLowerCase();
    return localRecs.filter((rec) => {
      if (localPropertyFilter && rec.propertyId !== localPropertyFilter) {
        return false;
      }
      if (localCategoryFilter && rec.category !== localCategoryFilter) {
        return false;
      }
      if (!search) return true;
      const haystack = [
        rec.name,
        rec.category,
        rec.url ?? "",
        rec.tips ?? "",
        rec.hours ?? "",
        propertyNameMap[rec.propertyId] ?? "",
        rec.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [
    localCategoryFilter,
    localPropertyFilter,
    localRecs,
    localSearch,
    propertyNameMap,
  ]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="flex flex-col gap-2 pt-2">
        <div className="text-muted-foreground flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <span className="text-sm font-medium tracking-wide uppercase">
            Knowledge Base
          </span>
        </div>
        <h1 className="text-2xl font-semibold">Property knowledge base</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Manage the FAQs and local tips surfaced to guests and operators.
          Create rich entries with categories and tags to improve semantic
          search quality.
        </p>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
      >
        <TabsList>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="local">Local recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="faqs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequently asked questions</CardTitle>
              <CardDescription>
                Curate answers the assistant can reuse during guest support.
              </CardDescription>
              <CardAction>
                <Button onClick={() => openFaqDialog()} className="gap-1">
                  <PlusCircle className="h-4 w-4" />
                  Add FAQ
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="search"
                  value={faqSearch}
                  onChange={(event) => setFaqSearch(event.target.value)}
                  placeholder="Search FAQs"
                  className="w-full max-w-xs"
                />
                <Select
                  disabled={propertiesLoading || propertyOptions.length === 0}
                  value={faqPropertyFilter ?? "all"}
                  onValueChange={(value) =>
                    setFaqPropertyFilter(value === "all" ? null : value)
                  }
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Filter by property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All properties</SelectItem>
                    {propertyOptions.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={faqCategoryFilter ?? "all"}
                  onValueChange={(value) =>
                    setFaqCategoryFilter(value === "all" ? null : value)
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {FAQ_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-hidden rounded-lg border">
                {faqLoading ? (
                  <div className="flex justify-center p-10">
                    <Spinner />
                  </div>
                ) : filteredFaqs.length === 0 ? (
                  <div className="text-muted-foreground flex flex-col items-center gap-2 p-10 text-center text-sm">
                    <span>No FAQs found.</span>
                    <span>
                      {faqSearch
                        ? "Adjust your filters to see more results."
                        : "Add your first FAQ to help the assistant answer guests."}
                    </span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Question &amp; answer</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Tags
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Category
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Property
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Updated
                        </TableHead>
                        <TableHead className="w-20 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFaqs.map((faq) => (
                        <TableRow key={faq.id}>
                          <TableCell className="text-sm whitespace-pre-wrap">
                            {faq.text}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {faq.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="hidden text-sm md:table-cell">
                            {faq.category ?? "—"}
                          </TableCell>
                          <TableCell className="hidden text-sm md:table-cell">
                            {propertyNameMap[faq.propertyId] ?? "Unknown"}
                          </TableCell>
                          <TableCell className="hidden text-sm md:table-cell">
                            {formatDateTime(faq.updatedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openFaqDialog(faq)}
                                aria-label="Edit FAQ"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setFaqPendingDelete(faq)}
                                aria-label="Delete FAQ"
                              >
                                <Trash2 className="text-destructive h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="local" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Local recommendations</CardTitle>
              <CardDescription>
                Share curated neighbourhood tips with the on-site team and
                travellers.
              </CardDescription>
              <CardAction>
                <Button onClick={() => openLocalDialog()} className="gap-1">
                  <PlusCircle className="h-4 w-4" />
                  Add recommendation
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="search"
                  value={localSearch}
                  onChange={(event) => setLocalSearch(event.target.value)}
                  placeholder="Search recommendations"
                  className="w-full max-w-xs"
                />
                <Select
                  disabled={propertiesLoading || propertyOptions.length === 0}
                  value={localPropertyFilter ?? "all"}
                  onValueChange={(value) =>
                    setLocalPropertyFilter(value === "all" ? null : value)
                  }
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Filter by property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All properties</SelectItem>
                    {propertyOptions.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={localCategoryFilter ?? "all"}
                  onValueChange={(value) =>
                    setLocalCategoryFilter(value === "all" ? null : value)
                  }
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {LOCAL_REC_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-hidden rounded-lg border">
                {localRecsLoading ? (
                  <div className="flex justify-center p-10">
                    <Spinner />
                  </div>
                ) : filteredLocalRecs.length === 0 ? (
                  <div className="text-muted-foreground flex flex-col items-center gap-2 p-10 text-center text-sm">
                    <span>No recommendations yet.</span>
                    <span>
                      {localSearch
                        ? "Try widening your search or filters."
                        : "Add your favourite spots to help guests explore like locals."}
                    </span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden lg:table-cell">
                          Details
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Category
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Property
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">
                          Tags
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">
                          Updated
                        </TableHead>
                        <TableHead className="w-20 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLocalRecs.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell className="text-sm font-medium">
                            {rec.name}
                            {rec.url ? (
                              <div className="text-muted-foreground text-xs">
                                {rec.url}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell className="hidden text-sm lg:table-cell">
                            <div className="space-y-1 whitespace-pre-wrap">
                              {rec.tips ? <p>{rec.tips}</p> : null}
                              {rec.hours ? (
                                <p className="text-muted-foreground text-xs">
                                  Hours: {rec.hours}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="hidden text-sm md:table-cell">
                            {rec.category}
                          </TableCell>
                          <TableCell className="hidden text-sm md:table-cell">
                            {propertyNameMap[rec.propertyId] ?? "Unknown"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {rec.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="hidden text-sm lg:table-cell">
                            {formatDateTime(rec.updatedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openLocalDialog(rec)}
                                aria-label="Edit recommendation"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setLocalPendingDelete(rec)}
                                aria-label="Delete recommendation"
                              >
                                <Trash2 className="text-destructive h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={faqDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeFaqDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFaq ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
            <DialogDescription>
              Provide concise answers so the assistant can respond confidently.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFaqSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Property</label>
              <Select
                disabled={propertiesLoading || propertyOptions.length === 0}
                value={faqFormState.propertyId || undefined}
                onValueChange={(value) =>
                  setFaqFormState((current) => ({
                    ...current,
                    propertyId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {propertyOptions.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="faq-text">
                FAQ content
              </label>
              <textarea
                id="faq-text"
                required
                value={faqFormState.text}
                onChange={(event) =>
                  setFaqFormState((current) => ({
                    ...current,
                    text: event.target.value,
                  }))
                }
                className="bg-background focus-visible:ring-ring/40 min-h-[120px] w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                placeholder="What guests usually ask and how you respond"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={faqFormState.category || ""}
                  onValueChange={(value) =>
                    setFaqFormState((current) => ({
                      ...current,
                      category: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {FAQ_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <TagPicker
                label="Tags"
                value={faqFormState.tags}
                onChange={(tags) =>
                  setFaqFormState((current) => ({ ...current, tags }))
                }
                suggestions={FAQ_TAG_SUGGESTIONS}
                placeholder="Add context tags"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeFaqDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={faqSubmitting}>
                {faqSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={localDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeLocalDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLocalRec ? "Edit recommendation" : "Add recommendation"}
            </DialogTitle>
            <DialogDescription>
              Highlight nearby gems guests shouldn&apos;t miss.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLocalSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Property</label>
                <Select
                  disabled={propertiesLoading || propertyOptions.length === 0}
                  value={localFormState.propertyId || undefined}
                  onValueChange={(value) =>
                    setLocalFormState((current) => ({
                      ...current,
                      propertyId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyOptions.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="rec-name">
                  Name
                </label>
                <Input
                  id="rec-name"
                  required
                  value={localFormState.name}
                  onChange={(event) =>
                    setLocalFormState((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Cafe, attraction or helpful service"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={localFormState.category || undefined}
                  onValueChange={(value) =>
                    setLocalFormState((current) => ({
                      ...current,
                      category: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCAL_REC_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <TagPicker
                label="Tags"
                value={localFormState.tags}
                onChange={(tags) =>
                  setLocalFormState((current) => ({ ...current, tags }))
                }
                suggestions={LOCAL_REC_TAG_SUGGESTIONS}
                placeholder="Add descriptors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="rec-url">
                Website (optional)
              </label>
              <Input
                id="rec-url"
                value={localFormState.url}
                onChange={(event) =>
                  setLocalFormState((current) => ({
                    ...current,
                    url: event.target.value,
                  }))
                }
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="rec-tips">
                Tips (optional)
              </label>
              <textarea
                id="rec-tips"
                value={localFormState.tips}
                onChange={(event) =>
                  setLocalFormState((current) => ({
                    ...current,
                    tips: event.target.value,
                  }))
                }
                className="bg-background focus-visible:ring-ring/40 min-h-[100px] w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                placeholder="Share insider advice guests will appreciate"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="rec-hours">
                Hours (optional)
              </label>
              <Input
                id="rec-hours"
                value={localFormState.hours}
                onChange={(event) =>
                  setLocalFormState((current) => ({
                    ...current,
                    hours: event.target.value,
                  }))
                }
                placeholder="e.g. Daily 8am – 10pm"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeLocalDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={localSubmitting}>
                {localSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Confirm
        isOpen={faqPendingDelete != null}
        onClose={() => setFaqPendingDelete(null)}
        onConfirm={confirmFaqDelete}
        loading={faqDeleting}
        title="Delete FAQ?"
        content="This entry will be removed from the knowledge base and embeddings will be regenerated without it."
        confirm="Delete"
        confirmColor="warning"
      />

      <Confirm
        isOpen={localPendingDelete != null}
        onClose={() => setLocalPendingDelete(null)}
        onConfirm={confirmLocalDelete}
        loading={localDeleting}
        title="Delete recommendation?"
        content="Guests and agents will no longer see this suggestion in the assistant."
        confirm="Delete"
        confirmColor="warning"
      />
    </div>
  );
};

export default KnowledgeBasePage;
