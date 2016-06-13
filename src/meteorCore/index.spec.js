import '../mocha'

import meteorCoreModule from './'


describe('meteorCoreModule', () => {

  beforeEach(() => {
    global.Meteor = {}
  })

  afterEach(() => {
    delete global.Meteor
  })

  it('should add core Meteor services and packages', () => {
    const context = meteorCoreModule()
    context.should.have.keys([
      'Meteor',
      'Tracker',
      'Users',
      'Mongo',
      'SimpleSchema',
      'Accounts',
      'Roles',
      'apiRegistry',
    ])
  })
})

