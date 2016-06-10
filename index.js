var di = require('@mindhive/di')

var init = require('./dist/init') 

module.exports = {
  inject: di.inject,
  initModules: init.initModules,
}

/*
 Imports Meteor standard packages that we would want to use directly, rather than injecting

 So you shouldn't mind these being also tested as part of the unit in unit testing.
 Other Meteor objects and packages that should be injected as dependencies into your code
 go in the meteorCore/index.js module.
 */
module.exports.check = Package.check.check

/*
 Expose Meteor.Error under a better name.
 This is the only exception type that a client will receive from a server method.
 Also to avoids importing of Meteor.
 */
module.exports.ClientError = global.Meteor.Error
