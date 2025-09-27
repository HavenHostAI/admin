import { required } from "ra-core";
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
      <SelectInput source="plan" label="Plan" choices={planChoices} validate={[required()]} />
      <TextInput source="timezone" label="Timezone" placeholder="America/New_York" validate={[required()]} />
      <TextInput source="branding.logoUrl" label="Branding · Logo URL" />
      <TextInput source="branding.greetingName" label="Branding · Greeting Name" />
      <NumberInput source="createdAt" label="Created At (epoch ms)" />
    </SimpleForm>
  </Create>
);

export const CompanyEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" label="Name" validate={[required()]} />
      <SelectInput source="plan" label="Plan" choices={planChoices} validate={[required()]} />
      <TextInput source="timezone" label="Timezone" validate={[required()]} />
      <TextInput source="branding.logoUrl" label="Branding · Logo URL" />
      <TextInput source="branding.greetingName" label="Branding · Greeting Name" />
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
      <RecordField source="branding.logoUrl" label="Logo URL" />
      <RecordField source="branding.greetingName" label="Greeting Name" />
      <RecordField source="createdAt" label="Created">
        <DateField source="createdAt" showTime />
      </RecordField>
    </div>
  </Show>
);
