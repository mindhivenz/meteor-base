/* global Factory */
import some from '@mindhive/some'

import { SUPER_USER } from '../../roles'


const uniqueStringCreator = (string) =>
  () =>
    some.unique.string(string)

export default ({
  Users,
  Orgs,
}) => {
  // Be tolerant to tests to passing in partial setups
  if (Orgs) {
    Factory.define('org', Orgs, {
      name: uniqueStringCreator('Org'),
      vocab: {},
      theme: null,
    })
    if (Users) {
      Factory.define('user', Users, {
        emails: () => [
          { address: some.email() },
        ],
        orgId: Factory.get('org'),
        profile: {
          fullName: uniqueStringCreator('Some User'),
        },
        roles: [],
        createdAt: () => new Date(),
      })
      Factory.define('superUser', Users, Factory.extend('user', {
        profile: {
          fullName: uniqueStringCreator('Super User'),
        },
        roles: [SUPER_USER],
      }))
    }
  }
}
