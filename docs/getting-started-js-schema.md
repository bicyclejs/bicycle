---
id: getting-started-js-schema
title: Getting Started - JavaScript Schema
sidebar_label: Schema
---

Bicycle Schemas consist of two types:

- objects - these represent the domain objects in your data model, e.g. User, BlogPost, Task etc.
- scalars - these represent raw values, e.g. string, number, email-address.

## Scalars

Creating custom scalars allows you to define custom validation on values. For example, you could validate that a string is an e-mail address, or that a number is an integer. Bicycle comes with the following built in scalar types:

 - `boolean` - either `true` or `false`
 - `string` - any string of text, e.g. `'Hello World'`
 - `number` - any valid JavaScript number, e.g. `0`, `42` or `-4.5`
 - `void` - the JavaScript value `undefined`
 - `null` - the JavaScript value `null`
 - `any` - can be literally any JSON value, including objects, arrays etc. No validation will be provided.




