import { sinon, should } from '../mocha'
import some from '@mindhive/some'
import { appContext } from '@mindhive/di/test'

import { ApiRegistry } from './api'


describe('ApiRegistry', () => {

  let Meteor
  let Users
  let Roles
  let apiRegistry
  let thisInCall

  beforeEach(() => {

    const createWithUniquePrototype = () =>
      Object.create(() => {})

    Meteor = {}
    Users = {}
    Roles = {}
    apiRegistry = new ApiRegistry(Meteor, Users, Roles)
    thisInCall = createWithUniquePrototype()
  })

  const callWrappedSomeMethod = (...args) =>
    Meteor.methods.getCall(0).args[0].someMethod.call(thisInCall, ...args)

  describe('method', () => {

    beforeEach(() => {
      Meteor.methods = sinon.spy()
    })

    it('should call Meteor.methods with method name', () => {
      Meteor.isServer = true
      apiRegistry.method('someMethod', sinon.spy(), sinon.spy())
      Meteor.methods.should.have.been.calledOnce
      Meteor.methods.getCall(0).args[0].should.have.property('someMethod')
    })

    it('should pass the serverFunc when on server', () => {
      Meteor.isServer = true
      const someServerFunc = sinon.spy()
      apiRegistry.method('someMethod', someServerFunc)
      callWrappedSomeMethod()
      someServerFunc.should.have.been.calledOnce
    })

    it('should pass the clientSimulationFunc when not on server', () => {
      Meteor.isServer = false
      const someClientFunc = sinon.spy()
      apiRegistry.method('someMethod', sinon.spy(), someClientFunc)
      callWrappedSomeMethod()
      someClientFunc.should.have.been.calledOnce
    })

    it('should not call Meteor.methods if no function', () => {
      Meteor.isServer = false
      apiRegistry.method('someMethod', sinon.spy(), undefined)
      Meteor.methods.should.not.have.been.called
    })

    it('should pass the appContext, call context, and args to the method function', () => {
      Meteor.isServer = true
      const someMethodFunc = sinon.spy()
      apiRegistry.method('someMethod', someMethodFunc)
      const args = some.array()
      callWrappedSomeMethod(...args)
      someMethodFunc.should.have.been.calledWith(appContext, thisInCall, ...args)
    })

    describe('call context', () => {

      it('should call unblock() on call context if not runInSeries', () => {
        Meteor.isServer = true
        apiRegistry.method(
          'someMethod',
          sinon.spy(),
          sinon.spy(),
          { runInSeries: false }
        )
        thisInCall.unblock = sinon.spy()
        callWrappedSomeMethod()
        thisInCall.unblock.should.have.been.calledOnce
      })

      it('should not call unblock() on the client', () => {
        Meteor.isServer = false
        apiRegistry.method(
          'someMethod',
          sinon.spy(),
          sinon.spy(),
          { runInSeries: false }
        )
        thisInCall.unblock = sinon.spy()
        callWrappedSomeMethod()
        thisInCall.unblock.should.not.have.been.called
      })

      it('should provide viewer', () => {
        Meteor.isServer = true
        const viewer = some.object()
        Users.findOne = sinon.spy(() => viewer)
        const someMethodFunc = sinon.spy((methodAppContext, methodInvocation) => {
          methodInvocation.viewer().should.equal(viewer)
        })
        apiRegistry.method('someMethod', someMethodFunc)
        const userId = some.string()
        thisInCall.unblock = sinon.spy()
        thisInCall.userId = userId
        callWrappedSomeMethod()
        someMethodFunc.should.have.been.called
        Users.findOne.should.have.been.calledWith(userId)
      })

      it('should return null viewer when no userId', () => {
        Meteor.isServer = true
        Users.findOne = sinon.spy()
        const someMethodFunc = sinon.spy((methodAppContext, methodInvocation) => {
          should.not.exist(methodInvocation.viewer())
        })
        apiRegistry.method('someMethod', someMethodFunc)
        thisInCall.unblock = sinon.spy()
        thisInCall.userId = null
        callWrappedSomeMethod()
        someMethodFunc.should.have.been.called
        Users.findOne.should.not.have.been.called
      })

      it('should cache viewer', () => {
        Meteor.isServer = true
        const viewer = some.object()
        Users.findOne = sinon.spy(() => viewer)
        const someMethodFunc = sinon.spy((methodAppContext, methodInvocation) => {
          methodInvocation.viewer()
          methodInvocation.viewer()
        })
        apiRegistry.method('someMethod', someMethodFunc)
        const userId = some.string()
        thisInCall.unblock = sinon.spy()
        thisInCall.userId = userId
        callWrappedSomeMethod()
        someMethodFunc.should.have.been.called
        Users.findOne.should.have.been.calledOnce
      })

      it('should check roles', () => {
        Meteor.isServer = true
        const viewer = some.object()
        Users.findOne = sinon.spy(() => viewer)
        const expected = some.bool()
        const roles = some.array()
        const group = some.string()
        Roles.userIsInRole = sinon.spy(() => expected)
        const someMethodFunc = sinon.spy((methodAppContext, methodInvocation) => {
          methodInvocation.viewerHasRole(roles, group).should.equal(expected)
        })
        apiRegistry.method('someMethod', someMethodFunc)
        const userId = some.string()
        thisInCall.unblock = sinon.spy()
        thisInCall.userId = userId
        callWrappedSomeMethod()
        someMethodFunc.should.have.been.called
        Roles.userIsInRole.should.have.been.calledWith(viewer, roles, group)
      })

      it('should ensure roles', () => {
        Meteor.isServer = true
        Meteor.Error = Error
        const viewer = some.object()
        Users.findOne = sinon.spy(() => viewer)
        const roles = some.array()
        const group = some.string()
        Roles.userIsInRole = sinon.spy(() => false)
        const someMethodFunc = sinon.spy((methodAppContext, methodInvocation) => {
          methodInvocation.ensureViewerHasRole(roles, group)
        })
        apiRegistry.method('someMethod', someMethodFunc)
        const userId = some.string()
        thisInCall.unblock = sinon.spy()
        thisInCall.userId = userId
        should.throw(() => {
          callWrappedSomeMethod()
        }, Meteor.Error)
        Roles.userIsInRole.should.have.been.calledWith(viewer, roles, group)
      })

    })

  })

  describe('methodUniversal', () => {

    beforeEach(() => {
      Meteor.methods = sinon.spy()
    })

    it('should pass the func when on server', () => {
      Meteor.isServer = true
      const someUniversalFunc = sinon.spy()
      apiRegistry.methodUniversal('someMethod', someUniversalFunc)
      callWrappedSomeMethod()
      someUniversalFunc.should.have.been.calledOnce
    })

    it('should pass the func when on client', () => {
      Meteor.isServer = false
      const someUniversalFunc = sinon.spy()
      apiRegistry.methodUniversal('someMethod', someUniversalFunc)
      callWrappedSomeMethod()
      someUniversalFunc.should.have.been.calledOnce
    })

  })

  describe('publications', () => {

    beforeEach(() => {
      Meteor.publish = sinon.spy()
    })

    const callWrappedSomePub = (...args) =>
      Meteor.publish.getCall(0).args[1].call(thisInCall, ...args)

    it('should call Meteor.publish with recordSet name', () => {
      Meteor.isServer = true
      apiRegistry.publication('somePub', sinon.spy())
      Meteor.publish.should.have.been.calledOnce
      Meteor.publish.should.have.been.calledWith('somePub')
    })

    it('should not call Meteor.publish when not on server', () => {
      Meteor.isServer = false
      apiRegistry.publication('somePub', sinon.spy())
      Meteor.publish.should.not.have.been.called
    })

    it('should pass the appContext, and args to the function' +
      ' and call unblock on the subscription (call context)', () => {
      Meteor.isServer = true
      thisInCall.unblock = sinon.spy()
      const args = some.array()
      const publicationFunc = sinon.spy()
      apiRegistry.publication('somePub', publicationFunc)
      callWrappedSomePub(...args)
      publicationFunc.should.have.been.calledWith(appContext, thisInCall, ...args)
      thisInCall.unblock.should.have.been.calledOnce
    })

    describe('call context', () => {

      it('should provide viewer', () => {
        Meteor.isServer = true
        const viewer = some.object()
        Users.findOne = sinon.spy(() => viewer)
        const publicationFunc = sinon.spy((methodAppContext, methodInvocation) => {
          methodInvocation.viewer().should.equal(viewer)
        })
        apiRegistry.publication('somePub', publicationFunc)
        const userId = some.string()
        thisInCall.unblock = sinon.spy()
        thisInCall.userId = userId
        callWrappedSomePub()
        publicationFunc.should.have.been.called
        Users.findOne.should.have.been.calledWith(userId)
      })

      it('should ensure roles', () => {
        Meteor.isServer = true
        Meteor.Error = Error
        const viewer = some.object()
        Users.findOne = sinon.spy(() => viewer)
        const roles = some.array()
        const group = some.string()
        Roles.userIsInRole = sinon.spy(() => false)
        const publicationFunc = sinon.spy((methodAppContext, methodInvocation) => {
          methodInvocation.ensureViewerHasRole(roles, group)
        })
        apiRegistry.publication('somePub', publicationFunc)
        const userId = some.string()
        thisInCall.unblock = sinon.spy()
        thisInCall.userId = userId
        should.throw(() => {
          callWrappedSomePub()
        }, Meteor.Error)
        Roles.userIsInRole.should.have.been.calledWith(viewer, roles, group)
      })

    })

  })

  describe('publicationComposite', () => {

    beforeEach(() => {
      Meteor.publishComposite = sinon.spy()
    })

    const callWrappedCompositeSomePub = (...args) =>
      Meteor.publishComposite.getCall(0).args[1].call(thisInCall, ...args)

    it('should pass recordSetName and pass the appContext, and args to function' +
      ' and call unblock on the subscription (call context)', () => {
      Meteor.isServer = true
      thisInCall.unblock = sinon.spy()
      const args = some.array()
      const publicationFunc = sinon.spy()
      const recordSetName = some.unique.string()
      apiRegistry.publicationComposite(recordSetName, publicationFunc)
      Meteor.publishComposite.should.have.been.calledWith(recordSetName)
      callWrappedCompositeSomePub(...args)
      publicationFunc.should.have.been.calledWith(appContext, thisInCall, ...args)
      thisInCall.unblock.should.have.been.calledOnce
    })

  })

})
