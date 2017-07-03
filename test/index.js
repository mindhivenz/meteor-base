const mockServerContext = require('../dist/test/mockServerContext')
const TestMongo = require('../dist/test/mocks/TestMongo')
const MockApiRegistry = require('../dist/test/mocks/MockApiRegistry')
const chaiPlugin = require('../dist/test/chaiPlugin')
const error = require('../dist/test/mocks/error')
const fixture = require('../dist/test/fixture')


module.exports.mockServerContext = mockServerContext.default
module.exports.TestMongo = TestMongo.default
module.exports.TestGround = TestMongo.TestGround
module.exports.withRealMongoCollection = TestMongo.withRealMongoCollection
module.exports.MockMethodInvocation = MockApiRegistry.MockMethodInvocation
module.exports.MockSubscription = MockApiRegistry.MockSubscription
module.exports.MockHttpContext = MockApiRegistry.MockHttpContext
module.exports.MockApiContext = MockApiRegistry.MockApiContext
module.exports.MockApiRegistry = MockApiRegistry.default
module.exports.MockMeteorError = error.MockMeteorError
module.exports.notAuthorizedErrorMatch = error.notAuthorizedErrorMatch
module.exports.validationErrorMatch = error.validationErrorMatch
module.exports.chaiPlugin = chaiPlugin.default
module.exports.auditEntries = fixture.auditEntries
module.exports.lastAuditEntry = fixture.lastAuditEntry
module.exports.onlyAuditEntry = fixture.onlyAuditEntry
module.exports.userHasPassword = fixture.userHasPassword
module.exports.resetRolesCollection = fixture.resetRolesCollection
