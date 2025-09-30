import type { ReactNode } from "react";
import { useListContext, Translate } from "ra-core";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BulkDeleteButton } from "@/components/admin/bulk-delete-button";
import { X } from "lucide-react";
import { BulkExportButton } from "./bulk-export-button";

export function BulkActionsToolbarChildren() {
  return (
    <>
      <BulkExportButton />
      <BulkDeleteButton />
    </>
  );
}

export const BulkActionsToolbar = ({
  children = <BulkActionsToolbarChildren />,
}: {
  children?: ReactNode;
}) => {
  const { selectedIds, onUnselectItems } = useListContext();
  if (!selectedIds?.length) {
    return null;
  }
  const handleUnselectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUnselectItems();
  };
  return (
    <Card className="fixed right-0 bottom-2 left-0 z-10 mx-auto flex w-[90%] flex-col items-stretch gap-2 bg-zinc-100 p-2 px-4 sm:w-fit sm:items-center md:flex-row md:gap-6 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="has-[>svg]:px-0"
          onClick={handleUnselectAll}
        >
          <X />
        </Button>
        <span className="text-muted-foreground text-sm">
          <Translate
            i18nKey="ra.action.bulk_actions"
            options={{ smart_count: selectedIds.length }}
          >
            {selectedIds.length} rows selected
          </Translate>
        </span>
      </div>
      {children}
    </Card>
  );
};
