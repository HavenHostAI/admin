"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { Shield } from "lucide-react";
import type { Permission, Role } from "~/types/api";

interface ManagePermissionsDialogProps {
  role: Role;
  onPermissionsUpdated: () => void;
}

export function ManagePermissionsDialog({
  role,
  onPermissionsUpdated,
}: ManagePermissionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    setSelectedPermissions(
      role.permissions?.map((permission: Permission) => permission.id) ?? [],
    );
  }, [role.permissions, open]);

  const { data: allPermissions } = api.permission.getAll.useQuery();

  const assignPermissionMutation = api.role.assignPermission.useMutation({
    onSuccess: () => {
      onPermissionsUpdated();
    },
  });

  const removePermissionMutation = api.role.removePermission.useMutation({
    onSuccess: () => {
      onPermissionsUpdated();
    },
  });

  const handlePermissionToggle = async (
    permissionId: string,
    checked: boolean,
  ) => {
    try {
      if (checked) {
        await assignPermissionMutation.mutateAsync({
          roleId: role.id,
          permissionId,
        });
        setSelectedPermissions((prev) =>
          prev.includes(permissionId) ? prev : [...prev, permissionId],
        );
      } else {
        await removePermissionMutation.mutateAsync({
          roleId: role.id,
          permissionId,
        });
        setSelectedPermissions((prev) =>
          prev.filter((id) => id !== permissionId),
        );
      }
    } catch (error) {
      console.error("Failed to update permission:", error);
    }
  };

  const groupedPermissions = useMemo(() => {
    return (allPermissions ?? []).reduce<Record<string, Permission[]>>(
      (acc, permission) => {
        const bucket = acc[permission.resource] ?? [];
        bucket.push(permission);
        acc[permission.resource] = bucket;
        return acc;
      },
      {},
    );
  }, [allPermissions]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Shield className="mr-1 h-4 w-4" />
          Permissions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Permissions</DialogTitle>
          <DialogDescription>
            Assign permissions to the {role.name} role
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Permissions Summary */}
          <div>
            <h4 className="mb-2 text-sm font-medium">Current Permissions</h4>
            <div className="flex flex-wrap gap-2">
              {role.permissions && role.permissions.length > 0 ? (
                role.permissions.map((permission: Permission) => (
                  <Badge key={permission.id} variant="default">
                    {permission.resource}:{permission.action}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">
                  No permissions assigned
                </span>
              )}
            </div>
          </div>

          {/* Permission Groups */}
          <div>
            <h4 className="mb-4 text-sm font-medium">Available Permissions</h4>
            <div className="space-y-4">
              {Object.keys(groupedPermissions).map((resource) => {
                const permissions = groupedPermissions[resource] ?? [];

                return (
                  <div key={resource} className="rounded-lg border p-4">
                    <h5 className="mb-3 font-medium capitalize">{resource}</h5>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {permissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.includes(
                              permission.id,
                            )}
                            onCheckedChange={(checked) =>
                              handlePermissionToggle(
                                permission.id,
                                checked === true,
                              )
                            }
                            disabled={
                              assignPermissionMutation.isPending ||
                              removePermissionMutation.isPending
                            }
                          />
                          <label
                            htmlFor={permission.id}
                            className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permission.action}
                          </label>
                          {permission.description && (
                            <span className="ml-1 text-xs text-gray-500">
                              - {permission.description}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {(assignPermissionMutation.error ??
            removePermissionMutation.error) && (
            <Alert variant="destructive">
              <AlertDescription>
                {assignPermissionMutation.error?.message ??
                  removePermissionMutation.error?.message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
