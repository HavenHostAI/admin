import { Resource } from "ra-core";
import { Admin } from "@/components/admin";
import dataProvider from "@/lib/convexDataProvider";
import { authProvider } from "@/lib/authProvider";
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
import {
  UserCreate,
  UserEdit,
  UserList,
  UserShow,
} from "@/resources/users";
import {
  NumberCreate,
  NumberEdit,
  NumberList,
  NumberShow,
} from "@/resources/numbers";

function App() {
  return (
    <Admin dataProvider={dataProvider} authProvider={authProvider}>
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
        list={NumberList}
        create={NumberCreate}
        edit={NumberEdit}
        show={NumberShow}
        recordRepresentation="e164"
      />
    </Admin>
  );
}

export default App;
