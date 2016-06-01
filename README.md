# Mindhive's base Meteor package

## Install

1. `npm install --save @mindhive/meteor`
2. `meteor add meteorhacks:unblock`
3. `meteor add aldeed:collection2`

## How to use this
 
- See our [example webapp](https://github.com/mindhivenz/todos-basis-webapp)

## Dependency injection 

See our [DI package](https://github.com/mindhivenz/di-js).

This package also makes Meteor core services available in the appContext:
 
- Meteor
- Tracker
- Mongo: to create Mongo collections
- Users: Meteor's `users` Mongo collection
- [SimpleSchema](https://github.com/aldeed/meteor-collection2)
- apiRegistry: see below

## ApiRegistry

Rather than calling `Meteor.methods` and `Meteor.publish` to create methods and publications
inject `apiRegistry`. This has a cleaner callback (no use of `this`), calls 
[unblock](https://github.com/meteorhacks/unblock), and facilitates domain testing (see below).

## Domain tests

An [example domain test](https://github.com/mindhivenz/todos-basis-webapp/blob/master/tests/specs/domain/tasks.spec.js).

- Use `test.mockInitModules` to initialise modules in test
- From the returned context get the mock `apiRegistry` which can `call` and `subscribe` to methods and publications
  in the modules being tested
- Use `test.MiniMongo` to use in memory Mongo instead of on disk
