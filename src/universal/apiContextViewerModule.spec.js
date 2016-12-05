import some from '@mindhive/some'
import { initModules, mockAppContext } from '@mindhive/di'

import { sinon, should } from '../mocha'

import { MockApiRegistry } from '../test/mocks/mockApiRegistry'

import apiContextViewerModule from './apiContextViewerModule'


describe('apiContextViewer', () => {

  let Users
  let apiContext
  let user

  beforeEach(() => {
    user = some.object()
    Users = {
      findOne: sinon.spy(() => user),
    }
    apiContext = {
      userId: some.string(),
      accessDenied: sinon.spy(r => { throw new Error(r) }),
    }
  })

  const modules = () =>
    initModules([
      () => ({
        Users,
        apiRegistry: new MockApiRegistry(),
      }),
      apiContextViewerModule,
      ({ apiRegistry }) => {
        apiRegistry.mockEnhance(apiContext)
      },
    ])

  describe('viewer', () => {

    it('should provide viewer',
      mockAppContext(modules, () => {
        const actual = apiContext.viewer()
        actual.should.equal(user)
        Users.findOne.should.have.been.calledWith(apiContext.userId)
      })
    )

    it('should throw when no userId (use isAuthenticated)',
      mockAppContext(modules, () => {
        apiContext.userId = null
        should.throw(() => {
          apiContext.viewer()
        }, /not authenticated/i)
      })
    )

    it('should throw when user is disabled',
      mockAppContext(modules, () => {
        user.disabled = true
        should.throw(() => {
          apiContext.viewer()
        }, /disabled/i)
      })
    )

    it('should cache viewer',
      mockAppContext(modules, () => {
        apiContext.viewer()
        apiContext.viewer()
        Users.findOne.should.have.been.calledOnce
      })
    )

    it('should update cache when userId changes ',
      mockAppContext(modules, () => {
        const newUserId = some.unique.string()
        apiContext.viewer()
        apiContext.userId = newUserId
        user = some.object()
        const actual = apiContext.viewer()
        actual.should.equal(user)
        Users.findOne.should.have.been.calledTwice
        Users.findOne.secondCall.should.have.been.calledWith(newUserId)
      })
    )

  })

  describe('isAuthenticated', () => {

    it('should return true when userId',
      mockAppContext(modules, () => {
        apiContext.isAuthenticated().should.equal(true)
      })
    )

    it('should return false when no userId',
      mockAppContext(modules, () => {
        apiContext.userId = null
        apiContext.isAuthenticated().should.equal(false)
      })
    )

  })

})
