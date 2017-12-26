export type Ctx<Context> =
  | Context
  | (<Result>(fn: (ctx: Context) => Promise<Result>) => Promise<Result>)
  | PromiseLike<
      | Context
      | (<Result>(fn: (ctx: Context) => Promise<Result>) => Promise<Result>)
    >;
function isPromiseLike<T>(v: PromiseLike<T> | T): v is PromiseLike<T> {
  return (
    v &&
    (typeof v === 'object' || typeof v === 'function') &&
    typeof (v as any).then === 'function'
  );
}
export default function withContext<Context, Result>(
  ctx: Ctx<Context>,
  fn: (context: Context) => Promise<Result>,
): Promise<Result> {
  return isPromiseLike(ctx)
    ? Promise.resolve(ctx).then(ctx => withContext(ctx, fn))
    : typeof ctx === 'function' ? ctx(fn) : fn(ctx);
}
