import some from '@mindhive/some'
import { sinon } from './mocha'
import { test } from '@mindhive/di'

import { initModules } from './init'


describe('initModules', () => {

  beforeEach(() => {
    global.Meteor = {}
    Meteor.startup = sinon.stub()
  })

  afterEach(() => {
    delete global.Meteor
  })

  it('should not init if Meteor not started',
    test.mockAppContext(() => {
      test.appContext.should.be.empty
      initModules([])
      test.appContext.should.be.empty
    })
  )

  it('should init once started and add core module',
    test.mockAppContext(() => {
      test.appContext.should.be.empty
      initModules([])
      Meteor.startup.yield()
      test.appContext.should.have.property('Meteor')
    })
  )

  it('should add passed modules',
    test.mockAppContext(() => {
      initModules([
        () => ({
          someContext: some.object(),
        }),
      ])
      Meteor.startup.yield()
      test.appContext.should.have.property('someContext')
    })
  )

  it('should be callable multiple times',
    test.mockAppContext(() => {
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
      test.appContext.should.have.property('firstContext')
      test.appContext.should.have.property('secondContext')
    })
  )

})
