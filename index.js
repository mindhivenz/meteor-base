var init = require('./dist/init')
var error = require('./dist/error')
var FocusedView = require('./dist/FocusedView')
var roles = require('./dist/roles')
var check = require('./dist/check')

module.exports = {
  initMeteorModules: init.initMeteorModules,
  ClientError: error.ClientError,
  NOT_AUTHORIZED: error.NOT_AUTHORIZED,
  notAuthorizedError: error.notAuthorizedError,
  VALIDATION_ERROR: error.VALIDATION_ERROR,
  validationError: error.validationError,
  FocusedView: FocusedView.default,
  prefixKeys: FocusedView.prefixKeys,
  SUPER_USER: roles.SUPER_USER,

  /*
   Import Meteor standard packages that we would want to use directly / declarative, rather than injecting

   So you shouldn't mind these being also tested as part of the unit in unit testing.
   Other Meteor objects and packages that should be injected as dependencies into your code
   go in the meteorCoreModule.js module.
   */
  check: check.check,
  Match: check.Match,
}
