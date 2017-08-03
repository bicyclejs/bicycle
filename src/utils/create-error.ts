declare global {
  interface Error {
    code?: string;
    data?: any;
    exposeProd?: boolean;
  }
}
function createError(
  msg: string,
  data: Object,
  Constructor: typeof Error = Error,
) {
  const result = new Constructor(msg);
  Object.keys(data).forEach(key => {
    result[key] = data[key];
  });
  return result;
}

export default createError;
