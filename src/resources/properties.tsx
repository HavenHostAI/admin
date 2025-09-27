import { required } from "ra-core";
import { BooleanInput } from "@/components/admin/boolean-input";
import { Create } from "@/components/admin/create";
import { DataTable } from "@/components/admin/data-table";
import { DateField } from "@/components/admin/date-field";
import { Edit } from "@/components/admin/edit";
import { List } from "@/components/admin/list";
import { RecordField } from "@/components/admin/record-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { ReferenceInput } from "@/components/admin/reference-input";
import { Show } from "@/components/admin/show";
import { SimpleForm } from "@/components/admin/simple-form";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { TextField } from "@/components/admin/text-field";
import { TextInput } from "@/components/admin/text-input";
import { NumberInput } from "@/components/admin/number-input";

export const PropertyList = () => (
  <List>
    <DataTable>
      <DataTable.Col source="name" label="Name">
        <TextField source="name" />
      </DataTable.Col>
      <DataTable.Col source="companyId" label="Company">
        <ReferenceField reference="companies" source="companyId">
          <TextField source="name" />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col source="timeZone" label="Time Zone">
        <TextField source="timeZone" />
      </DataTable.Col>
      <DataTable.Col source="updatedAt" label="Updated">
        <DateField source="updatedAt" showTime />
      </DataTable.Col>
    </DataTable>
  </List>
);

export const PropertyCreate = () => (
  <Create>
    <SimpleForm
      defaultValues={{ createdAt: Date.now(), updatedAt: Date.now() }}
    >
      <ReferenceInput source="companyId" reference="companies">
        <AutocompleteInput
          label="Company"
          optionText="name"
          validate={[required()]}
        />
      </ReferenceInput>
      <TextInput source="name" label="Name" validate={[required()]} />
      <TextInput source="timeZone" label="Time Zone" />
      <TextInput source="address.street" label="Address · Street" />
      <TextInput source="address.city" label="Address · City" />
      <TextInput source="address.state" label="Address · State" />
      <TextInput source="address.postalCode" label="Address · Postal Code" />
      <TextInput source="address.country" label="Address · Country" />
      <BooleanInput source="flags.noCodeOverPhone" label="No Code Over Phone" />
      <BooleanInput
        source="flags.alwaysEscalateLockout"
        label="Always Escalate Lockout"
      />
      <BooleanInput source="flags.upsellEnabled" label="Upsell Enabled" />
      <NumberInput source="createdAt" label="Created At (epoch ms)" />
      <NumberInput source="updatedAt" label="Updated At (epoch ms)" />
    </SimpleForm>
  </Create>
);

export const PropertyEdit = () => (
  <Edit>
    <SimpleForm>
      <ReferenceInput source="companyId" reference="companies">
        <AutocompleteInput
          label="Company"
          optionText="name"
          validate={[required()]}
        />
      </ReferenceInput>
      <TextInput source="name" label="Name" validate={[required()]} />
      <TextInput source="timeZone" label="Time Zone" />
      <TextInput source="address.street" label="Address · Street" />
      <TextInput source="address.city" label="Address · City" />
      <TextInput source="address.state" label="Address · State" />
      <TextInput source="address.postalCode" label="Address · Postal Code" />
      <TextInput source="address.country" label="Address · Country" />
      <BooleanInput source="flags.noCodeOverPhone" label="No Code Over Phone" />
      <BooleanInput
        source="flags.alwaysEscalateLockout"
        label="Always Escalate Lockout"
      />
      <BooleanInput source="flags.upsellEnabled" label="Upsell Enabled" />
      <NumberInput source="createdAt" label="Created At (epoch ms)" />
      <NumberInput source="updatedAt" label="Updated At (epoch ms)" />
    </SimpleForm>
  </Edit>
);

export const PropertyShow = () => (
  <Show>
    <div className="flex flex-col gap-4">
      <RecordField source="name" label="Name" />
      <RecordField label="Company">
        <ReferenceField reference="companies" source="companyId">
          <TextField source="name" />
        </ReferenceField>
      </RecordField>
      <RecordField source="timeZone" label="Time Zone" />
      <RecordField source="flags.noCodeOverPhone" label="No Code Over Phone" />
      <RecordField
        source="flags.alwaysEscalateLockout"
        label="Always Escalate Lockout"
      />
      <RecordField source="flags.upsellEnabled" label="Upsell Enabled" />
      <RecordField source="address.street" label="Street" />
      <RecordField source="address.city" label="City" />
      <RecordField source="address.state" label="State" />
      <RecordField source="address.postalCode" label="Postal Code" />
      <RecordField source="address.country" label="Country" />
      <RecordField source="createdAt" label="Created">
        <DateField source="createdAt" showTime />
      </RecordField>
      <RecordField source="updatedAt" label="Updated">
        <DateField source="updatedAt" showTime />
      </RecordField>
    </div>
  </Show>
);
