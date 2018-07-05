// @opaque
export type AccessDeniedType = {};
export const ACCESS_DENIED = {} as AccessDeniedType;
export function isAccessDenied(v: any): v is AccessDeniedType {
  return v === ACCESS_DENIED;
}
