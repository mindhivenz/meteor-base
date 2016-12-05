import { app } from '@mindhive/di'

import { TestMongo } from './mocks/testMongo'


export const auditEntries = () =>
  // Assume (since it's in Minimongo) that find() order matches insertion order
  app().AuditEntries.find().fetch()

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
  ! app().Accounts._checkPassword(user, password).error

export const resetRolesCollection = () => {
  global.Meteor.roles = new TestMongo.Collection('roles')
}
