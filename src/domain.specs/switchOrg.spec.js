import { initModules, app } from '@mindhive/di'
import { mockServerContext } from '../test/serverContext'
import { MockMethodInvocation } from '../test/mocks/mockApiRegistry'
import { notAuthorizedErrorMatch } from '../test/mocks/error'
import { onlyAuditEntry, auditEntries, resetRolesCollection } from '../test/fixture'

import mockMeteorCoreModuleFactory from '../test/mocks/mockMeteorCoreModuleFactory'
import auditModule from '../server/auditModule'
import apiContextAuditModule from '../server/apiContextAuditModule'
import apiContextAuthModule from '../universal/apiContextAuthModule'
import apiContextViewerModule from '../universal/apiContextViewerModule'
import rolesModule from '../universal/rolesModule'
import mockOrgsModule from './fixture/mockOrgsModule'
import factoriesModule from './fixture/factoriesModule'

import { should } from '../mocha'

import switchOrgModule from '../server/switchOrgModule'


describe('switchOrgModule', () => {

  const modules = () =>
    initModules([
      mockMeteorCoreModuleFactory({ isServer: true }),
      auditModule,
      apiContextAuthModule,
      apiContextViewerModule,
      apiContextAuditModule,
      rolesModule,
      resetRolesCollection,

      mockOrgsModule,
      switchOrgModule,

      factoriesModule,
    ])


  let viewer

  describe('switchOrg.orgs.selectionList', () => {

    const whenCalled = () =>
      app().apiRegistry.call(
        'switchOrg.orgs.selectionList',
        new MockMethodInvocation({ viewer }),
      )

    const fields = (org) => ({
      _id: org._id,
      name: org.name,
    })

    it('should load all orgs',
      mockServerContext(modules, () => {
        const org1 = Factory.create('org')
        const org2 = Factory.create('org')
        viewer = Factory.create('superUser', {
          orgId: org1._id,
        })
        const actual = whenCalled()
        actual.should.have.all.deep.members([
          fields(org1),
          fields(org2),
        ])
      })
    )

    it('should throw when not super user',
      mockServerContext(modules, () => {
        viewer = Factory.create('user')
        should.throw(() => {
          whenCalled()
        }, notAuthorizedErrorMatch)
      })
    )
  })

  describe('switchOrg.viewer.switch', () => {

    const whenCalled = (orgId) =>
      app().apiRegistry.call(
        'switchOrg.viewer.switch',
        new MockMethodInvocation({ viewer }),
        { orgId },
      )

    it("should update viewer's org",
      mockServerContext(modules, ({ Users }) => {
        const oldOrg = Factory.create('org')
        viewer = Factory.create('superUser', {
          orgId: oldOrg._id,
        })
        const newOrg = Factory.create('org')
        whenCalled(newOrg._id)
        Users.findOne(viewer._id).orgId.should.equal(newOrg._id)
        onlyAuditEntry().should.have.properties({
          action: 'User changed organisation',
          collection: 'users',
          id: viewer._id,
          data: {
            old: { orgId: oldOrg._id },
            new: { orgId: newOrg._id },
          },
        })
      })
    )

    it('should do nothing when viewer already has that orgId',
      mockServerContext(modules, ({ Users }) => {
        viewer = Factory.create('superUser')
        whenCalled(viewer.orgId)
        Users.findOne(viewer._id).should.deep.equal(viewer)
        auditEntries().should.have.lengthOf(0)
      })
    )

    it('should throw when not super user',
      mockServerContext(modules, () => {
        viewer = Factory.create('user')
        should.throw(() => {
          whenCalled(viewer.orgId)
        }, notAuthorizedErrorMatch)
      })
    )

  })

})
