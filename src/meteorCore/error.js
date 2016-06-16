import { MockMeteorError } from '../test/mocks/error'


export const NOT_AUTHORIZED = 'not-authorized'

/*
 Expose Meteor.Error under a better name.
 This is the only exception type that a client will receive from a server method.
 Also to avoids importing of Meteor.
 */
export const ClientError = global.Meteor ? global.Meteor.Error : MockMeteorError

export class NotAuthorizedError extends ClientError {
  constructor(details) {
    super(NOT_AUTHORIZED, 'You are not authorized', details)
  }
}

const notAuthorizedEvents = []

export const notAuthorizedError = (apiContext, details) => {
  notAuthorizedEvents.forEach(cb => cb(apiContext, details))
  return new NotAuthorizedError(details)
}

export const onNotAuthorized = (callback) => {
  notAuthorizedEvents.push(callback)
}
