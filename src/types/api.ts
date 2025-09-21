import type {
  components as OpenAPIComponents,
  operations as OpenAPIOperations,
  paths as OpenAPIPaths,
} from "./openapi";

export type components = OpenAPIComponents;
export type paths = OpenAPIPaths;
export type operations = OpenAPIOperations;
export type Schemas = OpenAPIComponents["schemas"];
export type Responses = OpenAPIComponents["responses"];
export type Parameters = OpenAPIComponents["parameters"];

export type LoginRequest = Schemas["LoginRequest"];
export type LoginResponse = Schemas["LoginResponse"];
export type LogoutResponse = Schemas["LogoutResponse"];
export type SessionResponse = Schemas["SessionResponse"];
export type RefreshResponse = Schemas["RefreshResponse"];
export type User = Schemas["User"];
export type Role = Schemas["Role"];
export type Permission = Schemas["Permission"];
export type Session = Schemas["Session"];
export type CreateUserRequest = Schemas["CreateUserRequest"];
export type UpdateUserRequest = Schemas["UpdateUserRequest"];
export type UserResponse = Schemas["UserResponse"];
export type UserListResponse = Schemas["UserListResponse"];
export type CreateRoleRequest = Schemas["CreateRoleRequest"];
export type UpdateRoleRequest = Schemas["UpdateRoleRequest"];
export type AssignRoleRequest = Schemas["AssignRoleRequest"];
export type AssignPermissionRequest = Schemas["AssignPermissionRequest"];
export type RoleResponse = Schemas["RoleResponse"];
export type RoleListResponse = Schemas["RoleListResponse"];
export type UserRolesResponse = Schemas["UserRolesResponse"];
export type RolePermissionsResponse = Schemas["RolePermissionsResponse"];
export type Property = Schemas["Property"];
export type CreatePropertyRequest = Schemas["CreatePropertyRequest"];
export type UpdatePropertyRequest = Schemas["UpdatePropertyRequest"];
export type PropertyResponse = Schemas["PropertyResponse"];
export type PropertyListResponse = Schemas["PropertyListResponse"];
export type SuccessResponse = Schemas["SuccessResponse"];
export type ErrorResponse = Schemas["ErrorResponse"];
export type Pagination = Schemas["Pagination"];

export type BadRequestResponse = Responses["BadRequest"];
export type UnauthorizedResponse = Responses["Unauthorized"];
export type ForbiddenResponse = Responses["Forbidden"];
export type NotFoundResponse = Responses["NotFound"];
export type ConflictResponse = Responses["Conflict"];
export type InternalServerErrorResponse = Responses["InternalServerError"];

export type PageParam = Parameters["PageParam"];
export type LimitParam = Parameters["LimitParam"];
export type SearchParam = Parameters["SearchParam"];
export type RoleFilterParam = Parameters["RoleFilterParam"];
export type StatusFilterParam = Parameters["StatusFilterParam"];
export type UserIdParam = Parameters["UserIdParam"];
export type RoleIdParam = Parameters["RoleIdParam"];
export type PermissionIdParam = Parameters["PermissionIdParam"];
export type PropertyIdParam = Parameters["PropertyIdParam"];
export type PropertyTypeFilterParam = Parameters["PropertyTypeFilterParam"];
export type PropertyStatusFilterParam = Parameters["PropertyStatusFilterParam"];
