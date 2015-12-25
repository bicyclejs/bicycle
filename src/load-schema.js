import sha from 'stable-sha1';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import {Kind} from 'graphql/language';

const NullType = new GraphQLScalarType({
  name: 'Null',
  description: 'The Null type represents a value that is only ever `null`.',
  serialize() {
    return null;
  },
  parseValue() {
    return null;
  },
  parseLiteral() {
    return null;
  },
});

export default function (input) {
  const types = {};
  const generatedTypes = {};
  function getInputObjectType(objType, context) {
    if (
      Object.keys(objType).length === 1 &&
      Object.keys(objType)[0] === 'listOf' &&
      typeof objType.listOf === 'object'
    ) {
      return new GraphQLList(getInputObjectType(objType));
    }
    const key = sha(objType);
    if (generatedTypes[key]) return generatedTypes[key];
    return generatedTypes[key] = new GraphQLInputObjectType({
      name: context.replace(/\.([A-Za-z])/g, (_, c) => c.toUpperCase()) + 'InputObject',
      fields() {
        const fields = {};
        Object.keys(objType).forEach(key => {
          let type = objType[key];
          let defaultValue, description;
          if (typeof type === 'object') {
            type = type.type;
            defaultValue = type.defaultValue;
            description = type.description;
          }
          type = getType(type, context + '.' + key);
          fields[key] = {type, defaultValue, description};
        });
        return fields;
      },
    });
  }
  function getType(strType, context) {
    if (strType && typeof strType === 'object') {
      return getInputObjectType(strType, context);
    }
    if (strType === 'null') {
      return NullType;
    }
    if (strType[strType.length - 1] !== '?') {
      return new GraphQLNonNull(getType(strType + '?', context));
    }
    strType = strType.substr(0, strType.length - 1);
    if (strType[strType.length - 2] === '[' && strType[strType.length - 1] === ']') {
      return new GraphQLList(getType(strType.substr(0, strType.length - 2), context));
    }
    switch (strType) {
      case 'id':
        return GraphQLID;
      case 'boolean':
        return GraphQLBoolean;
      case 'float':
        return GraphQLFloat;
      case 'int':
        return GraphQLInt;
      case 'string':
        return GraphQLString;
    }
    if (strType in types) {
      return types[strType];
    }
    throw new Error('Unrecognised type "' + strType + '" for ' + context);
  }

  // custom scalar types are allowed to be built on top of strings
  if (input.scalars) {
    input.scalars.forEach(Scalar => {
      types[Scalar.name] = new GraphQLScalarType({
        name: Scalar.name,
        description: Scalar.description,
        serialize: Scalar.serialize,
        parseValue: Scalar.parseValue,
        parseLiteral: Scalar.parseLiteral || (
          Scalar.parseValue
          ? ast => {
            if (ast.kind === Kind.STRING) {
              return Scalar.parseValue(ast.value);
            }
            return null;
          }
          : undefined
        ),
      });
    });
  }

  // enums specify a short list of possible values
  if (input.enums) {
    input.enums.forEach(Enum => {
      const values = {};
      Object.keys(Enum.values).forEach(name => {
        if (Enum.values[name] === true) values[name] = {};
        else values[name] = Enum.values[name];
      });
      types[Enum.name] = new GraphQLEnumType({
        name: Enum.name,
        description: Enum.description,
        values,
      });
    });
  }

  // input objects have a collection of `fields`
  if (input.inputObjects || input['input-objects']) {
    (input.inputObjects || input['input-objects']).forEach(Type => {
      const key = sha(Type.fields);
      return generatedTypes[key] = new GraphQLInputObjectType({
        name: Type.name,
        description: Type.description,
        fields() {
          const fields = {};
          Object.keys(Type.fields).forEach(key => {
            let type = Type.fields[key];
            let defaultValue, description;
            if (typeof type === 'object') {
              type = type.type;
              defaultValue = type.defaultValue;
              description = type.description;
            }
            type = getType(type, context + '.' + key);
            fields[key] = {type, defaultValue, description};
          });
          return fields;
        },
      });
    });
  }

  // objects have `id`s and a collection of `fields`
  input.objects.forEach(Type => {
    types[Type.name] = new GraphQLObjectType({
      name: Type.name,
      description: Type.description,
      fields: () => {
        const res = {};
        if (!Type.fields.id) {
          if (Type.name === 'Query') {
            Type.fields.id = {
              type: 'id',
              resolve(node) {
                return 'QueryRoot';
              },
            };
          } else {
            Type.fields.id = {
              type: 'id',
              resolve(node) {
                if (typeof node.id !== 'string' && typeof node.id !== 'number') {
                  throw new Error('Node of type ' + Type.name + ' does not have an id');
                }
                return Type.name + ':' + node.id;
              },
            };
          }
        }
        Object.keys(Type.fields).forEach(name => {
          if (typeof Type.fields[name] === 'string') {
            Type.fields[name] = {type: Type.fields[name]};
          }
          if (Type.fields[name].args) {
            Object.keys(Type.fields[name].args).forEach(argName => {
              if (typeof Type.fields[name].args[argName] === 'string') {
                Type.fields[name].args[argName] = {type: Type.fields[name].args[argName]};
              }
              Type.fields[name].args[argName].type = getType(
                Type.fields[name].args[argName].type,
                Type.name + '.' + name + '.' + argName
              );
            });
          }
          Type.fields[name].type = getType(Type.fields[name].type, Type.name + '.' + name);
          res[name] = Type.fields[name];
        });
        return res;
      },
    });
  });

  return new GraphQLSchema({
    query: types.Query,
  });
}
