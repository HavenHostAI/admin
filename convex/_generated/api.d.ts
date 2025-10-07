/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as _lib_authAdapter from "../_lib/authAdapter.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as authHelpers from "../authHelpers.js";
import type * as authStore from "../authStore.js";
import type * as company from "../company.js";
import type * as companyStore from "../companyStore.js";
import type * as constants from "../constants.js";
import type * as escalations from "../escalations.js";
import type * as knowledgeBase from "../knowledgeBase.js";
import type * as utils from "../utils.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "_lib/authAdapter": typeof _lib_authAdapter;
  admin: typeof admin;
  auth: typeof auth;
  authHelpers: typeof authHelpers;
  authStore: typeof authStore;
  company: typeof company;
  companyStore: typeof companyStore;
  constants: typeof constants;
  escalations: typeof escalations;
  knowledgeBase: typeof knowledgeBase;
  utils: typeof utils;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
