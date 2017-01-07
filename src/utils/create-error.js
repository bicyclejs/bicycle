// @flow

function createError(msg: string, data: Object, Constructor: Function = Error) {
  const result = new Constructor(msg);
  Object.keys(data).forEach(key => {
    result[key] = data[key];
  });
  return result;
}

export default createError;
