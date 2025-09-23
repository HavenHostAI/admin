import { required } from "ra-core";
import { Create } from "@/components/admin/create";
import { DataTable } from "@/components/admin/data-table";
import { Edit } from "@/components/admin/edit";
import { List } from "@/components/admin/list";
import { RecordField } from "@/components/admin/record-field";
import { Show } from "@/components/admin/show";
import { SimpleForm } from "@/components/admin/simple-form";
import { BooleanInput } from "@/components/admin/boolean-input";
import { TextField } from "@/components/admin/text-field";
import { TextInput } from "@/components/admin/text-input";

export const PostList = () => (
  <List>
    <DataTable>
      <DataTable.Col source="title" label="Title">
        <TextField source="title" />
      </DataTable.Col>
      <DataTable.Col source="published" label="Published">
        <TextField source="published" />
      </DataTable.Col>
      <DataTable.Col source="body" label="Body">
        <TextField source="body" />
      </DataTable.Col>
    </DataTable>
  </List>
);

export const PostCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title" label="Title" validate={[required()]} />
      <TextInput
        source="body"
        label="Body"
        multiline
        rows={6}
      />
      <BooleanInput source="published" label="Published" />
    </SimpleForm>
  </Create>
);

export const PostEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title" label="Title" validate={[required()]} />
      <TextInput
        source="body"
        label="Body"
        multiline
        rows={6}
      />
      <BooleanInput source="published" label="Published" />
    </SimpleForm>
  </Edit>
);

export const PostShow = () => (
  <Show>
    <div className="flex flex-col gap-4">
      <RecordField source="title" label="Title" />
      <RecordField source="body" label="Body" />
      <RecordField source="published" label="Published" />
    </div>
  </Show>
);
