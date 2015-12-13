import objectKey from '../object-key';

function read(cache, root, id, query, params, extras) {
  let result = {_id: id, _loading: false};
  if (!root) {
    result._loading = true;
    extras.onNotLoaded(id);
    return result;
  }
  query.forEach(field => {
    var key = (
      (field.arg === undefined || Object.keys(field.arg).length === 0)
      ? ''
      : '_' + objectKey(
        field.arg,
        arg => typeof arg === 'object' && arg && typeof arg.$param === 'string'
            ? params[arg.$param]
            : arg
      )
    );
    let value = root[field.name + key];
    if (value === undefined) {
      result._loading = true;
      extras.onNotLoaded(id, field.alias || field.name);
      return;
    }
    if (field.fields) {
      result[field.alias || field.name] = Array.isArray(value)
        ? value.map(value => read(cache, cache[value], value, field.fields, params, extras))
        : read(cache, cache[value], value, field.fields, params, extras)
    } else {
      result[field.alias || field.name] = value;
    }
  });
  return result;
}

export default function readCache(cache, query, params) {
  let loaded = true;
  let nodes = [];
  let result = read(cache, cache.root, 'root', query, params, {
    onNotLoaded() { loaded = false },
    onNode(id) { if (nodes.indexOf(id) === -1) nodes.push(id); },
  });
  return {loaded: loaded, result: result, nodes};
}
/*
let query = [
  {name: 'user', arg: {}, fields: [{name: 'name'}, {name: 'dob'}]},
  {name: 'userById', arg: {id: 'ForbesLindesay'}, fields: [{name: 'name'}], alias: 'ForbesLindesay'},
  {name: 'userById', arg: {id: {$param: 'SecondUser'}}, fields: [{name: 'name'}], alias: 'SecondUser'},
  {name: 'allUsers', arg: {}, fields: [{name: 'name'}]},
];
let cache = { 'User:ForbesLindesay': { name: 'Forbes Lindesay', dob: '1992-06-11' },
  'User:JohnSmith': { name: 'John Smith' },
  root:
   { user: 'User:ForbesLindesay',
     userById_ot4669: 'User:ForbesLindesay',
     userById_ct8c82: 'User:JohnSmith',
     allUsers: [ 'User:ForbesLindesay', 'User:JohnSmith' ] } };
console.dir(readCache(cache, query, {SecondUser: 'JohnSmith'}), {depth: 10, colors: true});
*/
