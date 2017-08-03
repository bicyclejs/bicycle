export default function id<T>(v: T): T {
  if (process.env.NODE_ENV !== 'production') {
    return require('deep-freeze')(v);
  }
  return v;
}
