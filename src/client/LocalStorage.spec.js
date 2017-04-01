import some from '@mindhive/some'

import { sinon, should } from '../mocha'

import LocalStorage from './LocalStorage'


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

    it('should return null when getItem returns null', () => {
      global.localStorage.getItem.returns(null)
      const actual = localStorage.read(path)
      should.equal(actual, null)
    })

    it('should return null when parsing fails', () => {
      global.localStorage.getItem.returns('invalid JSON')
      const actual = localStorage.read(path)
      should.equal(actual, null)
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
