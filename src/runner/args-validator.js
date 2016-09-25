import suggestMatch from 'bicycle/utils/suggest-match';
import validateArg from './arg-validator';

export default function validateArgs(schema: Object, type: Object, inputObject: Object) {
  Object.keys(inputObject).forEach(key => {
    if (!(key in type)) {
      const suggestion = suggestMatch(Object.keys(type), key);
      const err = new TypeError(
        `Unexpected argument "${key}"${suggestion}`
      );
      err.exposeProd = true;
      throw err;
    }
  });

  const typedResult = {};
  Object.keys(type).map(key => {
    typedResult[key] = validateArg(
      schema,
      type[key],
      inputObject[key],
      key,
    );
  });
  return typedResult;
}
