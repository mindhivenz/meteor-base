import some from '@mindhive/some'

import { sinon } from '../mocha'

import { LocalStorage } from './storage'


describe('LocalStorage', () => {

  let localStorage
  let path
  let value
  let valueJson

  beforeEach(() => {
    global.localStorage = {
      getItem: sinon.stub(),
      setItem: sinon.stub(),
      removeItem: sinon.stub(),
    }
    path = some.string()
    value = some.object()
    valueJson = JSON.stringify(value)
    localStorage = new LocalStorage()
  })

  describe('read', () => {

    it('should return getItem parsed', () => {
      global.localStorage.getItem.returns(valueJson)
      const actual = localStorage.read(path)
      return actual.should.deep.equal(value)
    })

    it('should return getItem un-parsed if parsing fails to maintain compatibility with old deviceTokens', () => {
      const excepted = some.string()
      global.localStorage.getItem.returns(excepted)
      const actual = localStorage.read(path)
      return actual.should.deep.equal(excepted)
    })

  })

  describe('write', () => {

    it('should setItem as JSON and return true', () => {
      const actual = localStorage.write(path, value)
      actual.should.equal(true)
      global.localStorage.setItem.should.have.been.calledWith(path, valueJson)
    })

    it('should removeItem when value is null', () => {
      localStorage.write(path, null)
      global.localStorage.removeItem.should.have.been.calledWith(path)
    })

    it('should return false when setItem throws (when full or iOS Safari private mode)', () => {
      global.localStorage.setItem.throws()
      const actual = localStorage.write(path, value)
      actual.should.equal(false)
    })

  })

})
