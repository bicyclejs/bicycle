export default function typeName(obj: any): string {
  if (obj === null) return 'null';
  if (Array.isArray(obj)) {
    if (process.env.NODE_ENV === 'production') {
      return 'Array';
    }
    if (obj.length === 0) return 'Array';
    if (obj.length === 1) return 'Array<' + typeName(obj[0]) + '>';
    const subType = obj.map(typeName).reduce((acc, val) => {
      return acc === val ? val : 'mixed';
    });
    if (subType === 'mixed') return 'Array';
    else return 'Array<' + subType + '>';
  }
  return typeof obj === 'object' ? 'Object' : typeof obj;
}
