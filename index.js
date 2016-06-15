var di = require('@mindhive/di')
var reactKomposer = require('react-komposer')

var init = require('./dist/init') 
var compose = require('./dist/compose')
var error = require('./dist/meteorCore/error')


module.exports = {
  inject: di.inject,
  initModules: init.initModules,
  withLiveData: compose.withLiveData,
  composeAll: reactKomposer.composeAll,
  NOT_AUTHORIZED: error.NOT_AUTHORIZED,
  ClientError: error.ClientError,
  NotAuthorizedError: error.NotAuthorizedError,
}

/*
 Import Meteor standard packages that we would want to use directly, rather than injecting

 So you shouldn't mind these being also tested as part of the unit in unit testing.
 Other Meteor objects and packages that should be injected as dependencies into your code
 go in the meteorCore/index.js module.
 */
if (global.Package) {
  if (global.Package.check) {
    module.exports.check = global.Package.check.check
    module.exports.Match = global.Package.check.Match
  }
}

