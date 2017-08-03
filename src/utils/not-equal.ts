export default function notEqual(oldValue: Object, newValue: Object): boolean {
  if (oldValue === newValue) return false;
  return (
    Object.keys(oldValue).some(key => {
      const oldProp = oldValue[key];
      const newProp = newValue[key];
      if (oldProp === newProp) return false;
      if (oldProp && newProp) {
        if (
          Array.isArray(oldProp) &&
          Array.isArray(newProp) &&
          oldProp.length === newProp.length
        ) {
          return oldProp.some((val, i) => {
            if (val === newProp[i]) return false;
            if (
              val &&
              newProp[i] &&
              typeof val === 'object' &&
              typeof newProp[i] === 'object'
            ) {
              return notEqual(val, newProp[i]);
            }
            return true;
          });
        }
        if (
          !Array.isArray(oldProp) &&
          typeof oldProp === 'object' &&
          typeof newProp === 'object'
        ) {
          return notEqual(oldProp, newProp);
        }
      }
      return true;
    }) || Object.keys(newValue).some(key => !(key in oldValue))
  );
}
