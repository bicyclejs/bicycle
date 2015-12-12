'use strict'

require('babel/register');

var assert = require('assert');
var Promise = require('promise');
var isPromise = require('is-promise');
var github = require('github-basic');
var client = github({version: 3});

var root = require('./example/api').root;
var query = require('./src/server').query;

var val = query(
  root,
  {
    'Repository("jadejs/jade")': {
      fullName: true,
      name: true,
      owner: {login: true},
      stargazers: {login: true}
    }
  }, // query
  {client: client} // context
);

val.done(function (repo) {
  console.dir(repo, {depth: 10, colors: true});
});
