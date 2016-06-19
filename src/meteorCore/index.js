import { ApiRegistry } from './apiRegistry'


export default () => {
  const {
    Meteor,
    Tracker,
    Mongo,
    SimpleSchema,
    Accounts,
  } = global  // Import like this so it can be used in Wallaby
  const Users = Meteor.users
  return {
    Meteor,
    Tracker,
    Users,
    Mongo,
    SimpleSchema,
    Accounts,
    apiRegistry: new ApiRegistry(Meteor),
  }
}
