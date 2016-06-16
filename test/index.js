var test = require('@mindhive/di/test')

var modules = require('../dist/test/modules')
var minimongo = require('../dist/test/mocks/minimongo')
var mockApi = require('../dist/test/mocks/api')
var mockError = require('../dist/test/mocks/error')
var error = require('../dist/meteorCore/error')
var chaiPlugin = require('../dist/test/chaiPlugin')

module.exports = {
  appContext: test.appContext,
  mockAppContext: test.mockAppContext,
  mockInitModules: modules.mockInitModules,
  MiniMongo: minimongo.MiniMongo,
  MockMethodInvocation: mockApi.MockMethodInvocation,
  MockSubscription: mockApi.MockSubscription,
  MockMeteorError: mockError.MockMeteorError,
  MockClientError: mockError.MockMeteorError,
  NotAuthorizedError: error.NotAuthorizedError,
  chaiPlugin: chaiPlugin.plugin,
}
