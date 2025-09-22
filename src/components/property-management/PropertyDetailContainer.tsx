"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { PropertyDetail } from "./PropertyDetail";
import { api } from "~/trpc/react";
import type { Property } from "@/repositories/interfaces/property.repository";

declare global {
  interface Window {
    __mockState?: {
      properties?: Property[];
    };
  }
}

interface PropertyDetailContainerProps {
  propertyId: string;
}

export function PropertyDetailContainer({
  propertyId,
}: PropertyDetailContainerProps) {
  const router = useRouter();
  const isE2E = process.env.NEXT_PUBLIC_E2E === "true";
  const [mockState, setMockState] = useState<{
    property: Property | null;
    error?: string;
    loading: boolean;
  }>({ property: null, loading: isE2E });

  useEffect(() => {
    if (!isE2E) {
      return;
    }

    let isMounted = true;

    const resolveMockState = () => {
      const property =
        typeof window !== "undefined"
          ? window.__mockState?.properties?.find(
              (item) => item.id === propertyId,
            ) ?? null
          : null;

      if (!isMounted) {
        return;
      }

      if (property) {
        setMockState({ property, loading: false });
      } else {
        setMockState({ property: null, loading: false, error: "Property not found" });
      }
    };

    setMockState((prev) => ({ ...prev, loading: true }));

    const timeout = window.setTimeout(resolveMockState, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [propertyId, isE2E]);

  const {
    data: property,
    isLoading,
    error,
    refetch,
  } = api.property.getById.useQuery(
    { id: propertyId },
    {
      enabled: !isE2E,
    },
  );

  const resolvedProperty = useMemo(() => {
    if (isE2E) {
      return mockState.property;
    }
    return property ?? null;
  }, [isE2E, mockState.property, property]);

  const resolvedError = useMemo(() => {
    if (isE2E) {
      return mockState.error ? new Error(mockState.error) : undefined;
    }
    return error;
  }, [error, isE2E, mockState.error]);

  const isLoadingState = isE2E ? mockState.loading : isLoading;

  if (isLoadingState) {
    return (
      <div className="py-12 text-center text-sm text-gray-600" data-testid="property-loading">
        Loading property details...
      </div>
    );
  }

  if (resolvedError || !resolvedProperty) {
    return (
      <div className="space-y-4" data-testid="property-error">
        <Alert variant="destructive">
          <AlertTitle>Unable to load property</AlertTitle>
          <AlertDescription>
            {resolvedError?.message ?? "Property not found"}
          </AlertDescription>
        </Alert>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push("/properties")}>Back to properties</Button>
          <Button
            variant="secondary"
            onClick={() => {
              if (isE2E) {
                setMockState((prev) => ({ ...prev, loading: true }));
                setTimeout(() => {
                  const property = window.__mockState?.properties?.find(
                    (item) => item.id === propertyId,
                  );
                  setMockState({
                    property: property ?? null,
                    loading: false,
                    error: property ? undefined : "Property not found",
                  });
                }, 0);
                return;
              }

              refetch().catch(() => {
                // handled via query error state
              });
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return <PropertyDetail property={resolvedProperty} />;
}
