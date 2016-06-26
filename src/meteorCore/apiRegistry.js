import { inject } from '@mindhive/di'

import { Enhancer } from '../enhancer'


export class ApiRegistry {

  constructor(Meteor) {
    this.Meteor = Meteor
    this.enhancer = new Enhancer()
  }

  method(
    methodName,
    funcOrOptions,
  ) {
    const options = typeof funcOrOptions === 'function' ? {
      clientSimulation: funcOrOptions,
      server: funcOrOptions,
    } : funcOrOptions
    const {
      clientSimulation,
      server,
      runInSeries = true,
    } = options
    const func = this.Meteor.isServer ? server : clientSimulation

    if (func) {
      const self = this
      const injectedFunc = inject(func)
      // Can't use arrow func as 'this' would be different
      const wrapper = function wrapper(...args) {
        const methodInvocation = this
        self.enhanceApiContext(methodInvocation, `call:${methodName}`)
        if (self.Meteor.isServer && ! runInSeries) {
          methodInvocation.unblock()
        }
        return injectedFunc(methodInvocation, ...args)
      }

      this.Meteor.methods({
        [methodName]: wrapper,
      })
    }
  }

  meteorPublication(meteorPublishFunc, recordSetName, func) {
    if (this.Meteor.isServer) {
      const self = this
      const injectedFunc = inject(func)
      // Can't use arrow func as 'this' would be different
      const wrapper = function wrapper(...args) {
        const subscription = this
        self.enhanceApiContext(subscription, `pub:${recordSetName}`)
        subscription.unblock()  // meteorhacks:unblock, see https://github.com/meteor/meteor/issues/853
        return injectedFunc(subscription, ...args)
      }
      meteorPublishFunc(recordSetName, wrapper)
    }
  }

  publication(recordSetName, func) {
    this.meteorPublication(this.Meteor.publish, recordSetName, func)
  }

  publicationComposite(recordSetName, func) {
    this.meteorPublication(this.Meteor.publishComposite, recordSetName, func)
  }

  apiContextEnhancer(objOrFunc) {
    this.enhancer.registerEnhancement(objOrFunc)
  }

  enhanceApiContext(instance, apiName) {
    instance.apiName = apiName
    const hasPrototype = typeof instance.prototype !== 'undefined'
    const target = hasPrototype ? Object.getPrototypeOf(instance) : instance
    this.enhancer.enhance(target)
  }
}
