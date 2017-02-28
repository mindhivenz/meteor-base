
# Mindhive's base Meteor package

## Install

1. `npm install --save @mindhive/meteor`
2. `meteor add meteorhacks:unblock`

### Meteor package peer dependencies (optional)

1. `FocusedView`: `meteor add ejson`
2. `backdoorModule`: `meteor add xolvio:backdoor`
3. `SimpleSchema`: `meteor add aldeed:collection2-core`
4. `apiRegistry.publishComposite`: `meteor add reywood:publish-composite`
5. client `timeModule`: `meteor add mizzao:timesync` (optional, will default to local machine time otherwise)
6. `hasRole`: `meteor add alanning:roles`
7. `offlineModule`: `meteor add ground:db@2.0.0-rc.7`
8. `appStoreDomain`: `meteor add cordova:cordova-plugin-device`,  
 	`meteor add cordova:cordova-plugin-appinfo` and
 	`meteor add cordova:cordova-plugin-market`

## How to use this
 
- See our [example webapp](https://github.com/mindhivenz/todos-basis-webapp)

## Dependency injection 

See our [DI package](https://github.com/mindhivenz/di-js).

This package also makes Meteor core services available in the appContext:
 
- `Meteor`
- `Mongo`: Meteor's Mongo, or in testing it is our own `TestMongo` (see below)
- `Accounts`: with appropriate internal data reset each test
- `Random`
- `EJSON`
- `Users`: Meteor's 'users' Mongo collection (`TestMongo` in testing)
- `apiRegistry`: see below

...and only on the client:

- `Tracker`: like Meteor's Tracker but will react to both Meteor *and Mobx* reactive changes
- `api`: how to call methods on the server 
- `storage`: HTML5 localStorage
- `mongoMirror`: high level mirroring of publications to Mobx domains and offline

## ApiRegistry

Rather than calling `Meteor.methods` and `Meteor.publish` to create methods and publications
inject `apiRegistry`. This has a cleaner callback (no use of `this`), calls 
[unblock](https://github.com/meteorhacks/unblock), and facilitates domain testing (see below).

## TestMongo

Uses in memory MiniMongo instead of real Mongo collections to increase test speed.
 But this can be override with `withRealMongoCollection` for cases where you need
 to use functions not available in MiniMongo. 

## Domain tests

An [example domain test](https://github.com/mindhivenz/todos-basis-webapp/blob/master/tests/specs/domain/tasks.spec.js).

- Use `mockServerContext` of `@mindhvie/meteor/test` to initialise modules in test
	- Most likely you'll want to import and pass `@mindhvie/meteor/test/mockMeteorCoreModuleFactory`
	  as the first module into `mockServerContext`
	- This also sets up a fiber so Meteor code can be run in your tests  
- From the returned context get the mock `apiRegistry` which can `call` and `subscribe` to methods and publications
  in the modules being tested
