"use client";

import { useState } from "react";
import { api, type RouterOutputs } from "~/trpc/react";
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
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Search, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { CreateRoleDialog } from "./CreateRoleDialog";
import { EditRoleDialog } from "./EditRoleDialog";
import { ManagePermissionsDialog } from "./ManagePermissionsDialog";
import type { Role } from "~/types/api";

type RoleListResponse = RouterOutputs["role"]["list"];

export function RoleList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const normalizedSearch = search.trim();

  const {
    data: rolesData,
    isLoading,
    error,
    refetch,
  } = api.role.list.useQuery({
    page,
    limit,
    search: normalizedSearch === "" ? undefined : normalizedSearch,
  });

  const deleteRoleMutation = api.role.delete.useMutation({
    onSuccess: () => {
      refetch().catch((error) => {
        console.error("Failed to refetch roles after deletion:", error);
        // Could also show a toast notification to the user here
      });
    },
  });

  const roles: Role[] = rolesData?.roles ?? [];
  const pagination: RoleListResponse["pagination"] | undefined =
    rolesData?.pagination;

  const handleDeleteRole = async (roleId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this role? This action cannot be undone.",
      )
    ) {
      try {
        await deleteRoleMutation.mutateAsync({ id: roleId });
      } catch (error) {
        console.error("Failed to delete role:", error);
      }
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load roles: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Role Management</CardTitle>
            <CardDescription>
              Manage roles and their permissions
            </CardDescription>
          </div>
          <CreateRoleDialog
            onRoleCreated={() => {
              refetch().catch((error) => {
                console.error("Failed to refetch roles after creation:", error);
              });
            }}
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Roles Table */}
        {isLoading ? (
          <div className="py-8 text-center">Loading roles...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>
                      {role.description ?? "No description"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.is_system ? "default" : "secondary"}>
                        {role.is_system ? "System" : "Custom"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {role.permissions?.length ?? 0} permissions
                        </span>
                        <ManagePermissionsDialog
                          role={role}
                          onPermissionsUpdated={() => {
                            refetch().catch((error) => {
                              console.error(
                                "Failed to refetch roles after permissions update:",
                                error,
                              );
                            });
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(role.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <EditRoleDialog
                            role={role}
                            onRoleUpdated={() => {
                              refetch().catch((error) => {
                                console.error(
                                  "Failed to refetch roles after update:",
                                  error,
                                );
                              });
                            }}
                          />
                          {!role.is_system && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteRole(role.id)}
                              className="text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total > limit && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {pagination.total === 0
                ? "No roles found"
                : `Showing ${(page - 1) * limit + 1} to ${Math.min(
                    page * limit,
                    pagination.total,
                  )} of ${pagination.total} roles`}
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
                disabled={page * limit >= pagination.total}
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
