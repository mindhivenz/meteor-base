import some from '@mindhive/some'
import { app } from '@mindhive/di'

import { sinon, should } from './mocha'
import { ApiRegistry } from './apiRegistry'


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

  describe('method', () => {

    const callWrappedSomeMethod = (...args) =>
      Meteor.methods.getCall(0).args[0].someMethod.call(thisInCall, ...args)

    beforeEach(() => {
      Meteor.methods = sinon.spy()
    })

    it('should call Meteor.methods with method name', () => {
      apiRegistry.method('someMethod', sinon.spy())
      Meteor.methods.should.have.been.calledOnce
      Meteor.methods.getCall(0).args[0].should.have.property('someMethod')
    })

    it('should pass server when on server', () => {
      Meteor.isServer = true
      const server = sinon.spy()
      apiRegistry.method('someMethod', { server })
      callWrappedSomeMethod()
      server.should.have.been.calledOnce
    })

    it('should pass clientSimulation when on client', () => {
      Meteor.isServer = false
      const clientSimulation = sinon.spy()
      apiRegistry.method('someMethod', { clientSimulation })
      callWrappedSomeMethod()
      clientSimulation.should.have.been.calledOnce
    })

    it('should pass simple function on either side', () => {
      Meteor.isServer = some.bool()
      const func = sinon.spy()
      apiRegistry.method('someMethod', func)
      callWrappedSomeMethod()
      func.should.have.been.calledOnce
    })

    it('should not call Meteor.methods if no function', () => {
      Meteor.isServer = some.bool()
      apiRegistry.method('someMethod', {})
      Meteor.methods.should.not.have.been.called
    })

    it('should pass the app, call context, and args to the method function', () => {
      Meteor.isServer = some.bool()
      const someMethodFunc = sinon.spy()
      apiRegistry.method('someMethod', someMethodFunc)
      const args = some.array()
      callWrappedSomeMethod(...args)
      someMethodFunc.should.have.been.calledWith(app(), thisInCall, ...args)
    })

    it('should bubble error out to Meteor', () => {
      Meteor.isServer = some.bool()
      apiRegistry.method('someMethod', () => { throw new Error() })
      should.throw(() => {
        callWrappedSomeMethod()
      })
    })

    describe('call context', () => {

      it('should call unblock() on call context if runInParallel', () => {
        Meteor.isServer = true
        apiRegistry.method(
          'someMethod',
          {
            server: sinon.spy(),
            runInParallel: true,
          }
        )
        thisInCall.unblock = sinon.spy()
        callWrappedSomeMethod()
        thisInCall.unblock.should.have.been.calledOnce
      })

      it('should not call unblock() on the client', () => {
        Meteor.isServer = false
        apiRegistry.method(
          'someMethod',
          {
            clientSimulation: sinon.spy(),
            runInParallel: true,
          }
        )
        thisInCall.unblock = sinon.spy()
        callWrappedSomeMethod()
        thisInCall.unblock.should.not.have.been.called
      })

      it('should enhance', () => {
        Meteor.isServer = some.bool()
        apiRegistry.method(
          'someMethod',
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
        Meteor.isServer = some.bool()
        apiRegistry.method(
          'someMethod',
          sinon.spy(),
        )
        callWrappedSomeMethod()
        thisInCall.apiName.should.equal('call:someMethod')
      })

    })

    describe('onError', () => {

      it('should call onError when an exception bubbles out of func', () => {
        Meteor.isServer = some.bool()
        const expectedError = new Error()
        const errorHandler = sinon.spy()
        apiRegistry.onError(errorHandler)
        apiRegistry.method(
          'someMethod',
          () => { throw expectedError },
        )
        should.throw(() => {
          callWrappedSomeMethod()
        })
        errorHandler.should.have.been.calledWith(thisInCall, expectedError)
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

    it('should pass the app, and args to the function', () => {
      Meteor.isServer = true
      const args = some.array()
      const publicationFunc = sinon.spy()
      apiRegistry.publication('somePub', publicationFunc)
      callWrappedSomePub(...args)
      publicationFunc.should.have.been.calledWith(app(), thisInCall, ...args)
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

    describe('onError', () => {

      it('should call onError when an exception bubbles out of func', () => {
        Meteor.isServer = true
        const expectedError = new Error()
        const errorHandler = sinon.spy()
        apiRegistry.onError(errorHandler)
        apiRegistry.publication(
          'somePub',
          () => { throw expectedError },
        )
        should.throw(() => {
          callWrappedSomePub()
        })
        errorHandler.should.have.been.calledWith(thisInCall, expectedError)
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

    it('should pass publicationName and pass the app, and args to function', () => {
      Meteor.isServer = true
      thisInCall.unblock = sinon.spy()
      const args = some.array()
      const publicationFunc = sinon.spy()
      const publicationName = some.unique.string()
      apiRegistry.publicationComposite(publicationName, publicationFunc)
      Meteor.publishComposite.should.have.been.calledWith(publicationName)
      callWrappedCompositeSomePub(...args)
      publicationFunc.should.have.been.calledWith(app(), thisInCall, ...args)
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

    describe('onError', () => {

      it('should call onError when an exception bubbles out of func', () => {
        Meteor.isServer = true
        const expectedError = new Error()
        const errorHandler = sinon.spy()
        apiRegistry.onError(errorHandler)
        apiRegistry.publicationComposite(
          'somePub',
          () => { throw expectedError },
        )
        should.throw(() => {
          callWrappedCompositeSomePub()
        })
        errorHandler.should.have.been.calledWith(thisInCall, expectedError)
      })

    })

  })

})
