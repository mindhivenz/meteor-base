import { sinon } from '../mocha'
import some from '@mindhive/some'
import { appContext } from '@mindhive/di/test'

import { ApiRegistry } from './api'


describe('ApiRegistry', () => {

  let Meteor
  let apiRegistry
  let thisInCall

  beforeEach(() => {

    const createWithUniquePrototype = () =>
      Object.create(() => {})

    Meteor = {}
    apiRegistry = new ApiRegistry(Meteor)
    thisInCall = createWithUniquePrototype()
  })

  describe('methods', () => {

    const callWrappedSomeMethod = (...args) =>
      Meteor.methods.getCall(0).args[0].someMethod.call(thisInCall, ...args)

    beforeEach(() => {
      Meteor.methods = sinon.spy()
    })

    describe('method', () => {

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

        it('should enhance', () => {
          Meteor.isServer = true
          apiRegistry.method(
            'someMethod',
            sinon.spy(),
            sinon.spy(),
          )
          const someFunc = sinon.spy()
          apiRegistry.apiContextEnhancer({
            someEnhancement: someFunc,
          })
          callWrappedSomeMethod()
          thisInCall.someEnhancement.should.equal(someFunc)
        })

        it('should add the apiName', () => {
          Meteor.isServer = true
          apiRegistry.method(
            'someMethod',
            sinon.spy(),
            sinon.spy(),
          )
          callWrappedSomeMethod()
          thisInCall.apiName.should.equal('call:someMethod')
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

  })

  describe('publications', () => {

    beforeEach(() => {
      Meteor.publish = sinon.spy()
      thisInCall.unblock = sinon.spy()
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

    it('should pass the appContext, and args to the function', () => {
      Meteor.isServer = true
      const args = some.array()
      const publicationFunc = sinon.spy()
      apiRegistry.publication('somePub', publicationFunc)
      callWrappedSomePub(...args)
      publicationFunc.should.have.been.calledWith(appContext, thisInCall, ...args)
    })

    describe('call context', () => {

      it('should call unblock() always', () => {
        Meteor.isServer = true
        apiRegistry.publication('somePub', sinon.spy())
        callWrappedSomePub()
        thisInCall.unblock.should.have.been.calledOnce
      })

      it('should enhance', () => {
        Meteor.isServer = true
        apiRegistry.publication('somePub', (passAppContext, subscription) => {
          subscription.someEnhancement()
        })
        const someFunc = sinon.spy()
        apiRegistry.apiContextEnhancer({
          someEnhancement: someFunc,
        })
        callWrappedSomePub()
        someFunc.should.have.been.called
      })

      it('should add the apiName', () => {
        Meteor.isServer = true
        apiRegistry.publication('somePub', sinon.spy())
        callWrappedSomePub()
        thisInCall.apiName.should.equal('pub:somePub')
      })

    })

  })

  describe('publicationComposite', () => {

    beforeEach(() => {
      Meteor.publishComposite = sinon.spy()
      thisInCall = {}  // publicationComposite doesn't seem to use prototypes
      thisInCall.unblock = sinon.spy()
    })

    const callWrappedCompositeSomePub = (...args) =>
      Meteor.publishComposite.getCall(0).args[1].call(thisInCall, ...args)

    it('should pass recordSetName and pass the appContext, and args to function', () => {
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


    describe('call context', () => {

      it('should enhance', () => {
        Meteor.isServer = true
        apiRegistry.publicationComposite('somePub', (passAppContext, subscription) => {
          subscription.someEnhancement()
        })
        const someFunc = sinon.spy()
        apiRegistry.apiContextEnhancer({
          someEnhancement: someFunc,
        })
        callWrappedCompositeSomePub()
        someFunc.should.have.been.called
      })

      it('should add the apiName', () => {
        Meteor.isServer = true
        apiRegistry.publicationComposite('somePub', sinon.spy())
        callWrappedCompositeSomePub()
        thisInCall.apiName.should.equal('pub:somePub')
      })

    })
  })

})
