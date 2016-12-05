import some from '@mindhive/some'
import { mockAppContext, app } from '@mindhive/di'

import { sinon } from './mocha'
import { initMeteorModules } from './init'


describe('initMeteorModules', () => {

  beforeEach(() => {
    global.Meteor = {}
    global.Meteor.startup = sinon.stub()
  })

  afterEach(() => {
    delete global.Meteor
  })

  it('should not init if Meteor not started',
    mockAppContext(() => {
      app().should.be.empty
      initMeteorModules([])
      app().should.be.empty
    })
  )

  it('should init once started and add core module',
    mockAppContext(() => {
      app().should.be.empty
      initMeteorModules([])
      global.Meteor.startup.yield()
      app().should.have.property('Meteor')
    })
  )

  it('should add passed modules',
    mockAppContext(() => {
      initMeteorModules([
        () => ({
          someContext: some.object(),
        }),
      ])
      global.Meteor.startup.yield()
      app().should.have.property('someContext')
    })
  )

  it('should be callable multiple times',
    mockAppContext(() => {
      global.Meteor.startup.yields()
      initMeteorModules([
        () => ({
          firstContext: some.object(),
        }),
      ])
      initMeteorModules([
        () => ({
          secondContext: some.object(),
        }),
      ])
      app().should.have.property('firstContext')
      app().should.have.property('secondContext')
    })
  )

})
