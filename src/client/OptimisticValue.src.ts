// @opaque
// @expose
export type PendingOptimisticValue = string;
// @opaque
// @expose
export type FulfilledOptimisticValue = string;
// @opaque
// @expose
export type RejectedOptimisticValue = string;

export type OptimisticValue =
  | PendingOptimisticValue
  | FulfilledOptimisticValue
  | RejectedOptimisticValue;
export default OptimisticValue;
