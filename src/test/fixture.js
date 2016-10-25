import { appContext } from '@mindhive/di/test'

import { TestMongo } from './mocks/testMongo'


export const lastAuditEntry = () =>
  appContext.AuditEntries.findOne(
    {},
    {
      limit: 1,
      sort: { timestamp: -1 },
    }
  )

export const onlyAuditEntry = () => {
  const entries = appContext.AuditEntries.find().fetch()
  entries.should.have.length(1)
  return entries[0]
}

export const userHasPassword = (user, password) =>
  ! appContext.Accounts._checkPassword(user, password).error

export const resetRolesCollection = () => {
  global.Meteor.roles = new TestMongo.Collection('roles')
}
