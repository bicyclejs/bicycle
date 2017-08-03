import CacheUpdateType from '../CacheUpdateType';

export function createErrorResult(
  message: string,
  data?: any,
  code?: string,
): ErrorResult {
  return {
    _type: CacheUpdateType.ERROR,
    message: message,
    data: data,
    code: code,
  };
}

export function isErrorResult(cache: any): cache is ErrorResult {
  return !!(
    cache &&
    typeof cache === 'object' &&
    (cache as ErrorResult)._type === CacheUpdateType.ERROR
  );
}
export default interface ErrorResult {
  readonly _type: CacheUpdateType.ERROR;
  readonly message: string;
  readonly data: any;
  readonly code?: string;
};
