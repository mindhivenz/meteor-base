var test = require('@mindhive/di/test')

var modules = require('../dist/test/modules')
var browser = require('../dist/test/browser')
var minimongo = require('../dist/test/mocks/minimongo')

module.exports = {
  appContext: test.appContext,
  mockAppContext: test.mockAppContext,
  mockInitModules: modules.mockInitModules,
  browserLogin: browser.login,
  MiniMongo: minimongo.MiniMongo,
}
