var test = require('@mindhive/di/test')

var modules = require('../dist/test/modules')
var minimongo = require('../dist/test/mocks/minimongo')
var mockApiRegistry = require('../dist/test/mocks/apiRegistry')
var error = require('../dist/test/mocks/error')
var chaiPlugin = require('../dist/test/chaiPlugin')

module.exports = {
  appContext: test.appContext,
  mockAppContext: test.mockAppContext,
  mockInitModules: modules.mockInitModules,
  MiniMongo: minimongo.MiniMongo,
  MockMethodInvocation: mockApiRegistry.MockMethodInvocation,
  MockSubscription: mockApiRegistry.MockSubscription,
  MockMeteorError: error.MockMeteorError,
  MockClientError: error.MockMeteorError,
  chaiPlugin: chaiPlugin.plugin,
}
