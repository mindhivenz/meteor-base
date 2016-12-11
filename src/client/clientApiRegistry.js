import { app } from '@mindhive/di'

import { Enhancer } from '../enhancer'


export class ClientApiRegistry {

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
      const wrapper = function wrapper(...args) {
        const methodInvocation = this
        self.enhanceApiContext(methodInvocation, `call:${methodName}`)
        if (self.Meteor.isServer && runInParallel) {
          methodInvocation.unblock()
        }
        try {
          return func(app(), methodInvocation, ...args)
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

  enhanceApiContext(instance, apiName) {
    instance.apiName = apiName
    const instancePrototype = Object.getPrototypeOf(instance)
    const hasPrototype = Object.getPrototypeOf(instancePrototype)  // Would be null/falsy if Object prototype
    this.enhancer.enhance(hasPrototype ? instancePrototype : instance)
  }
}