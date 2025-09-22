import { notFound } from "next/navigation";
import { PropertyDetail } from "~/components/property-management/PropertyDetail";
import { api } from "~/trpc/server";
import { auth } from "~/server/auth";

interface PropertyDetailPageProps {
  params: {
    id: string;
  };
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    notFound();
  }

  try {
    const property = await api.property.getById({ id: params.id });

    if (!property) {
      notFound();
    }

    return (
      <div className="container mx-auto py-6">
        <PropertyDetail property={property} />
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch property:", error);
    notFound();
  }
}
