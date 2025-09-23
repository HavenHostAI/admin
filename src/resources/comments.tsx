import { required } from "ra-core";
import { Create } from "@/components/admin/create";
import { DataTable } from "@/components/admin/data-table";
import { Edit } from "@/components/admin/edit";
import { List } from "@/components/admin/list";
import { RecordField } from "@/components/admin/record-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { Show } from "@/components/admin/show";
import { SimpleForm } from "@/components/admin/simple-form";
import { TextField } from "@/components/admin/text-field";
import { TextInput } from "@/components/admin/text-input";

export const CommentList = () => (
  <List>
    <DataTable>
      <DataTable.Col source="author" label="Author">
        <TextField source="author" />
      </DataTable.Col>
      <DataTable.Col source="postId" label="Post">
        <ReferenceField reference="posts" source="postId">
          <TextField source="title" />
        </ReferenceField>
      </DataTable.Col>
      <DataTable.Col source="body" label="Comment">
        <TextField source="body" />
      </DataTable.Col>
    </DataTable>
  </List>
);

export const CommentCreate = () => (
  <Create>
    <SimpleForm>
      <ReferenceInput
        source="postId"
        reference="posts"
        perPage={25}
        sort={{ field: "title", order: "ASC" }}
      >
        <AutocompleteInput
          label="Post"
          optionText="title"
          validate={[required()]}
        />
      </ReferenceInput>
      <TextInput source="author" label="Author" validate={[required()]} />
      <TextInput
        source="body"
        label="Comment"
        multiline
        rows={5}
        validate={[required()]}
      />
    </SimpleForm>
  </Create>
);

export const CommentEdit = () => (
  <Edit>
    <SimpleForm>
      <ReferenceInput
        source="postId"
        reference="posts"
        perPage={25}
        sort={{ field: "title", order: "ASC" }}
      >
        <AutocompleteInput
          label="Post"
          optionText="title"
          validate={[required()]}
        />
      </ReferenceInput>
      <TextInput source="author" label="Author" validate={[required()]} />
      <TextInput
        source="body"
        label="Comment"
        multiline
        rows={5}
        validate={[required()]}
      />
    </SimpleForm>
  </Edit>
);

export const CommentShow = () => (
  <Show>
    <div className="flex flex-col gap-4">
      <RecordField source="author" label="Author" />
      <RecordField label="Post">
        <ReferenceField reference="posts" source="postId">
          <TextField source="title" />
        </ReferenceField>
      </RecordField>
      <RecordField source="body" label="Comment" />
    </div>
  </Show>
);
