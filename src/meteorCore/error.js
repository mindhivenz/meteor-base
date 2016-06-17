import { MockMeteorError } from '../test/mocks/error'


/*
 Expose Meteor.Error under a better name.
 This is the only exception type that a client will receive from a server method.
 Also to avoids importing of Meteor.
 */
export const ClientError = global.Meteor ? global.Meteor.Error : MockMeteorError
