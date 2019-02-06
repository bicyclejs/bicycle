export default function notEqual(
  oldValue: {readonly [key: string]: unknown},
  newValue: {readonly [key: string]: unknown},
): boolean {
  if (oldValue === newValue) return false;
  return (
    Object.keys(oldValue).some(key => {
      const oldProp = oldValue[key];
      const newProp = newValue[key];
      if (oldProp === newProp) return false;
      if (
        typeof oldProp === 'object' &&
        oldProp &&
        typeof newProp === 'object' &&
        newProp
      ) {
        if (Array.isArray(oldProp) && Array.isArray(newProp)) {
          return (
            oldProp.length !== newProp.length ||
            oldProp.some((valOld: unknown, i) => {
              const valNew: unknown = newProp[i];
              if (valOld === valNew) return false;
              if (
                typeof valOld === 'object' &&
                typeof valNew === 'object' &&
                valOld &&
                valNew
              ) {
                return notEqual(valOld, valNew);
              }
              return true;
            })
          );
        }
        if (!Array.isArray(oldProp)) {
          return notEqual(oldProp, newProp);
        }
      }
      return true;
    }) || Object.keys(newValue).some(key => !(key in oldValue))
  );
}
