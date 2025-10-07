import { required, useFieldValue, useRecordContext } from "ra-core";
import { Create } from "@/components/admin/create";
import { DataTable } from "@/components/admin/data-table";
import { DateField } from "@/components/admin/date-field";
import { Edit } from "@/components/admin/edit";
import { List } from "@/components/admin/list";
import { RecordField } from "@/components/admin/record-field";
import { Show } from "@/components/admin/show";
import { SimpleForm } from "@/components/admin/simple-form";
import { SelectInput } from "@/components/admin/select-input";
import { TextField } from "@/components/admin/text-field";
import { TextInput } from "@/components/admin/text-input";
import { NumberInput } from "@/components/admin/number-input";
import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

type CompanyRecord = {
  name?: string | null;
  branding?: {
    logoUrl?: string | null;
    greetingName?: string | null;
  } | null;
};

type LogoPreviewFieldProps = {
  className?: string;
  source?: string;
  empty?: ReactNode;
} & HTMLAttributes<HTMLSpanElement>;

const LogoPreviewField = ({
  className,
  source,
  empty,
}: LogoPreviewFieldProps) => {
  const record = useRecordContext<CompanyRecord>();
  const value = useFieldValue({ source, record });

  if (typeof value !== "string" || value.trim().length === 0) {
    if (empty !== undefined) {
      return <span className={cn(className)}>{empty}</span>;
    }

    return (
      <span className={cn("text-muted-foreground", className)}>
        No logo provided
      </span>
    );
  }

  const altText =
    record?.name && record.name.trim().length > 0
      ? `${record.name} logo preview`
      : "Company logo preview";

  return (
    <span className={cn("flex items-center gap-3", className)}>
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary max-w-[16rem] truncate underline"
      >
        {value}
      </a>
      <img
        alt={altText}
        src={value}
        className="h-12 w-12 rounded-md border bg-white object-contain"
      />
    </span>
  );
};

const planChoices = [
  { id: "starter", name: "Starter" },
  { id: "growth", name: "Growth" },
  { id: "pro", name: "Pro" },
];

export const CompanyList = () => (
  <List>
    <DataTable>
      <DataTable.Col source="name" label="Name">
        <TextField source="name" />
      </DataTable.Col>
      <DataTable.Col source="plan" label="Plan">
        <TextField source="plan" />
      </DataTable.Col>
      <DataTable.Col source="timezone" label="Timezone">
        <TextField source="timezone" />
      </DataTable.Col>
      <DataTable.Col source="createdAt" label="Created">
        <DateField source="createdAt" showTime />
      </DataTable.Col>
    </DataTable>
  </List>
);

export const CompanyCreate = () => (
  <Create>
    <SimpleForm defaultValues={{ createdAt: Date.now() }}>
      <TextInput source="name" label="Name" validate={[required()]} />
      <SelectInput
        source="plan"
        label="Plan"
        choices={planChoices}
        validate={[required()]}
      />
      <TextInput
        source="timezone"
        label="Timezone"
        placeholder="America/New_York"
        validate={[required()]}
      />
      <TextInput source="branding.logoUrl" label="Branding · Logo URL" />
      <TextInput
        source="branding.greetingName"
        label="Branding · Greeting Name"
      />
      <NumberInput source="createdAt" label="Created At (epoch ms)" />
    </SimpleForm>
  </Create>
);

export const CompanyEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" label="Name" validate={[required()]} />
      <SelectInput
        source="plan"
        label="Plan"
        choices={planChoices}
        validate={[required()]}
      />
      <TextInput source="timezone" label="Timezone" validate={[required()]} />
      <TextInput source="branding.logoUrl" label="Branding · Logo URL" />
      <TextInput
        source="branding.greetingName"
        label="Branding · Greeting Name"
      />
      <NumberInput source="createdAt" label="Created At (epoch ms)" />
    </SimpleForm>
  </Edit>
);

export const CompanyShow = () => (
  <Show>
    <div className="flex flex-col gap-4">
      <RecordField source="name" label="Name" />
      <RecordField source="plan" label="Plan" />
      <RecordField source="timezone" label="Timezone" />
      <RecordField
        source="branding.logoUrl"
        label="Logo URL"
        field={LogoPreviewField}
      />
      <RecordField source="branding.greetingName" label="Greeting Name" />
      <RecordField source="createdAt" label="Created">
        <DateField source="createdAt" showTime />
      </RecordField>
    </div>
  </Show>
);
