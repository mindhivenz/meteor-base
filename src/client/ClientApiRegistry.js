import { app } from '@mindhive/di'

import Enhancer from '../Enhancer'


export default class ClientApiRegistry {

  enhancer = new Enhancer()
  errorCallbacks = []

  constructor(Meteor) {
    this.Meteor = Meteor
  }

  onError(callback) {
    this.errorCallbacks.push(callback)
  }

  method(
    methodName,
    funcOrOptions,
  ) {
    const options = typeof funcOrOptions === 'function' ?
      { universal: funcOrOptions }
      : funcOrOptions
    const {
      universal,
      clientSimulation = universal,
      server = universal,
      runInParallel = false,
    } = options
    const self = this
    const func = self.Meteor.isServer ? server : clientSimulation

    if (func) {
      const wrapper = function wrapper(args) {
        const methodInvocation = this
        self.enhanceApiContext(methodInvocation, `call:${methodName}`, args)
        if (self.Meteor.isServer && runInParallel) {
          methodInvocation.unblock()
        }
        try {
          return func(app(), methodInvocation, args)
        } catch (e) {
          self._errorEvent(methodInvocation, e)
          throw e
        }
      }

      this.Meteor.methods({
        [methodName]: wrapper,
      })
    }
  }

  _errorEvent(apiContext, e) {
    this.errorCallbacks.forEach(cb => cb(apiContext, e))
  }

  publication() {
    // NoOp on client
  }

  publicationComposite() {
    // NoOp on client
  }

  apiContextEnhancer(objOrFunc) {
    this.enhancer.registerEnhancement(objOrFunc)
  }

  enhanceApiContext(apiContext, apiName, callArgs) {
    apiContext.apiName = apiName
    apiContext.callArgs = callArgs
    this.enhancer.enhance(apiContext)
  }
}
