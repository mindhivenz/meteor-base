import some from '@mindhive/some'
import { app, initModules } from '@mindhive/di'

import '../mocha'
import mockMeteorCoreModuleFactory from '../test/mocks/mockMeteorCoreModuleFactory'
import mockServerContext from '../test/mockServerContext'
import { MockMethodInvocation } from '../test/mocks/MockApiRegistry'
import { onlyAuditEntry } from '../test/fixture'
import factoriesModule from './fixture/factoriesModule'
import mockOrgsModule from './fixture/mockOrgsModule'
import apiContextViewerModule from '../server/apiContextViewerModule'
import LogLevel from '../LogLevel'

import auditModule from '../server/auditModule'


describe('Audit API', () => {

  const modules = () => initModules([
    mockMeteorCoreModuleFactory(),
    apiContextViewerModule,
    mockOrgsModule,
    auditModule,
    factoriesModule,
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

    let viewer

    const whenCalled = args =>
      app().apiRegistry.call(
        'audit.log',
        new MockMethodInvocation({ viewer }),
        args,
      )

    it("should log an auditEntry and specify it's from the client",
      mockServerContext(modules, async () => {
        viewer = Factory.create('user')
        const context = some.string()
        const action = some.string()
        const data = some.object()
        const level = some.enum(LogLevel).name
        whenCalled({
          context,
          level,
          action,
          data,
        })
        onlyAuditEntry().should.have.properties({
          context,
          viewerId: viewer._id,
          level,
          action,
          data,
          fromClient: true,
        })

      })
    )

    it('should default level to INFO',
      mockServerContext(modules, async () => {
        viewer = Factory.create('user')
        whenCalled({
          context: some.string(),
          action: some.string(),
        })
        onlyAuditEntry().should.have.properties({
          level: 'INFO',
        })

      })
    )

  })

})
