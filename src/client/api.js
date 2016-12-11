import { app } from '@mindhive/di'


export class Api {

  meteorCall(
    methodName,
    args,
    { notifyViewerPending = true, ...meteorOptions } = {},
    callback,
  ) {
    const { Meteor, connectionDomain } = app()
    let connectionCallDisposer
    if (connectionDomain && notifyViewerPending) {
      connectionCallDisposer = connectionDomain.callStarted()
    }
    Meteor.apply(methodName, [args], { returnStubValue: true, ...meteorOptions }, (error, result) => {
      if (connectionCallDisposer) {
        connectionCallDisposer()
      }
      if (callback) {
        callback(error, result)
      }
    })
  }

  // Returns a promise resolved or rejected based on the server result
  call(methodName, args, options) {
    return new Promise((resolve, reject) => {
      this.meteorCall(methodName, args, options, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }

  // Use this when you know the call will definitely work on the server, so client will immediately carry on.
  // Will return the result of the client simulation method (if any).
  optimisticCall(methodName, args, options) {
    return this.meteorCall(methodName, args, options, (error) => {
      if (error) {
        // No need to messageDomain.error here, as should have been done on the server
        app().messageDomain.show(
          'Server update failed',
          'Apologies, but your most recent change was lost. Our team has been notified.',
        )
      }
    })
  }
}
