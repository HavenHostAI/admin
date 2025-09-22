import { notFound } from "next/navigation";
import { PropertyDetail } from "~/components/property-management/PropertyDetail";
import { HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";

interface PropertyDetailPageProps {
  params:
    | {
        id: string;
      }
    | Promise<{
        id: string;
      }>;
}

async function resolveParams(
  params:
    | { id: string }
    | Promise<{ id: string }>
): Promise<{ id: string }> {
  if (params && typeof (params as Promise<unknown>).then === "function") {
    return await params;
  }
  return params as { id: string };
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const resolvedParams = await resolveParams(params);

  const isE2E =
    process.env.NEXT_PUBLIC_E2E === "true" || process.env.E2E === "true";

  if (!isE2E) {
    const session = await auth();

    if (!session?.user) {
      notFound();
    }
  }

  return (
    <div className="container mx-auto py-6">
      <HydrateClient>
        <PropertyDetail propertyId={resolvedParams.id} />
      </HydrateClient>
    </div>
  );
}
