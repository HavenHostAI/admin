import { required } from "ra-core";
import { useMemo } from "react";
import { useNotify, useRedirect } from "ra-core";
import type { SubmitHandler, FieldValues } from "react-hook-form";
import { Create } from "@/components/admin/create";
import { DataTable } from "@/components/admin/data-table";
import { Edit } from "@/components/admin/edit";
import { List } from "@/components/admin/list";
import { RecordField } from "@/components/admin/record-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { ReferenceInput } from "@/components/admin/reference-input";
import { Show } from "@/components/admin/show";
import { SimpleForm } from "@/components/admin/simple-form";
import { SelectInput } from "@/components/admin/select-input";
import { TextField } from "@/components/admin/text-field";
import { TextInput } from "@/components/admin/text-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { NumberInput } from "@/components/admin/number-input";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const roleChoices = [
  { id: "owner", name: "Owner" },
  { id: "manager", name: "Manager" },
  { id: "agent", name: "Agent" },
];

const statusChoices = [
  { id: "active", name: "Active" },
  { id: "inactive", name: "Inactive" },
  { id: "invited", name: "Invited" },
];

export const UserList = () => (
  <List>
    <DataTable>
      <DataTable.Col source="email" label="Email">
        <TextField source="email" />
      </DataTable.Col>
      <DataTable.Col source="role" label="Role">
        <TextField source="role" />
      </DataTable.Col>
      <DataTable.Col source="status" label="Status">
        <TextField source="status" />
      </DataTable.Col>
      <DataTable.Col source="emailVerified" label="Email Verified">
        <TextField source="emailVerified" />
      </DataTable.Col>
      <DataTable.Col source="companyId" label="Company">
        <ReferenceField reference="companies" source="companyId">
          <TextField source="name" />
        </ReferenceField>
      </DataTable.Col>
    </DataTable>
  </List>
);

export const UserCreate = () => {
  const notify = useNotify();
  const redirect = useRedirect();
  const convexClient = useMemo(() => {
    if (!import.meta.env.VITE_CONVEX_URL) {
      throw new Error("VITE_CONVEX_URL is not defined");
    }
    return new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);
  }, []);

  const handleSubmit: SubmitHandler<FieldValues> = async (values) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("better-auth:token") : null;
    if (!token) {
      notify("Your session has expired. Please sign in again.", { type: "warning" });
      return;
    }

    try {
      await convexClient.action(api.company.inviteUser, {
        sessionToken: token,
        email: (values.email as string).trim().toLowerCase(),
        name: values.name as string | undefined,
        role: values.role as string | undefined,
      });
      notify("Invitation sent successfully.", { type: "success" });
      redirect("list", "users");
    } catch (error) {
      const fallback = "users.invite_error";
      let message = fallback;
      if (typeof error === "string") {
        message = error;
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }
      notify(message, {
        type: "error",
        messageArgs: { _: message },
      });
      throw error;
    }
  };

  return (
    <Create>
      <SimpleForm
        onSubmit={handleSubmit}
        defaultValues={{ role: "agent" }}
      >
        <TextInput source="email" label="Email" type="email" validate={[required()]} />
        <TextInput source="name" label="Name" />
        <SelectInput
          source="role"
          label="Role"
          choices={roleChoices}
          defaultValue="agent"
        />
      </SimpleForm>
    </Create>
  );
};

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <ReferenceInput source="companyId" reference="companies">
        <AutocompleteInput
          label="Company"
          optionText="name"
          validate={[required()]}
        />
      </ReferenceInput>
      <TextInput source="email" label="Email" type="email" validate={[required()]} />
      <TextInput source="name" label="Name" />
      <SelectInput source="role" label="Role" choices={roleChoices} validate={[required()]} />
      <SelectInput source="status" label="Status" choices={statusChoices} validate={[required()]} />
      <BooleanInput source="emailVerified" label="Email Verified" />
      <NumberInput source="createdAt" label="Created At (epoch ms)" />
      <NumberInput source="updatedAt" label="Updated At (epoch ms)" />
    </SimpleForm>
  </Edit>
);

export const UserShow = () => (
  <Show>
    <div className="flex flex-col gap-4">
      <RecordField source="email" label="Email" />
      <RecordField source="name" label="Name" />
      <RecordField source="role" label="Role" />
      <RecordField source="status" label="Status" />
      <RecordField source="emailVerified" label="Email Verified" />
      <RecordField label="Company">
        <ReferenceField reference="companies" source="companyId">
          <TextField source="name" />
        </ReferenceField>
      </RecordField>
    </div>
  </Show>
);
