var di = require('@mindhive/di')
var reactKomposer = require('react-komposer')

var init = require('./dist/init')
var compose = require('./dist/compose')
var error = require('./dist/error')


module.exports = {
  inject: di.inject,
  initModules: init.initModules,
  withAsync: compose.withAsync,
  withReactiveData: compose.withReactiveData,
  composeAll: reactKomposer.composeAll,
  ClientError: error.ClientError,
  denodeify: require('es6-denodeify')(Promise),
}

/*
 Import Meteor standard packages that we would want to use directly, rather than injecting

 So you shouldn't mind these being also tested as part of the unit in unit testing.
 Other Meteor objects and packages that should be injected as dependencies into your code
 go in the meteorCoreModule.js module.
 */
if (global.Package) {
  if (global.Package.check) {
    module.exports.check = global.Package.check.check
    module.exports.Match = global.Package.check.Match
  }
}

