const enum SchemaKind {
  // primative types
  Any = 'Any',
  Boolean = 'Boolean',
  Number = 'Number',
  String = 'String',
  Void = 'Void',
  Null = 'Null',

  // complex types
  List = 'List',
  Literal = 'Literal',
  Union = 'Union',
  Object = 'Object',
  Promise = 'Promise',

  // named type
  Named = 'Named',
  Scalar = 'Scalar',

  // ast nodes
  FieldMethod = 'FieldMethod',
  FieldProperty = 'FieldProperty',
  NodeType = 'NodeType',
  Mutation = 'Mutation',
}
export default SchemaKind;
