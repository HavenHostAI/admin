"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Server,
  Globe,
  Shield,
  Database,
  HardDrive,
  Calendar,
  User,
  Settings,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { EditPropertyDialog } from "./EditPropertyDialog";
import { PROPERTY_TYPE_LABELS, STATUS_COLORS } from "@/lib/constants";

const propertyTypeIcons = {
  server: Server,
  domain: Globe,
  ssl_certificate: Shield,
  database: Database,
  storage: HardDrive,
};

interface PropertyDetailProps {
  propertyId: string;
}

export function PropertyDetail({ propertyId }: PropertyDetailProps) {
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const {
    data: property,
    isLoading,
    error,
    refetch,
  } = api.property.getById.useQuery({ id: propertyId });

  if (isLoading) {
    return <div className="py-8 text-center">Loading property details...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load property: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!property) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Property not found.</AlertDescription>
      </Alert>
    );
  }

  const TypeIcon = propertyTypeIcons[property.type];

  const deletePropertyMutation = api.property.delete.useMutation({
    onSuccess: () => {
      router.push("/properties");
    },
  });

  const activatePropertyMutation = api.property.activate.useMutation({
    onSuccess: () => {
      refetch().catch((error) => {
        console.error("Failed to refetch property after activation:", error);
      });
    },
  });

  const deactivatePropertyMutation = api.property.deactivate.useMutation({
    onSuccess: () => {
      refetch().catch((error) => {
        console.error("Failed to refetch property after deactivation:", error);
      });
    },
  });

  const handleDeleteProperty = async () => {
    if (
      confirm(
        `Are you sure you want to delete "${property.name}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deletePropertyMutation.mutateAsync({ id: property.id });
      } catch (error) {
        console.error("Failed to delete property:", error);
      }
    }
  };

  const handleActivateProperty = async () => {
    try {
      await activatePropertyMutation.mutateAsync({ id: property.id });
    } catch (error) {
      console.error("Failed to activate property:", error);
    }
  };

  const handleDeactivateProperty = async () => {
    if (confirm(`Are you sure you want to deactivate "${property.name}"?`)) {
      try {
        await deactivatePropertyMutation.mutateAsync({ id: property.id });
      } catch (error) {
        console.error("Failed to deactivate property:", error);
      }
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const renderConfiguration = () => {
    if (
      !property.configuration ||
      Object.keys(property.configuration).length === 0
    ) {
      return (
        <div className="text-sm text-gray-500 italic">
          No configuration data available
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {Object.entries(property.configuration).map(([key, value]) => (
          <div key={key} className="flex items-start gap-2">
            <span className="min-w-0 flex-shrink-0 text-sm font-medium">
              {key}:
            </span>
            <span className="text-sm break-all text-gray-700">
              {typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : typeof value === "string"
                  ? value
                  : typeof value === "number"
                    ? value.toString()
                    : typeof value === "boolean"
                      ? value.toString()
                      : ""}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <TypeIcon className="h-8 w-8 text-gray-600" />
            <div>
              <h1 className="text-3xl font-bold">{property.name}</h1>
              <p className="text-gray-600">
                {PROPERTY_TYPE_LABELS[property.type]} • ID: {property.id}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={STATUS_COLORS[property.status]}
            className="text-sm"
            data-testid="property-status"
          >
            {property.status}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                data-testid="property-actions-button"
              >
                <Settings className="mr-2 h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Property
              </DropdownMenuItem>
              {property.is_active ? (
                <DropdownMenuItem
                  onClick={handleDeactivateProperty}
                  className="text-orange-600"
                >
                  <PowerOff className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={handleActivateProperty}
                  className="text-green-600"
                >
                  <Power className="mr-2 h-4 w-4" />
                  Activate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleDeleteProperty}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Error States */}
      {deletePropertyMutation.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to delete property: {deletePropertyMutation.error.message}
          </AlertDescription>
        </Alert>
      )}

      {activatePropertyMutation.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to activate property:{" "}
            {activatePropertyMutation.error.message}
          </AlertDescription>
        </Alert>
      )}

      {deactivatePropertyMutation.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to deactivate property:{" "}
            {deactivatePropertyMutation.error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Property Information */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Property Information
            </CardTitle>
            <CardDescription>
              Basic details and configuration for this property
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700">
                Description
              </h3>
              <p className="text-sm text-gray-900">
                {property.description ?? (
                  <span className="text-gray-500 italic">
                    No description provided
                  </span>
                )}
              </p>
            </div>

            {/* Configuration */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700">
                Configuration
              </h3>
              <div
                className="rounded-md bg-gray-50 p-4"
                data-testid="property-configuration"
              >
                {renderConfiguration()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Metadata
            </CardTitle>
            <CardDescription>System information and timestamps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-1 text-sm font-medium text-gray-700">Status</h3>
              <div className="flex items-center gap-2">
                <Badge
                  variant={STATUS_COLORS[property.status]}
                  data-testid="property-status-label"
                >
                  {property.status}
                </Badge>
                <Badge
                  variant={property.is_active ? "default" : "secondary"}
                  data-testid="property-active-state"
                >
                  {property.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="mb-1 text-sm font-medium text-gray-700">Type</h3>
              <div className="flex items-center gap-2">
                <TypeIcon className="h-4 w-4" />
                <span className="text-sm" data-testid="property-type-label">
                  {PROPERTY_TYPE_LABELS[property.type]}
                </span>
              </div>
            </div>

            {property.owner_id && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-gray-700">
                  Owner
                </h3>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-mono text-sm">{property.owner_id}</span>
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-1 text-sm font-medium text-gray-700">
                Created
              </h3>
              <p className="text-sm text-gray-600">
                {formatDate(property.created_at)}
              </p>
            </div>

            <div>
              <h3 className="mb-1 text-sm font-medium text-gray-700">
                Last Updated
              </h3>
              <p className="text-sm text-gray-600">
                {formatDate(property.updated_at)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <EditPropertyDialog
        property={property}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onPropertyUpdated={() => {
          setShowEditDialog(false);
          refetch().catch((error) => {
            console.error("Failed to refetch property after update:", error);
          });
        }}
      />
    </div>
  );
}
