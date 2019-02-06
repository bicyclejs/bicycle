export type ContextFunction<Context> = (<Result>(
  fn: (ctx: Context) => Promise<Result>,
) => PromiseLike<Result>);
export type Ctx<Context> =
  | Context
  | ContextFunction<Context>
  | PromiseLike<Context | ContextFunction<Context>>;

function isPromiseLike<T>(v: PromiseLike<T> | T): v is PromiseLike<T> {
  return (
    v &&
    (typeof v === 'object' || typeof v === 'function') &&
    typeof (v as any).then === 'function'
  );
}
function isContextFunction<Context>(
  v: Context | ContextFunction<Context>,
): v is ContextFunction<Context> {
  return typeof v === 'function';
}
export default function withContext<Context, Result>(
  ctx: Ctx<Context>,
  fn: (context: Context) => Promise<Result>,
): Promise<Result> {
  return isPromiseLike(ctx)
    ? Promise.resolve(ctx).then(ctx => withContext(ctx, fn))
    : isContextFunction(ctx)
      ? Promise.resolve(ctx(fn))
      : fn(ctx);
}
