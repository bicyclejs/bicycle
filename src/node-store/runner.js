import Promise from 'promise';
import cp from 'character-parser';

export function runQuery(query, schema, context) {
  const result = {};

  function parseArgs(args, type) {
    let state = 'key';
    args = args.trim().substr(1); // ignore initial open bracket
    const result = {};
    let currentKey = '';
    let currentValue = '';
    let cpState = null;
    while (args.length) {
      switch (state) {
        case 'key':
          if (args[0] === ':') {
            state = 'value';
            cpState = cp.defaultState();
            currentKey = currentKey.trim();
            args = args.substr(1);
          } else {
            currentKey += args[0];
            args = args.substr(1);
          }
          break;
        case 'value':
          if (cpState.isNesting() || args[0] !== ')' && args[0] !== ',') {
            currentValue += args[0];
            cpState = cp.parseChar(args[0], cpState);
            args = args.substr(1);
          } else if (args[0] === ')') {
            if (currentKey.trim()) {
              result[currentKey] = currentValue.trim();
            }
            state = 'terminated';
            args = args.substr(1);
          } else {
            result[currentKey] = currentValue.trim();
            state = 'key';
            currentKey = '';
            currentValue = '';
            args = args.substr(1);
          }
          break;
        case 'terminated':
          throw new Error('Closing bracket was reached before end of arguments');
      }
    }
    const typedResult = {};
    Object.keys(result).map(key => {
      if (!type[key]) return;
      typedResult[key] = matchArgType(type[key].type, result[key], 'arg: ' + key);
    });
    return typedResult;
  }
  function matchArgType(type, value, errContext) {
    switch (type.kind) {
      case 'NotNull':
        if (value === '') throw new Error('Unexpected null value for ' + errContext);
        const result = matchArgType(type.type, value, errContext);
        if (result === null || result === undefined) throw new Error('Unexpected null value for ' + errContext);
        return result;
      case 'List':
        if (!Array.isArray(value)) {
          throw new Error('Expected an array for ' + errContext);
        }
        return value.map((v, i) => matchArgType(type.type, v, errContext + '[' + i + ']'));
      case 'NamedTypeReference':
        const namedType = schema[type.value];
        if (!namedType) throw new Error('Unrecognized type ' + type.value + ' for ' + errContext);
        switch (namedType.kind) {
          case 'ScalarType':
            return namedType.parse(value);
          default:
            console.log(namedType);
            throw new TypeError('Unrecognised named type kind ' + namedType.kind + ' for ' + errContext);
        }
        break;
      default:
        console.log(type);
        throw new TypeError('Unrecognised arg type kind ' + type.kind + ' for ' + errContext);
    }
  }
  function matchType(type, value, subQuery, errContext) {
    switch (type.kind) {
      case 'NotNull':
        if (value === null || value === undefined) throw new Error('Unexpected null value for ' + errContext);
        return Promise.resolve(matchType(type.type, value, subQuery, errContext)).then(
          result => {
            if (result === null || result === undefined) throw new Error('Unexpected null value for ' + errContext);
            return result;
          }
        );
      case 'List':
        if (!Array.isArray(value)) {
          throw new Error('Expected an array for ' + errContext);
        }
        return Promise.all(value.map((v, i) => matchType(type.type, v, subQuery, errContext + '[' + i + ']')));
      case 'NamedTypeReference':
        const namedType = schema[type.value];
        if (!namedType) throw new Error('Unrecognized type ' + type.value + ' for ' + errContext);
        switch (namedType.kind) {
          case 'NodeType':
            return run(subQuery, namedType, value);
          case 'ScalarType':
            return namedType.serialize(value);
          default:
            console.log(namedType);
            throw new TypeError('Unrecognised named type kind ' + namedType.kind + ' for ' + errContext);
        }
        break;
      default:
        console.log(type);
        throw new TypeError('Unrecognised field type kind ' + type.kind + ' for ' + errContext);
    }
  }
  function resolve(type, value, name, subQuery) {
    const fname = name.split('(')[0];
    const args = name.indexOf('(') !== -1 ? '(' + name.split('(').slice(1).join('(') : '()';
    return Promise.resolve(null).then(() => {
      if (type.fields[fname].resolve) {
        const argsObj = parseArgs(args, type.fields[fname].args);
        return type.fields[fname].resolve(value, argsObj, context);
      } else if (type.fields[fname]) {
        return value[fname];
      }
    }).then(value => {
      return matchType(type.fields[fname].type, value, subQuery, type.name + '.' + name);
    });
  }
  function run(query, type, value) {
    return Promise.resolve(null).then(() => type.id(value)).then(id => {
      if (!result[id]) result[id] = {};
      return Promise.all(
        Object.keys(query).map(key => {
          return resolve(type, value, key, query[key]).then(value => {
            result[id][key] = value;
          });
        }),
      ).then(() => id);
    });
  }
  return run(query, schema.root, context).then(() => result);
}

export function runMutation(mutation, schema, context) {
  const [type, name] = mutation.method.split('.');
  const args = mutation.args;
  const Type = schema[type];
  if (!Type) throw new TypeError('Unrecognised type for mutation: ' + type);
  if (!Type.mutations) throw new TypeError('The type ' + type + ' does not define any mutations.');
  console.dir(mutation);
}
