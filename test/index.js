var test = require('@mindhive/di/test')

var modules = require('../dist/test/modules')
var minimongo = require('../dist/test/mocks/minimongo')
var mockApiRegistry = require('../dist/test/mocks/apiRegistry')
var chaiPlugin = require('../dist/test/chaiPlugin')

module.exports = {
  appContext: test.appContext,
  mockAppContext: test.mockAppContext,
  mockInitModules: modules.mockInitModules,
  MiniMongo: minimongo.MiniMongo,
  useRealMongoCollection: minimongo.useRealMongoCollection,
  MockMethodInvocation: mockApiRegistry.MockMethodInvocation,
  MockSubscription: mockApiRegistry.MockSubscription,
  chaiPlugin: chaiPlugin.plugin,
}
