var test = require('@mindhive/di/test')

var modules = require('../dist/test/modules')
var minimongo = require('../dist/test/mocks/minimongo')
var mockApi = require('../dist/test/mocks/api')
var error = require('../dist/test/mocks/error')
var chaiPlugin = require('../dist/test/chaiPlugin')

module.exports = {
  appContext: test.appContext,
  mockAppContext: test.mockAppContext,
  mockInitModules: modules.mockInitModules,
  MiniMongo: minimongo.MiniMongo,
  MockMethodInvocation: mockApi.MockMethodInvocation,
  MockSubscription: mockApi.MockSubscription,
  MockMeteorError: error.MockMeteorError,
  MockClientError: error.MockMeteorError,
  chaiPlugin: chaiPlugin.plugin,
}
