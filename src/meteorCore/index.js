import { ApiRegistry } from './api'


export default () => {
  const {
    Meteor,
    Tracker,
    Mongo,
    SimpleSchema,
    Accounts,
    Roles,
  } = global  // Import like this so it can be used in Wallaby
  const Users = Meteor.users
  return {
    Meteor,
    Tracker,
    Users,
    Mongo,
    SimpleSchema,
    Accounts,
    Roles,
    apiRegistry: new ApiRegistry(Meteor, Users, Roles),
  }
}
