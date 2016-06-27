import { MockMeteorError } from './test/mocks/error'


/*
 Expose Meteor.Error under a better name to throw with

 Meteor.Error is the only exception type that a client will receive from an API call.
 Also to avoid importing of Meteor in our code.
 */
export const ClientError = global.Meteor ? global.Meteor.Error : MockMeteorError
