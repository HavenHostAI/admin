"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { UserList } from "~/components/user-management/UserList";
import { RoleList } from "~/components/role-management/RoleList";

export function UserRoleManagement() {
  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">User & Role Management</h1>
        <p className="mt-2 text-gray-600">
          Manage users, roles, and permissions for your application
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <UserList />
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <RoleList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
