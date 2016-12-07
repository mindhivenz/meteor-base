var mockMeteorCoreModule = require('../dist/test/mocks/meteorCoreModule')
var serverContext = require('../dist/test/serverContext')
var testMongo = require('../dist/test/mocks/testMongo')
var mockApiRegistry = require('../dist/test/mocks/apiRegistry')
var chaiPlugin = require('../dist/test/chaiPlugin')
var error = require('../dist/test/mocks/error')
var fixture = require('../dist/test/fixture')

module.exports = {
  mockServerContext: serverContext.mockServerContext,
  mockMeteorCoreModule: mockMeteorCoreModule.default,
  TestMongo: testMongo.TestMongo,
  TestGround: testMongo.TestGround,
  withRealMongoCollection: testMongo.withRealMongoCollection,
  MockMethodInvocation: mockApiRegistry.MockMethodInvocation,
  MockSubscription: mockApiRegistry.MockSubscription,
  MockApiContext: mockApiRegistry.MockApiContext,
  MockApiRegistry: mockApiRegistry.MockApiRegistry,
  MockMeteorError: error.MockMeteorError,
  notAuthorizedErrorMatch: error.notAuthorizedErrorMatch,
  validationErrorMatch: error.validationErrorMatch,
  chaiPlugin: chaiPlugin.plugin,
  auditEntries: fixture.auditEntries,
  lastAuditEntry: fixture.lastAuditEntry,
  onlyAuditEntry: fixture.onlyAuditEntry,
  userHasPassword: fixture.userHasPassword,
  resetRolesCollection: fixture.resetRolesCollection,
}
