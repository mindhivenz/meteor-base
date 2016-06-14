import extend from 'lodash.assign'
import { inject } from '@mindhive/di'


export const NOT_AUTHORIZED = 'not-authorized'

export class ApiRegistry {

  constructor(Meteor, Users, Roles) {
    this.Meteor = Meteor
    this.Users = Users
    this.Roles = Roles
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
        self.enhanceApiContext(methodInvocation)
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
        self.enhanceApiContext(subscription)
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

  enhanceApiContext(instance) {
    if (! ('viewer' in instance)) {
      const self = this
      const hasPrototype = typeof instance.prototype === 'undefined'
      extend(hasPrototype ? instance : Object.getPrototypeOf(instance), {

        viewer() {
          if (! this.userId) {
            return null
          }
          if (! this.cachedViewer) {
            this.cachedViewer = self.Users.findOne(this.userId)
          }
          return this.cachedViewer
        },

        viewerHasRole(roles, group) {
          return self.Roles.userIsInRole(this.viewer(), roles, group)
        },

        ensureViewerHasRole(roles, group) {
          if (! this.viewerHasRole(roles, group)) {
            throw new self.Meteor.Error(NOT_AUTHORIZED, 'You are not authorized')
          }
        },

      })
    }
  }
}
