export default function typeNameFromValue(obj: any): string {
  if (process.env.NODE_ENV === 'production') {
    if (obj === null) return 'null';
    if (obj === undefined) return 'void';
    if (Array.isArray(obj)) return 'Array';
    return typeof obj;
  } else {
    if (obj === null) return 'null';
    if (obj === undefined) return 'void';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      if (obj.length === 1) return typeNameFromValue(obj[0]) + '[]';
      const subType = obj
        .map(typeNameFromValue)
        .reduce<string[]>((acc, val) => {
          return acc.indexOf(val) === -1 ? acc.concat([val]) : acc;
        }, []);
      if (subType.length === 1) return subType[0] + '[]';
      else return '(' + subType.sort().join(' | ') + ')[]';
    }
    if (typeof obj === 'object') {
      return (
        '{' +
        Object.keys(obj)
          .sort()
          .map(name => name + ': ' + typeNameFromValue(obj[name]))
          .join(', ') +
        '}'
      );
    }
    return typeof obj;
  }
}
