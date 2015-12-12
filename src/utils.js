
export function queryUnion(a, b) {
  var result = {};
  for (const key of Object.keys(a)) {
    if (
      a[key] &&
      (a[key] === true || typeof a[key] === 'object')
    ) {
      result[key] = a[key];
    }
  }
  for (const key of Object.keys(b)) {
    if (
      result[key] !== true &&
      b[key]
    ) {
      if (
        result[key] && typeof b[key] === 'object'
      ) {
        result[key] = objectUnion(result[key], b[key]);
      } else if (b[key] === true) {
        result[key] = b[key];
      }
    }
  }
  return result;
}

export function queryExclude(a, b) {
  var result = {};
  for (const key of Object.keys(a)) {
    if (
      a[key] &&
      (a[key] === true || typeof a[key] === 'object')
    ) {
      if (!b[key]) {
        result[key] = a[key];
      } else if (typeof b[key] === 'object') {
        if (a[key] === true) {
          result[key] = true;
        } else {
          result[key] = objectExclude(
            a[key],
            b[key]
          );
        }
      }
    }
  }
  return result;
}

export function resultsUnion(a, b) {
  var result = {};
  for (const key of Object.keys(a)) {
    result[key] = a[key];
  }
  for (const key of Object.keys(b)) {
    if (
      result[key] &&
      typeof result[key] === 'object' &&
      b[key] &&
      typeof b[key] === 'object'
    ) {
      result[key] = resultsUnion(result[key], b[key]);
    } else {
      result[key] = b[key];
    }
  }
  return result;
}
