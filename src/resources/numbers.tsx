import { required } from "ra-core";
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
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";

export const NumberList = () => (
  <List>
    <DataTable>
      <DataTable.Col source="e164" label="Phone Number">
        <TextField source="e164" />
      </DataTable.Col>
      <DataTable.Col source="companyId" label="Company">
        <ReferenceField reference="companies" source="companyId">
          <TextField source="name" />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col source="assignedPropertyId" label="Property">
        <ReferenceField reference="properties" source="assignedPropertyId">
          <TextField source="name" />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col source="createdAt" label="Created">
        <DateField source="createdAt" showTime />
      </DataTable.Col>
    </DataTable>
  </List>
);

export const NumberCreate = () => (
  <Create>
    <SimpleForm defaultValues={{ createdAt: Date.now() }}>
      <ReferenceInput source="companyId" reference="companies">
        <AutocompleteInput
          label="Company"
          optionText="name"
          validate={[required()]}
        />
      </ReferenceInput>
      <TextInput source="e164" label="Phone Number" validate={[required()]} />
      <ReferenceInput source="assignedPropertyId" reference="properties">
        <AutocompleteInput label="Assigned Property" optionText="name" />
      </ReferenceInput>
      <TextInput source="assignedQueue" label="Assigned Queue" />
      <TextInput
        source="hours.fallbackNumber"
        label="Fallback Number"
        placeholder="+1..."
      />
      <ArrayInput source="hours.daily" label="Daily Hours">
        <SimpleFormIterator inline>
          <TextInput source="day" label="Day" />
          <TextInput source="open" label="Open" />
          <TextInput source="close" label="Close" />
        </SimpleFormIterator>
      </ArrayInput>
      <NumberInput source="createdAt" label="Created At (epoch ms)" />
    </SimpleForm>
  </Create>
);

export const NumberEdit = () => (
  <Edit>
    <SimpleForm>
      <ReferenceInput source="companyId" reference="companies">
        <AutocompleteInput
          label="Company"
          optionText="name"
          validate={[required()]}
        />
      </ReferenceInput>
      <TextInput source="e164" label="Phone Number" validate={[required()]} />
      <ReferenceInput source="assignedPropertyId" reference="properties">
        <AutocompleteInput label="Assigned Property" optionText="name" />
      </ReferenceInput>
      <TextInput source="assignedQueue" label="Assigned Queue" />
      <TextInput
        source="hours.fallbackNumber"
        label="Fallback Number"
        placeholder="+1..."
      />
      <ArrayInput source="hours.daily" label="Daily Hours">
        <SimpleFormIterator inline>
          <TextInput source="day" label="Day" />
          <TextInput source="open" label="Open" />
          <TextInput source="close" label="Close" />
        </SimpleFormIterator>
      </ArrayInput>
      <NumberInput source="createdAt" label="Created At (epoch ms)" />
    </SimpleForm>
  </Edit>
);

export const NumberShow = () => (
  <Show>
    <div className="flex flex-col gap-4">
      <RecordField source="e164" label="Phone Number" />
      <RecordField label="Company">
        <ReferenceField reference="companies" source="companyId">
          <TextField source="name" />
        </ReferenceField>
      </RecordField>
      <RecordField label="Property">
        <ReferenceField reference="properties" source="assignedPropertyId">
          <TextField source="name" />
        </ReferenceField>
      </RecordField>
      <RecordField source="assignedQueue" label="Assigned Queue" />
      <RecordField source="hours.fallbackNumber" label="Fallback Number" />
      <RecordField source="createdAt" label="Created">
        <DateField source="createdAt" showTime />
      </RecordField>
    </div>
  </Show>
);
