import '../mocha'

import meteorCoreModule from './meteorCoreModule'


const originalMeteor = global.Meteor

describe('meteorCoreModule', () => {

  beforeEach(() => {
    global.Meteor = {}
  })

  afterEach(() => {
    global.Meteor = originalMeteor
  })

  it('should add core Meteor services and packages', () => {
    const context = meteorCoreModule()
    context.should.have.keys([
      'Meteor',
      'Users',
      'Mongo',
      'Accounts',
      'apiRegistry',
      'Random',
      'EJSON',
    ])
  })
})

