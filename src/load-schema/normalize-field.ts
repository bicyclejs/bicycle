import getType from './get-type';
import SchemaKind from '../types/SchemaKind';
import {Field} from '../types/Schema';
import * as ta from './TypeAssertions';

function normalizeField(
  field: unknown,
  fieldName: string,
  typeName: string,
  typeNames: Array<string>,
): Field<any, any, any, any> {
  const ctx = typeName + '.' + fieldName;
  const f = ta.String.or(
    ta.ObjectKeys(['type', 'description', 'args', 'auth', 'resolve']),
  ).validate(field, ctx);
  if (typeof f === 'string') {
    return {
      kind: SchemaKind.FieldProperty,
      name: typeName,
      description: undefined,
      resultType: getType(f, ctx, typeNames),
      auth: 'public',
    };
  }
  const resolve = ta.Void.or(ta.Fn).validate(f.resolve, ctx + '.resolve');
  if (resolve) {
    return {
      kind: SchemaKind.FieldMethod,
      name: typeName,
      description: ta.Void.or(ta.String).validate(
        f.description,
        ctx + '.description',
      ),
      resultType: getType(f.type, ctx + '.type', typeNames),
      argType: getType(
        f.args === undefined ? 'void' : f.args,
        ctx + '.args',
        typeNames,
      ),
      auth: ta
        .Literal<'public'>('public')
        .or(ta.Fn)
        .validate(f.auth === undefined ? 'public' : f.auth, ctx + '.auth'),
      resolve,
    };
  }
  return {
    kind: SchemaKind.FieldProperty,
    name: typeName,
    description: ta.Void.or(ta.String).validate(
      f.description,
      ctx + '.description',
    ),
    resultType: getType(f.type, ctx + '.type', typeNames),
    auth: ta
      .Literal<'public'>('public')
      .or(ta.Fn)
      .validate(f.auth === undefined ? 'public' : f.auth, ctx + '.auth'),
  };
}

export default normalizeField;
