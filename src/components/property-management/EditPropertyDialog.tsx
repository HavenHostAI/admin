"use client";

import React, { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Edit } from "lucide-react";
import type { Property } from "@/repositories/interfaces/property.repository";

const propertyTypes = [
  { value: "server", label: "Server" },
  { value: "domain", label: "Domain" },
  { value: "ssl_certificate", label: "SSL Certificate" },
  { value: "database", label: "Database" },
  { value: "storage", label: "Storage" },
];

const propertyStatuses = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "maintenance", label: "Maintenance" },
  { value: "suspended", label: "Suspended" },
];

interface EditPropertyDialogProps {
  property: Property;
  onPropertyUpdated?: () => void;
}

export function EditPropertyDialog({
  property,
  onPropertyUpdated,
}: EditPropertyDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: property.name,
    description: property.description || "",
    type: property.type,
    status: property.status,
    owner_id: property.owner_id || "",
    is_active: property.is_active,
  });

  const updateProperty = api.property.update.useMutation({
    onSuccess: () => {
      setOpen(false);
      onPropertyUpdated?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type) {
      return;
    }

    updateProperty.mutate({
      id: property.id,
      name: formData.name,
      description: formData.description || undefined,
      type: formData.type as
        | "server"
        | "domain"
        | "ssl_certificate"
        | "database"
        | "storage",
      status: formData.status as
        | "active"
        | "inactive"
        | "maintenance"
        | "suspended",
      owner_id: formData.owner_id || undefined,
      is_active: formData.is_active,
    });
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
          <DialogTitle>Edit Property</DialogTitle>
          <DialogDescription>
            Update the property information.
          </DialogDescription>
        </DialogHeader>

        {updateProperty.error && (
          <Alert variant="destructive">
            <AlertDescription>{updateProperty.error.message}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Property name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                {propertyTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {propertyStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Property description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner_id">Owner ID</Label>
            <Input
              id="owner_id"
              placeholder="Owner user ID (optional)"
              value={formData.owner_id}
              onChange={(e) =>
                setFormData({ ...formData, owner_id: e.target.value })
              }
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateProperty.isPending}>
              {updateProperty.isPending ? "Updating..." : "Update Property"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
