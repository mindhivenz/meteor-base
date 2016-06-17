import { inject } from '@mindhive/di'

import { Enhancer } from '../enhancer'


export class ApiRegistry {

  constructor(Meteor) {
    this.Meteor = Meteor
    this.enhancer = new Enhancer()
  }

  method(
    methodName,
    serverFunc,
    clientSimulationFunc = undefined,
    {
      runInSeries = true,
    } = {}
  ) {
    const func = this.Meteor.isServer ? serverFunc : clientSimulationFunc

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

  methodUniversal(
    methodName,
    serverAndClientSimulationFunc,
    options
  ) {
    this.method(
      methodName,
      serverAndClientSimulationFunc,
      serverAndClientSimulationFunc,
      options
    )
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
    const hasPrototype = typeof instance.prototype !== 'undefined'
    const target = hasPrototype ? Object.getPrototypeOf(instance) : instance
    this.enhancer.enhance(target)
    target.apiName = apiName
  }
}
