import CacheUpdateType from '../CacheUpdateType';

export function createDeleteField(): DeleteField {
  return {
    _type: CacheUpdateType.DELETE_FIELD,
  };
}

export function isDeleteField(cache: any): cache is DeleteField {
  return !!(
    cache &&
    typeof cache === 'object' &&
    (cache as DeleteField)._type === CacheUpdateType.DELETE_FIELD
  );
}

export default interface DeleteField {
  readonly _type: CacheUpdateType.DELETE_FIELD;
};
