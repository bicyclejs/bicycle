import assert from 'assert';
import Promise from 'promise';
import isPromise from 'is-promise';

function getId(value, type) {
  return JSON.stringify([type._name, value[type._id]]);
}
function getDescriptor(type, name) {
  var descriptor = type[name];
  if (!descriptor) return null;
  if (!descriptor.resolve && !descriptor.from) {
    descriptor.from = name;
  }
  return descriptor;
}
function fetchValue(descriptor, self, args, ctx) {
  var value;
  if (descriptor.resolve) {
    value = descriptor.resolve(self, args, ctx);
  } else {
    value = self[descriptor.from];
  }
  return value;
}
function normaliseValue(objectsById, descriptor, value, query, ctx) {
  //console.dir(descriptor);
  if (descriptor.type === 'Collection') {
    return Promise.all(
      value.items.map(function (v) {
        if (typeof descriptor.of === 'object') {
          var id = getId(v, descriptor.of);
          v = normaliseValue(objectsById, {type: descriptor.of}, v, query, ctx);
          if (isPromise(v)) {
            return v.then(function (v) {
              objectsById[id] = v;
              return {_id: id};
            });
          } else {
            objectsById[id] = v;
            return {_id: id};
          }
        } else {
          assert(typeof v === descriptor.of.toLowerCase());
          return v;
        }
      })
    ).then(function (items) {
      return {items: items, nextToken: value.nextToken};
    });
  } else if (typeof descriptor.type === 'string') {
    try {
      assert(typeof value === descriptor.type.toLowerCase());
    } catch (ex) {
      console.dir(value);
      console.dir(descriptor.type);
      throw ex;
    }
    return value;
  } else {
    var result = {};
    var pending = [];
    Object.keys(query).forEach(function (key) {
      var fullKey = key;
      var subQuery = query[key];
      key = key.split('(');
      var args = key[1] ? JSON.parse('[' + key[1].substr(0, key[1].length - 1) + ']') : [];
      key = key[0];
      var d = getDescriptor(descriptor.type, key);
      if (d) { // ignore requests for fields that don't exist
        var id;
        var rawValue = fetchValue(d, value, args, ctx);
        if (isPromise(rawValue)) {
          pending.push(rawValue.then(onRawValue));
        } else {
          var r = onRawValue(rawValue);
          if (r) pending.push(r);
        }
      }
      function onRawValue(rawValue) {
        var v = normaliseValue(objectsById, d, rawValue, subQuery, ctx);
        if (isPromise(v)) {
          return v.then(function (v) { onValue(rawValue, v); });
        } else {
          onValue(rawValue, v);
        }
      }
      function onValue(rawValue, normalisedValue) {
        if (typeof d.type === 'object') {
          var id = getId(rawValue, d.type);
          result[fullKey] = {_id: id};
          objectsById[id] = normalisedValue;
        } else {
          result[fullKey] = normalisedValue;
        }
      }
    });
    if (pending.length) {
      return Promise.all(pending).then(function () {
        return result;
      });
    }
    return result;
  }
}

export function query(root, query, context) {
  var objectsById = {};
  return normaliseValue(
    objectsById,
    {type: root},
    context,
    query,
    context
  ).then(function (root) {
    objectsById.root = root;
    return objectsById;
  });
};
