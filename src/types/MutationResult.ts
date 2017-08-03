export interface SuccessMutationResult<T> {
  readonly s: true;
  readonly v: T;
}
export interface MutationError {
  readonly message: string;
  readonly data?: any;
  readonly code?: string;
}

export interface FailureMutationResult {
  readonly s: false;
  readonly v: MutationError;
}
type MutationResult<T> = SuccessMutationResult<T> | FailureMutationResult;
export default MutationResult;
