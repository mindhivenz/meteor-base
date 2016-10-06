var di = require('@mindhive/di')
var test = require('@mindhive/di/test')

var mockMeteorCoreModule = require('../dist/test/mocks/meteorCoreModule')
var serverContext = require('../dist/test/serverContext')
var testMongo = require('../dist/test/mocks/testMongo')
var mockApiRegistry = require('../dist/test/mocks/apiRegistry')
var chaiPlugin = require('../dist/test/chaiPlugin')

module.exports = {
  initModules: di.initModules,
  appContext: test.appContext,
  mockAppContext: test.mockAppContext,
  mockServerContext: serverContext.mockServerContext,
  mockMeteorCoreModule: mockMeteorCoreModule.default,
  TestMongo: testMongo.TestMongo,
  withRealMongoCollection: testMongo.withRealMongoCollection,
  MockMethodInvocation: mockApiRegistry.MockMethodInvocation,
  MockSubscription: mockApiRegistry.MockSubscription,
  MockApiContext: mockApiRegistry.MockApiContext,
  chaiPlugin: chaiPlugin.plugin,
}
