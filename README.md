
# Mindhive's base Meteor package

## Install

1. `npm install --save @mindhive/meteor`
2. `meteor add meteorhacks:unblock`

### Meteor package peer dependencies (optional)

NPM peer dependencies are specified in `package.json`. Meteor ones are here:

1. `FocusedView`: `meteor add ejson`
2. `backdoorModule`: `meteor add xolvio:backdoor`
3. `SimpleSchema`: `meteor add aldeed:collection2`
4. `apiRegistry.publishComposite`: `meteor add reywood:publish-composite`
5. client `timeModule`: `meteor add mizzao:timesync`
6. `hasRole`: `meteor add alanning:roles`
7. `offlineModule`: `meteor add ground:db@2.0.0-rc.7`
8. `appStoreDomain`: `meteor add cordova:cordova-plugin-device`,  
 	`meteor add cordova:cordova-plugin-appinfo` and
 	`meteor add cordova:cordova-plugin-market`

## Dependency injection 

See our [`@mindhive/di` package](https://github.com/mindhivenz/di-js).

This package also makes Meteor core services available in the appContext through 
`initMeteorModules` (instead of `initModules` from `@mindhive/di`):
 
- `Meteor`
- `Mongo`: Meteor's Mongo, or in testing it is our own `TestMongo` (see below)
- `Accounts`: with appropriate internal data reset each test
- `Random`
- `EJSON`
- `Users`: Meteor's 'users' Mongo collection (`TestMongo` in testing)
- `apiRegistry`: see below

...and only on the client:

- `api`: how to call methods on the server 
- `Tracker`: like Meteor's Tracker but will react to both Meteor *and Mobx* reactive changes
- `storage`: HTML5 localStorage (we choose this over other storage mechanisms because Meteor also uses it)
- `mongoMirror`: high level mirroring of publications to Mobx domains and offline

## ApiRegistry

Rather than calling `Meteor.methods` and `Meteor.publish` to create methods and publications
inject `apiRegistry`. This has a cleaner callback (no use of `this`), calls 
[unblock](https://github.com/meteorhacks/unblock), and facilitates domain testing (see below).

## TestMongo

Uses in memory MiniMongo instead of real Mongo collections to increase test speed.
 But this can be override with `withRealMongoCollection` for cases where you need
 to use functions not available in MiniMongo. 
