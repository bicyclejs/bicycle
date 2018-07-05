/**
 * @generated opaque-types
 */

export type AccessDeniedType__Base = {};
declare const AccessDeniedType__Symbol: unique symbol;

declare class AccessDeniedType__Class {
  private __kind: typeof AccessDeniedType__Symbol;
}

/**
 * @opaque
 * @base AccessDeniedType__Base
 */
type AccessDeniedType = AccessDeniedType__Class;
const AccessDeniedType = {
  extract(value: AccessDeniedType): AccessDeniedType__Base {
    return value as any;
  },

  unsafeCast(value: AccessDeniedType__Base): AccessDeniedType {
    return value as any;
  },
};
export {AccessDeniedType};
export const ACCESS_DENIED = {} as AccessDeniedType;
export function isAccessDenied(v: any): v is AccessDeniedType {
  return v === ACCESS_DENIED;
}
