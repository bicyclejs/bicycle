import getType from './get-type';
import SchemaKind from '../types/SchemaKind';
import {Mutation} from '../types/Schema';
import ta from './TypeAssertions';

function normalizeMutation(
  mutation: unknown,
  typeName: string,
  mutationName: string,
  typeNames: Array<string>,
): Mutation<any, any, any> {
  const ctx = typeName + '.' + mutationName;
  const m = ta
    .ObjectKeys(['type', 'description', 'args', 'resolve', 'auth'])
    .validate(mutation, ctx);
  return {
    kind: SchemaKind.Mutation,
    name: mutationName,
    description: ta.Void.or(ta.String).validate(
      m.description,
      ctx + '.description',
    ),
    argType: getType(
      m.args === undefined ? 'void' : m.args,
      ctx + '.args',
      typeNames,
    ),
    resultType: getType(
      m.type === undefined ? 'void' : m.type,
      ctx + '.type',
      typeNames,
    ),
    auth: ta
      .Literal<'public'>('public')
      .or(ta.Fn)
      .validate(m.auth === undefined ? 'public' : m.auth, ctx + '.auth'),
    resolve: ta.Fn.validate(m.resolve, ctx + '.resolve'),
  };
}

export default normalizeMutation;
