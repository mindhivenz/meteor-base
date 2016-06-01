import { ApiRegistry } from './api'


export default () => {
  const {
    Meteor,
    Tracker,
    Mongo,
    SimpleSchema,
  } = global  // Import like this so it can be used in Wallaby
  return {
    Meteor,
    Tracker,
    Users: Meteor.users,
    Mongo,
    SimpleSchema,
    apiRegistry: new ApiRegistry(Meteor),
  }
}
