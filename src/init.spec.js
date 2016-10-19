import some from '@mindhive/some'
import { sinon } from './mocha'
import { mockAppContext, appContext } from '@mindhive/di/test'

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
      appContext.should.be.empty
      initMeteorModules([])
      appContext.should.be.empty
    })
  )

  it('should init once started and add core module',
    mockAppContext(() => {
      appContext.should.be.empty
      initMeteorModules([])
      global.Meteor.startup.yield()
      appContext.should.have.property('Meteor')
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
      appContext.should.have.property('someContext')
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
      appContext.should.have.property('firstContext')
      appContext.should.have.property('secondContext')
    })
  )

})
