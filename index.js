var di = require('@mindhive/di')

var init = require('./dist/init')
var error = require('./dist/error')
var focusedView = require('./dist/focusedView')

module.exports = {
  app: di.app,
  initMeteorModules: init.initMeteorModules,
  ClientError: error.ClientError,
  NOT_AUTHORIZED: error.NOT_AUTHORIZED,
  notAuthorizedError: error.notAuthorizedError,
  VALIDATION_ERROR: error.VALIDATION_ERROR,
  validationError: error.validationError,
  FocusedView: focusedView.FocusedView,
  prefixKeys: focusedView.prefixKeys,
}

/*
 Import Meteor standard packages that we would want to use directly / declarative, rather than injecting

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
if (global.SimpleSchema) {
  module.exports.SimpleSchema = global.SimpleSchema
}
