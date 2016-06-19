import assert from 'assert';
import freeze from 'bicycle/utils/freeze';
import typeName from 'bicycle/utils/type-name-from-value';
import getType from './get-type';

function normalizeObject(Type) {
  assert(
    Type && typeof Type === 'object' && !Array.isArray(Type),
    `Expected ObjectType to be an object but got ${typeName(Type)}`
  );
  assert(
    typeof Type.name === 'string',
    `Expected ObjectType.name to be a string but got ${typeName(Type.name)}`
  );
  assert(
    /^[A-Za-z]+$/.test(Type.name),
    `Expected ObjectType.name to match [A-Za-z]+ but got '${Type.name}'`,
  );
  assert(
    Type.id === undefined || typeof Type.id === 'function',
    `Expected ${Type.name}.id to be a function but got ${typeName(Type.id)}`
  );
  assert(
    Type.description === undefined || typeof Type.description === 'string',
    `Expected ${Type.name}.description to be a string but got ${typeName(Type.description)}`
  );
  assert(
    Type.fields && typeof Type.fields === 'object',
    `Expected ${Type.name}.fields to be an object but got ${typeName(Type.fields)}`
  );
  assert(
    Type.mutations === undefined || typeof Type.mutations === 'object',
    `Expected ${Type.name}.mutations to be an object but got ${typeName(Type.mutations)}`
  );
  assert(
    Type.name !== 'Root' || Type.id === undefined,
    `The Root object always has an ID of "root".  You don't need to specify an id function yourself`
  );

  let idGetter = Type.id;
  const fields = {};
  const mutations = {};
  if (!idGetter) {
    if (Type.name === 'Root') {
      idGetter = () => 'root';
    } else {
      idGetter = (node) => {
        if (typeof node.id !== 'string' && typeof node.id !== 'number') {
          if (node.id === undefined || node.id === null) {
            throw new Error('Node of type ' + Type.name + ' does not have an id');
          } else {
            throw new Error(
              'Expected node of type ' + Type.name +
              ' to have either a string or number for the "id" but got "' + typeName(node.id) + '"'
            );
          }
        }
        return Type.name + ':' + node.id;
      };
    }
  }
  Object.keys(Type.fields).forEach(name => {
    let field = Type.fields[name];
    if (field === undefined) return;
    assert(
      /^[A-Za-z]+$/.test(name),
      `Expected ${Type.name}'s field names to match [A-Za-z0-9]+ but got '${name}'`,
    );
    if (typeof field === 'string') {
      field = {type: field};
    }
    assert(
      typeof field === 'object',
      `Expected ${Type.name}.${name} to be an object or a string but got ${typeName(field)}`
    );
    assert(
      typeof field.type === 'string',
      `Expected ${Type.name}.${name}.type to be a string but got ${typeName(field.type)}`
    );
    assert(
      field.args === undefined || (field.args && typeof field.args === 'object'),
      `Expected ${Type.name}.${name}.args to be an object but got ${typeName(field.args)}`
    );
    if (field.args !== undefined) {
      const args = {};
      Object.keys(field.args).forEach(argName => {
        args[argName].type = getType(field.args[argName]);
      });
      field = {
        ...field,
        args,
      };
    }
    fields[name] = {...field, type: getType(field.type)};
  });
  if (Type.mutations) {
    Object.keys(Type.mutations).forEach(name => {
      if (name === 'set') {
        mutations[name] = Type.mutations[name];
        if (typeof mutations[name] !== 'function') {
          throw new Error(
            'The `set` mutation is a special case, it automatically takes `id`, `field` and `value`. ' +
            'You don\'t need to specify argument types for it so you should just use a function as shorthand. ' +
            `Look in ${Type.name}.mutations.set to fix this.`
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
  return freeze({
    kind: 'NodeType',
    name: Type.name,
    id: idGetter,
    description: Type.description,
    fields,
    mutations,
  });
}

export default normalizeObject;
