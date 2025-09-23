import { Resource } from "ra-core";
import { Admin } from "@/components/admin";
import dataProvider from "@/lib/convexDataProvider";
import {
  PostCreate,
  PostEdit,
  PostList,
  PostShow,
} from "@/resources/posts";
import {
  CommentCreate,
  CommentEdit,
  CommentList,
  CommentShow,
} from "@/resources/comments";
import {
  UserCreate,
  UserEdit,
  UserList,
  UserShow,
} from "@/resources/users";

function App() {
  return (
    <Admin dataProvider={dataProvider}>
      <Resource
        name="posts"
        list={PostList}
        create={PostCreate}
        edit={PostEdit}
        show={PostShow}
        recordRepresentation="title"
      />
      <Resource
        name="comments"
        list={CommentList}
        create={CommentCreate}
        edit={CommentEdit}
        show={CommentShow}
        recordRepresentation={(record) => record.author}
      />
      <Resource
        name="users"
        list={UserList}
        create={UserCreate}
        edit={UserEdit}
        show={UserShow}
        recordRepresentation="name"
      />
    </Admin>
  );
}

export default App;
