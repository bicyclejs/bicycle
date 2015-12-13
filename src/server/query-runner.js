import Promise from 'promise';
import objectKey from '../object-key';

// query is array of fields
// each field is {name, arg, fields}

// root is {type: 'node', getId: getId, fields: fields}
function run(root, ctx, rootSchema, schema, query, result) {
  let id;
  return Promise.resolve(null).then(() => {
    return Promise.all(
      [
        rootSchema.getId(root, ctx),
      ].concat(query.map((field) => {
        let {type, argType, fn} = rootSchema.fields[field.name];
        return Promise.resolve(null).then(() => {
          return validateType(field.arg, argType || {}, schema);
        }).then(arg => {
          return fn(root, arg, ctx);
        }).then(value => {
          let optional = type[0] === '?';
          let isArray = /\[\]$/.test(type);
          if (optional) type = type.substr(1);
          if (isArray) type = type.replace(/\[\]$/, '');
          if (/^[a-z]/.test(type)) {
            // validate scalar
            return validateType(value, type, {optional, isArray}, schema);
          } else {
            if (optional && value === null) return null;
            if (isArray) {
              if (!Array.isArray(value)) throw new Error('Expected an array');
              return Promise.all(value.map(
                value => run(value, ctx, schema[type], schema, field.fields, result)
              ));
            }
            // query child node and return "node id"
            return run(value, ctx, schema[type], schema, field.fields, result);
          }
        }).then(finalValue => {
          var key = (
            (field.arg === undefined || Object.keys(field.arg).length === 0)
            ? ''
            : '_' + objectKey(field.arg)
          );
          return {name: field.name + key, value: finalValue};
        });
      }))
    );
  }).then(([id, ...fields]) => {
    let fieldsObj = result[id] || (result[id] = {});
    fields.forEach(field => {
      fieldsObj[field.name] = field.value;
    });
    return id;
  });
}

function validateType(value, type, {optional, isArray}, schema) {
  // TODO: validate type
  return value;
}

export default function runQuery(schema, root, context, query) {
  let result = {};
  return run(root, context, schema.Root, schema, query, result).then(id => {
    if (id !== 'root') {
      console.dir(id);
      console.dir(id !== 'root');
      throw new Error('The root node must have an id of "root" but got "' + id + '"');
    }
    return result;
  });
}
