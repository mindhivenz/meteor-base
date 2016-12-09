import { app } from '@mindhive/di'

import { Enhancer } from './enhancer'


export class ApiRegistry {

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

  _publication(meteorPublishFunc, publicationName, funcOrOptions) {
    if (this.Meteor.isServer) {
      const options = typeof funcOrOptions === 'function' ?
        { server: funcOrOptions }
        : funcOrOptions
      const {
        server,
        autoPublish = false,
      } = options
      const self = this
      const wrapper = function wrapper(...args) {
        const subscription = this
        self.enhanceApiContext(subscription, `pub:${publicationName}`)
        subscription.unblock()  // meteorhacks:unblock, see https://github.com/meteor/meteor/issues/853
        try {
          return server(app(), subscription, ...args)
        } catch (e) {
          self._errorEvent(subscription, e)
          throw e
        }
      }
      meteorPublishFunc(autoPublish ? null : publicationName, wrapper)
    }
  }

  _errorEvent(apiContext, e) {
    this.errorCallbacks.forEach(cb => cb(apiContext, e))
  }

  publication(publicationName, func) {
    this._publication(this.Meteor.publish, publicationName, func)
  }

  publicationComposite(publicationName, func) {
    this._publication(this.Meteor.publishComposite, publicationName, func)
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
