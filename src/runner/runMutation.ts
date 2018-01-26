import MutationContext from '../types/MutationContext';
import MutationResult from '../types/MutationResult';
import {Mutation} from '../types/Schema';
import SchemaKind from '../types/SchemaKind';
import {validateArg, validateResult} from './validate';
import reportError from '../error-reporting';

const enum AccessDeniedType {}
const ACCESS_DENIED = {} as AccessDeniedType;
function isAccessDenied(v: any): v is AccessDeniedType {
  return v === ACCESS_DENIED;
}

export default function runMutation<Arg, Result, Context>(
  mutation: Mutation<Arg, Result, Context>,
  arg: Arg,
  mCtx: MutationContext<Context>,
): Promise<MutationResult<Result>> {
  return Promise.resolve(null)
    .then(() => {
      validateArg(mutation.argType, arg, mCtx.schema);
      return mutation.auth === 'public'
        ? true
        : mutation.auth(arg, mCtx.context, mCtx);
    })
    .then<Result | AccessDeniedType>(auth => {
      if (auth !== true) {
        return ACCESS_DENIED;
      }
      return mutation.resolve(arg, mCtx.context, mCtx);
    })
    .then((value: Result | AccessDeniedType): MutationResult<Result> => {
      if (isAccessDenied(value)) {
        return {
          s: false,
          v: {
            message: 'You do not have permission to call this mutation.',
            code: 'AUTH_ERROR',
          },
        };
      }
      if (mutation.resultType.kind === SchemaKind.Void) {
        return {s: true, v: (undefined as any) as Result};
      }
      validateResult(mutation.resultType, value, mCtx.schema);
      return {s: true, v: value};
    })
    .catch((ex: any): MutationResult<Result> => {
      reportError(ex, mCtx.logging);
      if (process.env.NODE_ENV === 'production' && !ex.exposeProd) {
        return {
          s: false,
          v: {
            message:
              'Unexpected error while running ' +
              mutation.name +
              ' (If you are the software developer on this system, you can display ' +
              'the actual error message by setting `NODE_ENV="development"` or setting ' +
              'a property of `exposeProd = true` on the error object)',
            code: 'PRODUCTION_ERROR',
          },
        };
      }
      return {
        s: false,
        v: {
          message: ex.message + ' while running ' + mutation.name,
          data: ex.data,
          code: ex.code || undefined,
        },
      };
    });
}
