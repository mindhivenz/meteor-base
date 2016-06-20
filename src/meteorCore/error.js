import { MockMeteorError } from '../test/mocks/error'


/*
 Expose Meteor.Error under a better name to throw with

 Meteor.Error is the only exception type that a client will receive from an API call.
 Also to avoid importing of Meteor in our code.
 */
export const ClientError = global.Meteor ? global.Meteor.Error : MockMeteorError

export class ValidationError extends ClientError {
  static ERROR_CODE = 'validation-failed'

  constructor(fieldErrors) {
    const reason = Object.keys(fieldErrors).map(k => fieldErrors[k]).join(', ')
    super(ValidationError.ERROR_CODE, reason, fieldErrors)
  }
}
