import { appContext } from '@mindhive/di/test'

import { TestMongo } from './mocks/testMongo'


export const auditEntries = () =>
  // Assume (since it's in Minimongo) that find() order matches insertion order
  appContext.AuditEntries.find().fetch()

export const lastAuditEntry = () => {
  const entries = auditEntries()
  entries.should.have.length.of.at.least(1)
  return entries[entries.length - 1]
}

export const onlyAuditEntry = () => {
  const entries = auditEntries()
  entries.should.have.length(1)
  return entries[0]
}

export const userHasPassword = (user, password) =>
  ! appContext.Accounts._checkPassword(user, password).error

export const resetRolesCollection = () => {
  global.Meteor.roles = new TestMongo.Collection('roles')
}
