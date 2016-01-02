import Promise from 'promise';
import cp from 'character-parser';

function typeString(type) {
  switch (type.kind) {
    case 'NotNull':
      return 'NotNull<' + typeString(type.type) + '>';
    case 'List':
      return 'Array<' + typeString(type.type) + '>';
    case 'NamedTypeReference':
      return type.value;
  }
}
function getArgTypeMatcher(schema: Object) {
  return function matchArgType(type, value, errContext) {
    switch (type.kind) {
      case 'NotNull':
        if (value === null) {
          throw new Error('Expected ' + typeString(type) + ' but got ' + value);
        }
        const result = matchArgType(type.type, value, errContext);
        if (result === null || result === undefined) {
          throw new Error('Expected ' + typeString(type) + ' but got ' + value);
        }
        return result;
      case 'List':
        if (value === null) return null;
        if (!Array.isArray(value)) {
          throw new Error('Expected an array for ' + errContext);
        }
        return value.map((v, i) => matchArgType(type.type, v, errContext + '[' + i + ']'));
      case 'NamedTypeReference':
        if (value === 'null' || value === 'undefined') return null;
        const namedType = schema[type.value];
        if (!namedType) throw new Error('Unrecognized type ' + type.value + ' for ' + errContext);
        switch (namedType.kind) {
          case 'ScalarType':
            try {
              if (value === null) return null;
              return namedType.parse(value);
            } catch (ex) {
              throw new Error('Expected ' + type.value + ' but got "' + value.trim() + '" for ' + errContext);
            }
            break;
          default:
            console.log(namedType);
            throw new TypeError('Unrecognised named type kind ' + namedType.kind + ' for ' + errContext);
        }
        break;
      default:
        console.log(type);
        throw new TypeError('Unrecognised arg type kind ' + type.kind + ' for ' + errContext);
    }
  };
}

export function runQuery(query: Object, schema: Object, context: any): Promise<Object> {
  const result = {};
  const matchArgType = getArgTypeMatcher(schema);

  function parseArgs(args: string, type: Object) {
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
    Object.keys(type).map(key => {
      typedResult[key] = matchArgType(
        type[key].type,
        (result[key] === 'undefined' || !result[key]) ? null : JSON.parse(result[key]),
        'arg: ' + key
      );
    });
    return typedResult;
  }
  function matchType(type: {kind: string}, value: any, subQuery, errContext: string) {
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
        if (value === null || value === undefined) return null;
        if (!Array.isArray(value)) {
          throw new Error('Expected an array for ' + errContext);
        }
        return Promise.all(value.map((v, i) => matchType(type.type, v, subQuery, errContext + '[' + i + ']')));
      case 'NamedTypeReference':
        if (value === null || value === undefined) return null;
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
  function resolve(type: {fields: Object}, value: any, name: string, subQuery) {
    const fname = name.split('(')[0];
    const args = name.indexOf('(') !== -1 ? '(' + name.split('(').slice(1).join('(') : '()';
    return Promise.resolve(null).then(() => {
      if (!type.fields[fname]) {
        throw new Error('Field "' + fname + '" does not exit on type "' + type.name + '"');
      } else if (type.fields[fname].resolve) {
        const argsObj = parseArgs(args, type.fields[fname].args);
        return type.fields[fname].resolve(value, argsObj, context);
      } else if (type.fields[fname]) {
        return value[fname];
      }
    }).then(value => {
      return matchType(type.fields[fname].type, value, subQuery, type.name + '.' + name);
    });
  }
  function run(query: Object, type: Object, value: any) {
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
  return run(query, schema.Root, context).then(() => result);
}

export function runMutation(mutation: {method: string, args: Object}, schema: Object, context: any): Promise {
  const matchArgType = getArgTypeMatcher(schema);
  const [type, name] = mutation.method.split('.');
  const args = mutation.args;
  const Type = schema[type];
  if (!Type) throw new TypeError('Unrecognised type for mutation: ' + type);
  if (!Type.mutations) throw new TypeError('The type ' + type + ' does not define any mutations.');
  const method = Type.mutations[name];
  if (!method) throw new TypeError('The type ' + type + ' does not define a mutation ' + name);

  const typedArgs = {};
  if (name === 'set') {
    if (typeof args.id !== 'number' && typeof args.id !== 'string') {
      return Promise.reject(
        new Error('Expected number or string for ' + mutation.method + '(id)')
      );
    }
    typedArgs.id = args.id;
    if (typeof args.field !== 'string') {
      return Promise.reject(
        new Error('Expected string for ' + mutation.method + '(field)')
      );
    }
    if (!(args.field in Type.fields)) {
      return Promise.reject(
        new Error(args.field + ' was not found in ' + Type.name)
      );
    }
    typedArgs.field = args.field;
    typedArgs.value = matchArgType(
      Type.fields[args.field].type,
      args.value === undefined ? null : args.value,
      type + '.' + name + ' - ' + args.field
    );
    return Promise.resolve(method(typedArgs, context));
  } else {
    Object.keys(method.args).forEach(key => {
      typedArgs[key] = matchArgType(
        method.args[key].type,
        args[key] === undefined ? null : args[key],
        type + '.' + name + ' - ' + key
      );
    });
    return Promise.resolve(method.resolve(typedArgs, context));
  }
}
