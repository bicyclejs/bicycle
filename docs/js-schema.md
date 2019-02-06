---
id: js-schema
title: JavaScript Schema
sidebar_label: Schema
---

Bicycle Schemas consist of two types:

- objects - these represent the domain objects in your data model, e.g. User, BlogPost, Task etc.
- scalars - these represent raw values, e.g. string, number, email-address.

## Type

Types are used in a number of places in a Bicycle Schema. All types default to being non-nullable. You can refer to types by name, e.g.:

- `'string'` - a string, e.g. `'Hello World'`
- `'number'` - a number, e.g. `43.5`
- `'boolean'` - `true` or `false

You can mark a type as nullable by appending a `?`:

- `'string?'` - a `string` or `null` or `undefined`
- `'number?'` - a `number` or `null` or `undefined`
- `'boolean?'` - `true` or `false` or `null` or `undefined`

You can specify an array of a type by appending `[]`:

- `'string[]` - an array of `string`s
- `'number[]` - an array of `number`s

N.B. when combining these:

- `'string[]?` - either `null` or an array of `string`s
- `'string?[]` - an array of values where each value is either a `string` or `null`.
- `'string?[]?` - either `null` or an array of values where each value is either a `string` or `null`.

You can also combine multiple values of different types into an object, e.g.

- `{a: 'string', b: 'number'}` is an object with a property `a` that is a `string` and a property `b` that is a `number`. e.g. `{a: 'Hello World', b: 43.5}`

## Scalars

Creating custom scalars allows you to define custom validation on values. For example, you could validate that a string is an e-mail address, or that a number is an integer. Bicycle comes with the following built in scalar types:

 - `boolean` - either `true` or `false`
 - `string` - any string of text, e.g. `'Hello World'`
 - `number` - any valid JavaScript number, e.g. `0`, `42` or `-4.5`
 - `void` - the JavaScript value `undefined`
 - `null` - the JavaScript value `null`
 - `any` - can be literally any JSON value, including objects, arrays etc. No validation will be provided.

### Custom Scalars

To define a custom scalar, add a file in `bicycle-schema/scalars/` that exports an object with the following properties:

- `name` - A string of letters with no spaces. Must be unique across both scalar and object names.
- `description` - An optional description for the scalar, which may be shown in developer tools and generated documentation for the schema.
- `baseType` - A `Type` that this scalar is based on. You can use another custom scalar or a built in scalar. Use `any` if you do not want any validation called before calling your `validate` function.
- `validate` - An optional validation function, that should take a value and return `true` if the value is vaid, or `false` if the value is not valid. This is called after validating the `baseType`.

Some useful examples:

```js
import isValidEmail from 'sane-email-validation';

export default {
  name: 'email',
  description: 'an email address',
  baseType: 'string',
  validate(email) {
    return isValidEmail(email);
  }
}
```

```js
export default {
  name: 'integer',
  description: 'a whole number',
  baseType: 'number',
  validate(value) {
    return (
      value > Number.MIN_SAFE_INTEGER &&
      value < Number.MAX_SAFE_INTEGER &&
      value === Math.floor(value)
    );
  }
}
```

```js
export default {
  name: 'address',
  description: 'a street address',
  baseType: {
    line1: 'string',
    line2: 'string?',
    country: 'string',
    zipCode: 'string',
  },
}
```

## Objects

To define an Object, add a file in `bicycle-schema/objects/` that exports an object with the following properties:

- `name` - A string of letters with no spaces. Must be unique across both scalar and object names.
- `description` - An optional description for the object, which may be shown in developer tools and generated documentation for the schema.
- `id` - optionally override the default method for getting the id
- `fields` - an optional set of queriable fields for the object
- `mutations` - an optional set of callable methods for the object

With the exception of the `Root` Object, Bicycle Objects all have a "value", that is typically a plain JavaScript object. You can expose fields from this value directly, by simply specifying their type, or you can expose "resolvers" that expose derived values from a field.

### The Root Object

Every schema must have an object with the name `Root`. This is where all queries must start. `Root` objects cannot specify a method for `id`, as the `Root` object always has an id of `'root'`.

### Object.id

