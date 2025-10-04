import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Identifier,
  RaRecord,
  useGetList,
  useNotify,
  useRecordContext,
  useRefresh,
  useUpdate,
} from "ra-core";
import { List } from "@/components/admin/list";
import { DataTable } from "@/components/admin/data-table";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const placeholderTextClassName = "text-muted-foreground";

type PhoneNumberRecord = RaRecord<Identifier> & {
  e164: string;
  assignedPropertyId?: Identifier | null;
  assignedQueue?: string | null;
};

type PropertySummary = {
  id: Identifier;
  name: string;
};

type PropertyOption = {
  value: string;
  label: string;
};

type AssignPropertyDialogProps = {
  record: PhoneNumberRecord | null;
  onClose: () => void;
  options: PropertyOption[];
  valueToId: Map<string, Identifier>;
  isLoading: boolean;
  error?: unknown;
};

const AssignedQueueCell = () => {
  const record = useRecordContext<PhoneNumberRecord>();
  if (!record) {
    return null;
  }

  return record.assignedQueue ? (
    <span>{record.assignedQueue}</span>
  ) : (
    <span className={placeholderTextClassName}>Unassigned</span>
  );
};

const AssignPropertyButton = ({
  onAssign,
}: {
  onAssign: (record: PhoneNumberRecord) => void;
}) => {
  const record = useRecordContext<PhoneNumberRecord>();
  if (!record) {
    return null;
  }

  const label = record.assignedPropertyId
    ? "Change assignment"
    : "Assign property";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => onAssign(record)}
    >
      {label}
    </Button>
  );
};

const AssignPropertyDialog = ({
  record,
  onClose,
  options,
  valueToId,
  isLoading,
  error,
}: AssignPropertyDialogProps) => {
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [update, { isPending }] = useUpdate<PhoneNumberRecord>();
  const notify = useNotify();
  const refresh = useRefresh();

  useEffect(() => {
    if (record) {
      setSelectedValue(
        record.assignedPropertyId != null
          ? String(record.assignedPropertyId)
          : "",
      );
    } else {
      setSelectedValue("");
    }
  }, [record]);

  const handleSubmit = useCallback(async () => {
    if (!record) return;

    const nextValue =
      selectedValue === ""
        ? null
        : (valueToId.get(selectedValue) ?? selectedValue);

    try {
      await update(
        "numbers",
        {
          id: record.id,
          data: {
            assignedPropertyId: nextValue,
          },
          previousData: record,
        },
        { mutationMode: "pessimistic", returnPromise: true },
      );
      notify("Phone number assignment updated.", { type: "info" });
      refresh();
      onClose();
    } catch (_error) {
      notify("Failed to update the phone number assignment.", {
        type: "warning",
      });
    }
  }, [record, selectedValue, valueToId, update, notify, refresh, onClose]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  const disableSubmit = isPending || isLoading || !!error;

  return (
    <Dialog open={record != null} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Assign property</DialogTitle>
          <DialogDescription>
            {record
              ? `Select which property should receive calls from ${record.e164}.`
              : null}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>
              We were unable to load the list of properties. Please try again
              later.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex flex-col gap-3">
            <Select
              value={selectedValue}
              onValueChange={setSelectedValue}
              disabled={isLoading || isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!isLoading && options.length === 0 ? (
              <p className={placeholderTextClassName}>
                No properties are available yet. Add a property to assign this
                number.
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={disableSubmit}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const PhoneNumberList = () => {
  const [selectedRecord, setSelectedRecord] =
    useState<PhoneNumberRecord | null>(null);

  const handleOpenDialog = useCallback((record: PhoneNumberRecord) => {
    setSelectedRecord(record);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setSelectedRecord(null);
  }, []);

  const {
    data: properties = [],
    isPending: isLoadingProperties,
    error: propertiesError,
  } = useGetList<PropertySummary>("properties", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  const options = useMemo<PropertyOption[]>(() => {
    return properties.map((property) => ({
      value: String(property.id),
      label: property.name,
    }));
  }, [properties]);

  const valueToId = useMemo(() => {
    const entries = new Map<string, Identifier>();
    for (const property of properties) {
      entries.set(String(property.id), property.id);
    }
    return entries;
  }, [properties]);

  return (
    <>
      <List title="Phone Numbers">
        <DataTable>
          <DataTable.Col source="e164" label="Phone Number">
            <TextField source="e164" />
          </DataTable.Col>
          <DataTable.Col
            source="assignedPropertyId"
            label="Assigned Property"
            disableSort
          >
            <ReferenceField
              reference="properties"
              source="assignedPropertyId"
              empty={
                <span className={placeholderTextClassName}>Unassigned</span>
              }
              link={false}
            >
              <TextField source="name" />
            </ReferenceField>
          </DataTable.Col>
          <DataTable.Col
            source="assignedQueue"
            label="Assigned Queue"
            disableSort
          >
            <AssignedQueueCell />
          </DataTable.Col>
          <DataTable.Col label="Actions" disableSort>
            <AssignPropertyButton onAssign={handleOpenDialog} />
          </DataTable.Col>
        </DataTable>
      </List>

      <AssignPropertyDialog
        record={selectedRecord}
        onClose={handleCloseDialog}
        options={options}
        valueToId={valueToId}
        isLoading={isLoadingProperties}
        error={propertiesError}
      />
    </>
  );
};
