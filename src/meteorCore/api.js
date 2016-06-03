import { inject } from '@mindhive/di'


export class ApiRegistry {
  constructor(Meteor) {
    this.Meteor = Meteor
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
      const injectedFunc = inject(func)
      const unblock = this.Meteor.isServer && ! runInSeries
      // Can't use arrow func as 'this' would be different
      const wrapper = function wrapper(...args) {
        const methodInvocation = this
        if (unblock) {
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
      const injectedFunc = inject(func)
      // Can't use arrow func as 'this' would be different
      const wrapper = function wrapper(...args) {
        const subscription = this
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
}
