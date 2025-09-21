"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Shield } from "lucide-react";
import type { Role, User } from "~/types/api";

interface AssignRoleDialogProps {
  user: User;
  onRoleAssigned: () => void;
}

export function AssignRoleDialog({
  user,
  onRoleAssigned,
}: AssignRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const { data: rolesData } = api.role.list.useQuery({
    page: 1,
    limit: 100,
  });

  const assignRoleMutation = api.user.assignRole.useMutation({
    onSuccess: () => {
      setOpen(false);
      setSelectedRoleId("");
      onRoleAssigned();
    },
  });

  const removeRoleMutation = api.user.removeRole.useMutation({
    onSuccess: () => {
      onRoleAssigned();
    },
  });

  const handleAssignRole = async () => {
    if (!selectedRoleId) return;

    try {
      await assignRoleMutation.mutateAsync({
        userId: user.id,
        roleId: selectedRoleId,
      });
    } catch (error) {
      console.error("Failed to assign role:", error);
    }
  };

  const roles: Role[] = rolesData?.roles ?? [];
  const availableRoles = roles.filter((role) => role.name !== user.role);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Shield className="mr-2 h-4 w-4" />
          Manage Roles
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage User Roles</DialogTitle>
          <DialogDescription>
            Assign or remove roles for {user.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Role */}
          <div>
            <h4 className="mb-2 text-sm font-medium">Current Role</h4>
            {user.role ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" className="flex items-center gap-1">
                  {user.role}
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No role assigned</p>
            )}
          </div>

          {/* Assign New Role */}
          <div>
            <h4 className="mb-2 text-sm font-medium">Assign New Role</h4>
            <div className="flex gap-2">
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAssignRole}
                disabled={!selectedRoleId || assignRoleMutation.isPending}
                size="sm"
              >
                {assignRoleMutation.isPending ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </div>

          {(assignRoleMutation.error ?? removeRoleMutation.error) && (
            <Alert variant="destructive">
              <AlertDescription>
                {assignRoleMutation.error?.message ??
                  removeRoleMutation.error?.message}
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
