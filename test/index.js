var test = require('@mindhive/di/test')

var modules = require('../dist/test/modules')
var serverContext = require('../dist/test/serverContext')
var minimongo = require('../dist/test/mocks/minimongo')
var mockApiRegistry = require('../dist/test/mocks/apiRegistry')
var chaiPlugin = require('../dist/test/chaiPlugin')

module.exports = {
  appContext: test.appContext,
  mockAppContext: test.mockAppContext,
  mockServerContext: serverContext.mockServerContext,
  mockInitModules: modules.mockInitModules,
  MiniMongo: minimongo.MiniMongo,
  withRealMongoCollection: minimongo.withRealMongoCollection,
  MockMethodInvocation: mockApiRegistry.MockMethodInvocation,
  MockSubscription: mockApiRegistry.MockSubscription,
  chaiPlugin: chaiPlugin.plugin,
}
