import { Resource, CustomRoutes } from "ra-core";
import { Route } from "react-router-dom";
import { Admin } from "@/components/admin";
import dataProvider from "@/lib/convexDataProvider";
import { authProvider } from "@/lib/authProvider";
import { Dashboard } from "@/pages/dashboard";
import {
  CompanyCreate,
  CompanyEdit,
  CompanyList,
  CompanyShow,
} from "@/resources/companies";
import {
  PropertyCreate,
  PropertyEdit,
  PropertyList,
  PropertyShow,
} from "@/resources/properties";
import { UserCreate, UserEdit, UserList, UserShow } from "@/resources/users";
import { PhoneNumberList } from "@/resources/numbers";
import { SignupPage } from "@/components/admin/login-page";
import KnowledgeBasePage from "@/pages/knowledge-base";

function App() {
  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
      dashboard={Dashboard}
    >
      <Resource
        name="companies"
        list={CompanyList}
        create={CompanyCreate}
        edit={CompanyEdit}
        show={CompanyShow}
        recordRepresentation="name"
      />
      <Resource
        name="properties"
        list={PropertyList}
        create={PropertyCreate}
        edit={PropertyEdit}
        show={PropertyShow}
        recordRepresentation="name"
      />
      <Resource
        name="users"
        list={UserList}
        create={UserCreate}
        edit={UserEdit}
        show={UserShow}
        recordRepresentation="email"
      />
      <Resource
        name="numbers"
        list={PhoneNumberList}
        recordRepresentation="e164"
        options={{ label: "Phone Numbers" }}
      />
      <CustomRoutes>
        <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
      </CustomRoutes>
      <CustomRoutes noLayout>
        <Route
          path="/signup"
          element={<SignupPage allowModeSwitch={false} />}
        />
      </CustomRoutes>
    </Admin>
  );
}

export default App;
