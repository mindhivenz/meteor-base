const init = require('./dist/init')
const error = require('./dist/error')
const FocusedView = require('./dist/FocusedView')
const roles = require('./dist/roles')
const check = require('./dist/check')


module.exports.initMeteorModules = init.initMeteorModules
module.exports.ClientError = error.ClientError
module.exports.NOT_AUTHORIZED = error.NOT_AUTHORIZED
module.exports.notAuthorizedError = error.notAuthorizedError
module.exports.VALIDATION_ERROR = error.VALIDATION_ERROR
module.exports.validationError = error.validationError
module.exports.FocusedView = FocusedView.default
module.exports.prefixKeys = FocusedView.prefixKeys
module.exports.SUPER_USER = roles.SUPER_USER

/*
 Import Meteor standard packages that we would want to use directly / declarative, rather than injecting

 So you shouldn't mind these being also tested as part of the unit in unit testing.
 Other Meteor objects and packages that should be injected as dependencies into your code
 go in the meteorCoreModule.js module.
 */
module.exports.check = check.check
module.exports.Match = check.Match