The `id` property allows you to customise the `id` of an object. If provided, it should be a function that returns a unique `string` or `number` for the given object. These `id` values do not need to be globally unique, just unique within the given Object type. By default, we just use the `.id` property of the underlying "value" for this Bicycle Object.

To customise the id property, you can do something like:

```js
export default {
  name: 'Person',
  id: person => person.uid,
  fields: {
    uid: 'string',
    name: 'string',
  },
};
```

The default is `node => node.id`.

### Object.fields

This specifies the queriable fields. You can mix and match calculated fields, and simply exposing properties of the underlying object

```js
export default {
  name: 'Egg',
  fields {
    isCooked: 'boolean',
    isRaw: {
      type: 'boolean',
      resolve(egg) {
        return !egg.isCooked;
      }
    }
  }
}
```

Field Names must be made up of just letters and numbers. They should either be Type strings, or objects with:

- `type` - The type of the field's value
- `description` - An optional description for the field, which may be shown in developer tools and generated documentation for the schema.
- `args` - An optional type for the `args` passed to the field's resolver. If you wish to pass multiple arguments to a single field, you can use an object type.
- `auth` - An optional function that receives the `value`, `args` and `context` and returns `true` if the user has access to the field. It defaults to 'public', i.e. anyone who can see this object, can query this field.
- `resolve` - An optional function that receives the `value`, `args` and `context` and returns the field's value. It defaults to extracting the named property from the value.

Both `auth` and `resovle` can be asynchronous and return a `Promise`, which allows you to query a database if needed. The `context` should contain information about the authenticated user who is running the query, making it simple to control access to the field via the `auth` function.

### Object.mutations

Although `mutations` live under Bicycle Objects, the Object they're attached to has no practical meaning, it's just a way of namespaceing the mutations and keeping the code for modifying an object close to the code for querying an object. It's important to note that unless you specify an `auth` function, anyone can call any mutation.

#### The `set` mutation

The `set` mutation is a special case. It is purely a function that takes `args` and `context` where `args` is an object with three properties:

- `id` - either a `string` or a `number`
- `field` - one of the queriable field names for the object
- `value` - a value of the type that corresponds to the supplied field.

```js
export default {
  name: 'Team',
  fields {
    id: 'number',
    name: 'string',
    score: 'number',
  },
  mutations: {
    set: async ({id, field, value}, ctx) => {
      // | {id: number | string, field: 'id', value: number}
      // | {id: number | string, field: 'name', value: string}
      // | {id: number | string, field: 'score', value: number}
      if (field === 'id') {
        throw new Error('You cannot modify a team\'s id');
      }
      await db.query(
        sql`
          UPDATE team
          SET (${sql.field(field)} = ${value})
          WHERE id=${id}
        `,
      );
    },
  },
}
```

#### Normal mutations

Normal mutations are represented by an object with the following properties:

- `type` - The return type of the mutation
- `description` - An optional description for the mutation, which may be shown in developer tools and generated documentation for the schema.
- `args` - An optional type for the `args` passed to the mutation's resolver. If you wish to pass multiple arguments to a single mutation, you can use an object type.
- `auth` - An optional function that receives the `args` and `context` and returns `true` if the user can call this mutation. It defaults to 'public', i.e. anyone can call this muation.
- `resolve` - A function that receives the `args` and `context` and applies the mutation to the data store. It can optionally return a value if a `type` was specified.

e.g.

```js
export default {
  name: 'Egg',
  fields {
    isCooked: 'boolean',
    isRaw: {
      type: 'boolean',
      resolve(egg) {
        return !egg.isCooked;
      },
    },
  },
  mutations: {
    cook: {
      args: 'string',
      async resolve(id) {
        // cook the egg
      },
    },
    uncook: {
      args: 'string',
      async auth(id, ctx) {
        // only god can un-cook an egg
        return ctx.user && ctx.user.isGod();
      },
      async resolve(id) {
        // uncook the egg
      },
    },
    setCooked: {
      args: {id: 'string', cooked: 'boolean'},
      async auth({id, cooked}, ctx) {
        // only god can un-cook an egg, but anyone can cook an egg
        return cooked || (ctx.user && ctx.user.isGod());
      },
      async resolve({id, cooked}) {
        if (cooked) {
          // cook the egg
        } else {
          // uncook the egg
        }
      },
    },
  },
}
```
