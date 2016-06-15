import some from '@mindhive/some'
import { sinon } from './mocha'
import { mockAppContext, appContext } from '@mindhive/di/test'

import { initModules } from './init'


describe('initModules', () => {

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
      initModules([])
      appContext.should.be.empty
    })
  )

  it('should init once started and add core module',
    mockAppContext(() => {
      appContext.should.be.empty
      initModules([])
      Meteor.startup.yield()
      appContext.should.have.property('Meteor')
    })
  )

  it('should add passed modules',
    mockAppContext(() => {
      initModules([
        () => ({
          someContext: some.object(),
        }),
      ])
      Meteor.startup.yield()
      appContext.should.have.property('someContext')
    })
  )

  it('should be callable multiple times',
    mockAppContext(() => {
      Meteor.startup.yields()
      initModules([
        () => ({
          firstContext: some.object(),
        }),
      ])
      initModules([
        () => ({
          secondContext: some.object(),
        }),
      ])
      appContext.should.have.property('firstContext')
      appContext.should.have.property('secondContext')
    })
  )

})
