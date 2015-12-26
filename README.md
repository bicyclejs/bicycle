# bicycle

A data synchronisation library for JavaScript

[![Build Status](https://img.shields.io/travis/bicyclejs/bicycle/master.svg)](https://travis-ci.org/bicyclejs/bicycle)
[![Dependency Status](https://img.shields.io/david/bicyclejs/bicycle.svg)](https://david-dm.org/bicyclejs/bicycle)
[![NPM version](https://img.shields.io/npm/v/bicycle.svg)](https://www.npmjs.org/package/bicycle)

## Installation

    npm install bicycle

## Client API

APIs:

```
// server side
get(id, context) => Promise<Node>
query(obj, context) => Promise<Array<id>>
```

client:

```
{
  fields: {
    name: {args: [], subFields: null}
  }
}
client.get(id)


client.set(NodeID, property, value) => Promise // optimisticly set value of property on node, wraps `.mutate`
client.mutate(name, args, optimisticUpdate?) => Promise

client.query(obj, fn(ns: Array<Node>)) => Function(unsubscribe)
```

session state:

 - versions: `Map<NodeID, VersionID>` - the versions of nodes currently on the client
 -

## License

  MIT
