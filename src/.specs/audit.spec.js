import some from '@mindhive/some'
import { app } from '@mindhive/di'

import '../mocha'
import mockMeteorCoreModuleFactory from '../test/mocks/mockMeteorCoreModuleFactory'
import mockServerContext from '../test/mockServerContext'
import { MockMethodInvocation } from '../test/mocks/MockApiRegistry'
import { onlyAuditEntry } from '../test/fixture'

import auditModule from '../server/auditModule'


describe('Audit API', () => {

  const modules = () => initModules([
    mockMeteorCoreModuleFactory({ isClient: true }),
    auditModule,
  ])

  describe('auditEntries collection', () => {

    it('should create auditEntries collection',
      mockServerContext(modules, async ({ AuditEntries }) => {
        AuditEntries._name.should.equal('auditEntries')
        AuditEntries.should.have.a.schema
        AuditEntries.should.have.index(['connectionId'])
        AuditEntries.should.have.index(['clientAddress'])
        AuditEntries.should.have.index(['viewerId'])
        AuditEntries.should.have.index(['orgId'])
        AuditEntries.should.have.index(['collection', 'id'])
      })
    )

  })

  describe('audit.log method', () => {

    let context
    let viewer

    beforeEach(() => {
      context = some.string()
    })

    const whenCalled = entry =>
      app().apiRegistry.call(
        'audit.log',
        new MockMethodInvocation({ viewer }),
        { context, entry },
      )

    it("should log an auditEntry and specify it's from the client",
      mockServerContext(modules, async () => {
        viewer = Factory.create('user')
        const action = some.string()
        const data = some.object()
        whenCalled({
          action,
          data,
        })
        onlyAuditEntry().should.have.properties({
          context,
          viewerId: viewer._id,
          action,
          data,
          fromClient: true,
        })

      })
    )

  })

})
