var mockServerContext = require('../dist/test/mockServerContext')
var TestMongo = require('../dist/test/mocks/TestMongo')
var MockApiRegistry = require('../dist/test/mocks/MockApiRegistry')
var chaiPlugin = require('../dist/test/chaiPlugin')
var error = require('../dist/test/mocks/error')
var fixture = require('../dist/test/fixture')

module.exports = {
  mockServerContext: mockServerContext.default,
  TestMongo: TestMongo.default,
  TestGround: TestMongo.TestGround,
  withRealMongoCollection: TestMongo.withRealMongoCollection,
  MockMethodInvocation: MockApiRegistry.MockMethodInvocation,
  MockSubscription: MockApiRegistry.MockSubscription,
  MockHttpContext: MockApiRegistry.MockHttpContext,
  MockApiContext: MockApiRegistry.MockApiContext,
  MockApiRegistry: MockApiRegistry.default,
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
