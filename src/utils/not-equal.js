// @public
// @flow

export default function notEqual(oldValue: Object, newValue: Object): boolean {
  if (oldValue === newValue) return false;
  return Object.keys(oldValue).some(key => {
    if (oldValue[key] === newValue[key]) return false;
    if (oldValue[key] && newValue[key]) {
      if (
        Array.isArray(oldValue[key]) &&
        Array.isArray(newValue[key]) &&
        oldValue[key].length === newValue[key].length
      ) {
        return oldValue[key].some((val, i) => {
          if (val === newValue[key][i]) return false;
          if (val && newValue[key][i] && typeof val === 'object' && typeof newValue[key][i] === 'object') {
            return notEqual(val, newValue[key][i]);
          }
          return true;
        });
      }
      if (!Array.isArray(oldValue[key]) && typeof oldValue[key] === 'object' && typeof newValue[key] === 'object') {
        return notEqual(oldValue[key], newValue[key]);
      }
    }
    return true;
  }) || Object.keys(newValue).some(key => !(key in oldValue));
}
