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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Search, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { CreateUserDialog } from "./CreateUserDialog";
import { EditUserDialog } from "./EditUserDialog";
import { AssignRoleDialog } from "./AssignRoleDialog";

const ALL_FILTER = "all" as const;

export function UserList() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const normalizedSearch = search.trim();
  const normalizedRoleFilter =
    roleFilter === ALL_FILTER ? undefined : roleFilter.trim();
  const selectedStatus =
    statusFilter === ALL_FILTER
      ? undefined
      : (statusFilter as "active" | "inactive");

  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = api.user.list.useQuery({
    page,
    limit,
    search: normalizedSearch === "" ? undefined : normalizedSearch,
    role: normalizedRoleFilter,
    status: selectedStatus,
  });

  const { data: rolesData } = api.role.list.useQuery({
    page: 1,
    limit: 100,
  });

  const deleteUserMutation = api.user.delete.useMutation({
    onSuccess: () => {
      refetch().catch((error) => {
        console.error("Failed to refetch users after deletion:", error);
        // Could also show a toast notification to the user here
      });
    },
  });

  type UserListResponse = RouterOutputs["user"]["list"];
  type RoleListResponse = RouterOutputs["role"]["list"];

  const users: UserListResponse["users"] = usersData?.users ?? [];
  const pagination = usersData?.pagination;
  const roles: RoleListResponse["roles"] = rolesData?.roles ?? [];

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUserMutation.mutateAsync({ id: userId });
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load users: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage users, roles, and permissions
            </CardDescription>
          </div>
          <CreateUserDialog
            onUserCreated={() => {
              refetch().catch((error) => {
                console.error("Failed to refetch users after creation:", error);
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
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>All roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="py-8 text-center">Loading users...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "active" : "inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <EditUserDialog
                            user={user}
                            onUserUpdated={() => {
                              refetch().catch((error) => {
                                console.error(
                                  "Failed to refetch users after update:",
                                  error,
                                );
                              });
                            }}
                          />
                          <AssignRoleDialog
                            user={user}
                            onRoleAssigned={() => {
                              refetch().catch((error) => {
                                console.error(
                                  "Failed to refetch users after role assignment:",
                                  error,
                                );
                              });
                            }}
                          />
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
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
                ? "No users found"
                : `Showing ${(page - 1) * limit + 1} to ${Math.min(
                    page * limit,
                    pagination.total,
                  )} of ${pagination.total} users`}
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
