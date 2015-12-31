import BUILT_IN_SCALARS from './scalars';

export default function (input: Object) {
  const types = {};
  function getInputObjectType(objType, context) {
    if (
      Object.keys(objType).length === 1 &&
      Object.keys(objType)[0] === 'listOf' &&
      typeof objType.listOf === 'object'
    ) {
      return {kind: 'List', type: getType(objType.listOf)};
    }
    const fields = {};
    Object.keys(objType).forEach(key => {
      let type = objType[key];
      let defaultValue, description;
      if (typeof type === 'object') {
        defaultValue = type.defaultValue;
        description = type.description;
        type = type.type;
      }
      type = getType(type, context + '.' + key);
      fields[key] = {type, defaultValue, description};
    });
    return {
      kind: 'InputObjectType',
      name: context.replace(/\.([A-Za-z])/g, (_, c) => c.toUpperCase()) + 'InputObject',
      fields,
    };
  }
  function getType(strType, context) {
    if (strType && typeof strType === 'object') {
      return getInputObjectType(strType, context);
    }
    if (strType[strType.length - 1] !== '?') {
      return {kind: 'NotNull', type: getType(strType + '?', context)};
    }
    strType = strType.substr(0, strType.length - 1);
    if (strType[strType.length - 2] === '[' && strType[strType.length - 1] === ']') {
      return {kind: 'List', type: getType(strType.substr(0, strType.length - 2), context)};
    }
    return {kind: 'NamedTypeReference', value: strType};
  }

  // custom scalar types are allowed to be built on top of strings
  if (input.scalars) {
    input.scalars.forEach(Scalar => {
      types[Scalar.name] = {
        kind: 'ScalarType',
        name: Scalar.name,
        description: Scalar.description,
        // serialize into something JSONable for a response
        serialize: Scalar.serialize,
        // parse from a string in a param
        parse: Scalar.parse,
        // parse from an object in a mutation
        parseValue: Scalar.parseValue,
      };
    });
  }
  BUILT_IN_SCALARS.forEach(Scalar => {
    types[Scalar.name] = {
      kind: 'ScalarType',
      name: Scalar.name,
      description: Scalar.description,
      serialize: Scalar.serialize,
      parse: Scalar.parse,
      parseValue: Scalar.parseValue,
    };
  });

  // enums specify a short list of possible values
  if (input.enums) {
    input.enums.forEach(Enum => {
      const values = {};
      Object.keys(Enum.values).forEach(name => {
        if (Enum.values[name] === true) values[name] = {value: name};
        else values[name] = {value: name, ...Enum.values[name]};
      });
      types[Enum.name] = {
        kind: 'EnumType',
        name: Enum.name,
        description: Enum.description,
        values,
      };
    });
  }

  // input objects have a collection of `fields`
  if (input.inputObjects || input['input-objects']) {
    (input.inputObjects || input['input-objects']).forEach(Type => {
      const fields = {};
      Object.keys(Type.fields).forEach(key => {
        let type = Type.fields[key];
        let defaultValue, description;
        if (typeof type === 'object') {
          defaultValue = type.defaultValue;
          description = type.description;
          type = type.type;
        }
        type = getType(type, context + '.' + key);
        fields[key] = {type, defaultValue, description};
      });
      return {
        kind: 'InputObjectType',
        name: Type.name,
        description: Type.description,
        fields,
      };
    });
  }

  // objects have `id`s and a collection of `fields`
  input.objects.forEach(Type => {
    let idGetter = Type.id;
    const fields = {};
    const mutations = {};
    if (!idGetter) {
      if (Type.name === 'Root') {
        idGetter = () => 'root';
      } else {
        idGetter = (node) => {
          if (typeof node.id !== 'string' && typeof node.id !== 'number') {
            throw new Error('Node of type ' + Type.name + ' does not have an id');
          }
          return Type.name + ':' + node.id;
        };
      }
    }
    Object.keys(Type.fields).forEach(name => {
      let field = Type.fields[name];
      if (field === undefined) return;
      if (typeof field === 'string') {
        field = {type: field};
      }
      if (field.args) {
        const args = {...field.args};
        Object.keys(args).forEach(argName => {
          if (typeof args[argName] === 'string') {
            args[argName] = {type: args[argName]};
          }
          args[argName].type = getType(
            args[argName].type,
            Type.name + '.' + name + '.' + argName
          );
        });
        field = {
          ...field,
          args,
        };
      }
      field = {...field, type: getType(field.type, Type.name + '.' + name)};
      fields[name] = field;
    });
    if (Type.mutations) {
      Object.keys(Type.mutations).forEach(name => {
        if (name === 'set') {
          mutations[name] = Type.mutations[name];
          if (typeof mutations[name] !== 'function') {
            throw new Error(
              'The `set` mutation is a special case, it automatically takes `id`, `field` and `value`. ' +
              'You don\'t need to specify argument types for it so you should just use a function as shorthand.'
            );
          }
          return;
        }
        let mutation = Type.mutations[name];
        const args = {...mutation.args};
        Object.keys(args).forEach(argName => {
          if (typeof args[argName] === 'string') {
            args[argName] = {type: args[argName]};
          }
          args[argName].type = getType(
            args[argName].type,
            Type.name + '.' + name + '.' + argName
          );
        });
        mutation = {
          ...mutation,
          args,
        };
        mutations[name] = mutation;
      });
    }
    types[Type.name] = {
      kind: 'NodeType',
      name: Type.name,
      id: idGetter,
      description: Type.description,
      fields,
      mutations,
    };
  });
  return types;
}
