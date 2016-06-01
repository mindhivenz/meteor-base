import { sinon } from '../mocha'
import some from '@mindhive/some'
import { test } from '@mindhive/di'

import { ApiRegistry } from './api'


describe('ApiRegistry', () => {

  let Meteor
  let apiRegistry

  beforeEach(() => {
    Meteor = {}
    apiRegistry = new ApiRegistry(Meteor)
  })

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
      Meteor.methods.getCall(0).args[0].someMethod()
      someServerFunc.should.have.been.calledOnce
    })

    it('should pass the clientSimulationFunc when not on server', () => {
      Meteor.isServer = false
      const someClientFunc = sinon.spy()
      apiRegistry.method('someMethod', sinon.spy(), someClientFunc)
      Meteor.methods.getCall(0).args[0].someMethod()
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
      const thisInMethod = {}
      const args = some.array()
      Meteor.methods.getCall(0).args[0].someMethod.call(thisInMethod, ...args)
      someMethodFunc.should.have.been.calledWith(test.appContext, thisInMethod, ...args)
    })

    it('should call unblock() on the call context if not runInSeries', () => {
      Meteor.isServer = true
      apiRegistry.method(
        'someMethod',
        sinon.spy(),
        sinon.spy(),
        { runInSeries: false }
      )
      const thisInMethod = {
        unblock: sinon.spy(),
      }
      Meteor.methods.getCall(0).args[0].someMethod.call(thisInMethod)
      thisInMethod.unblock.should.have.been.calledOnce
    })

    it('should not call unblock() on the client', () => {
      Meteor.isServer = false
      apiRegistry.method(
        'someMethod',
        sinon.spy(),
        sinon.spy(),
        { runInSeries: false }
      )
      const thisInMethod = {
        unblock: sinon.spy(),
      }
      Meteor.methods.getCall(0).args[0].someMethod.call(thisInMethod)
      thisInMethod.unblock.should.not.have.been.called
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
      Meteor.methods.getCall(0).args[0].someMethod()
      someUniversalFunc.should.have.been.calledOnce
    })

    it('should pass the func when on client', () => {
      Meteor.isServer = false
      const someUniversalFunc = sinon.spy()
      apiRegistry.methodUniversal('someMethod', someUniversalFunc)
      Meteor.methods.getCall(0).args[0].someMethod()
      someUniversalFunc.should.have.been.calledOnce
    })

  })

  describe('publications', () => {

    beforeEach(() => {
      Meteor.publish = sinon.spy()
    })

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

    it('should pass the appContext, call context, and args to the publish function' +
      ' and call unblock on the subscription (call context)', () => {
      Meteor.isServer = true
      const thisInPublication = {
        unblock: sinon.spy(),
      }
      const args = some.array()
      const publicationFunc = sinon.spy()
      apiRegistry.publication('somePub', publicationFunc)
      Meteor.publish.getCall(0).args[1].call(thisInPublication, ...args)
      publicationFunc.should.have.been.calledWith(test.appContext, thisInPublication, ...args)
      thisInPublication.unblock.should.have.been.calledOnce
    })

  })

})
