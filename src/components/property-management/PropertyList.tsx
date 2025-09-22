"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  Search,
  MoreHorizontal,
  Server,
  Globe,
  Shield,
  Database,
  HardDrive,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { CreatePropertyDialog } from "./CreatePropertyDialog";
import { EditPropertyDialog } from "./EditPropertyDialog";
import {
  PROPERTY_TYPE_LABELS,
  STATUS_COLORS,
  isValidPropertyType,
  isValidPropertyStatus,
} from "@/lib/constants";

const propertyTypeIcons = {
  server: Server,
  domain: Globe,
  ssl_certificate: Shield,
  database: Database,
  storage: HardDrive,
};

export function PropertyList() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const normalizedSearch = search.trim();
  const normalizedTypeFilter =
    typeFilter && typeFilter !== "all" ? typeFilter : undefined;
  const normalizedStatusFilter =
    statusFilter && statusFilter !== "all" ? statusFilter : undefined;

  const {
    data: propertiesData,
    isLoading,
    error,
    refetch,
  } = api.property.list.useQuery({
    page,
    limit,
    search: normalizedSearch === "" ? undefined : normalizedSearch,
    type:
      normalizedTypeFilter && isValidPropertyType(normalizedTypeFilter)
        ? normalizedTypeFilter
        : undefined,
    status:
      normalizedStatusFilter && isValidPropertyStatus(normalizedStatusFilter)
        ? normalizedStatusFilter
        : undefined,
  });

  const deletePropertyMutation = api.property.delete.useMutation({
    onSuccess: () => {
      refetch().catch((error) => {
        console.error("Failed to refetch properties after deletion:", error);
        // Could also show a toast notification to the user here
      });
    },
  });

  const handleDeleteProperty = async (propertyId: string) => {
    if (confirm("Are you sure you want to delete this property?")) {
      try {
        await deletePropertyMutation.mutateAsync({ id: propertyId });
      } catch (error) {
        console.error("Failed to delete property:", error);
      }
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load properties: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Property Management</CardTitle>
            <CardDescription>
              Manage hosting properties, servers, domains, and resources
            </CardDescription>
          </div>
          <CreatePropertyDialog
            onPropertyCreated={() => {
              refetch().catch((error) => {
                console.error(
                  "Failed to refetch properties after creation:",
                  error,
                );
              });
            }}
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search properties..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Properties Table */}
        {isLoading ? (
          <div className="py-8 text-center">Loading properties...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {propertiesData?.properties.map((property) => {
                  const TypeIcon = propertyTypeIcons[property.type];
                  return (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/properties/${property.id}`}
                          className="flex items-center gap-2 transition-colors hover:text-blue-600"
                        >
                          <TypeIcon className="h-4 w-4" />
                          {property.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {PROPERTY_TYPE_LABELS[property.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[property.status]}>
                          {property.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {property.description ? (
                          <span className="text-sm text-gray-600">
                            {property.description.length > 50
                              ? `${property.description.substring(0, 50)}...`
                              : property.description}
                          </span>
                        ) : (
                          <span className="text-gray-400">No description</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(property.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Actions for ${property.name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <EditPropertyDialog
                              property={property}
                              onPropertyUpdated={() => {
                                refetch().catch((error) => {
                                  console.error(
                                    "Failed to refetch properties after update:",
                                    error,
                                  );
                                });
                              }}
                            />
                            <DropdownMenuItem
                              onClick={() => handleDeleteProperty(property.id)}
                              className="text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {propertiesData && propertiesData.total > limit && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, propertiesData.total)} of{" "}
              {propertiesData.total} properties
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page * limit >= propertiesData.total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
