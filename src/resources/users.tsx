import { required } from "ra-core";
import { Create } from "@/components/admin/create";
import { DataTable } from "@/components/admin/data-table";
import { Edit } from "@/components/admin/edit";
import { List } from "@/components/admin/list";
import { RecordField } from "@/components/admin/record-field";
import { Show } from "@/components/admin/show";
import { SimpleForm } from "@/components/admin/simple-form";
import { SelectInput } from "@/components/admin/select-input";
import { TextField } from "@/components/admin/text-field";
import { TextInput } from "@/components/admin/text-input";

const roleChoices = [
  { id: "admin", name: "Admin" },
  { id: "editor", name: "Editor" },
  { id: "viewer", name: "Viewer" },
];

export const UserList = () => (
  <List>
    <DataTable>
      <DataTable.Col source="name" label="Name">
        <TextField source="name" />
      </DataTable.Col>
      <DataTable.Col source="email" label="Email">
        <TextField source="email" />
      </DataTable.Col>
      <DataTable.Col source="role" label="Role">
        <TextField source="role" />
      </DataTable.Col>
    </DataTable>
  </List>
);

export const UserCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" label="Name" validate={[required()]} />
      <TextInput source="email" label="Email" type="email" validate={[required()]} />
      <SelectInput
        source="role"
        label="Role"
        choices={roleChoices}
        validate={[required()]}
      />
    </SimpleForm>
  </Create>
);

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" label="Name" validate={[required()]} />
      <TextInput source="email" label="Email" type="email" validate={[required()]} />
      <SelectInput
        source="role"
        label="Role"
        choices={roleChoices}
        validate={[required()]}
      />
    </SimpleForm>
  </Edit>
);

export const UserShow = () => (
  <Show>
    <div className="flex flex-col gap-4">
      <RecordField source="name" label="Name" />
      <RecordField source="email" label="Email" />
      <RecordField source="role" label="Role" />
    </div>
  </Show>
);
