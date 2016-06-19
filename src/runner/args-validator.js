import suggestMatch from 'bicycle/utils/suggest-match';
import validateArg from './arg-validator';

export default function validateArgs(schema: Object, type: Object, inputObject: Object) {
  Object.keys(inputObject).forEach(key => {
    if (!(key in type)) {
      const suggestion = suggestMatch(Object.keys(type), key);
      throw new Error(
        `Unexpected argument "${key}"${suggestion}`
      );
    }
  });

  const typedResult = {};
  Object.keys(type).map(key => {
    typedResult[key] = validateArg(
      schema,
      type[key].type,
      inputObject[key],
      key,
    );
  });
  return typedResult;
}
