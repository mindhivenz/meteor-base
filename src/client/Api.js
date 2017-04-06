import { app } from '@mindhive/di'


export default class Api {

  meteorCall(
    methodName,
    args,
    {
      viewerWaitingOnResult = false,
      notifyViewerPending = true,
      ...meteorOptions
    } = {},
    callback,
  ) {
    const { Meteor, connectionStore } = app()
    let serverCall
    if (connectionStore && notifyViewerPending) {
      serverCall = connectionStore.callStarted({ viewerWaitingOnResult })
    }
    Meteor.apply(methodName, [args], { returnStubValue: true, ...meteorOptions }, (error, result) => {
      if (serverCall) {
        serverCall.stop()
      }
      if (callback) {
        callback(error, result)
      }
    })
  }

  // Returns a promise resolved or rejected based on the server result
  call(methodName, args, options) {
    return new Promise((resolve, reject) => {
      const callOptions = {
        viewerWaitingOnResult: true,
        ...options,
      }
      this.meteorCall(methodName, args, callOptions, (error, result) => {
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
        // No need to systemMessageStore.addMessageAndAuditLog here as audit log should have been done on the server
        app().systemMessageStore.addMessage({
          message: 'Terribly sorry, but that change failed',
        })
      }
    })
  }
}
