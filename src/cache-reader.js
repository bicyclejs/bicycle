function generateReader(node, selectionSet) {
  return (
    '{' +
    selectionSet.selections.map(selection => {
      const value = node + cacheKey(selection);
      return (
        (selection.alias ? selection.alias.value : selection.name.value) +
        ':' + value
      );
    }).join(',') +
    '}'
  );
}
function cacheKey(selection) {
  if (!selection.arguments || !selection.arguments.length) return selection.name.value;
}
export default function (ast) {
  return generateReader(ast.definitions[0].selectionSet);
}
