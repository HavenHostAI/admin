"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Edit } from "lucide-react";
import type { Role } from "~/types/api";

interface EditRoleDialogProps {
  role: Role;
  onRoleUpdated: () => void;
}

export function EditRoleDialog({ role, onRoleUpdated }: EditRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: role.name,
    description: role.description || "",
  });

  const updateRoleMutation = api.role.update.useMutation({
    onSuccess: () => {
      setOpen(false);
      onRoleUpdated();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateRoleMutation.mutateAsync({
        id: role.id,
        ...formData,
      });
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
          <DialogDescription>
            Update role information. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>
          {updateRoleMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {updateRoleMutation.error.message}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
