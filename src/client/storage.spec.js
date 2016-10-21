import some from '@mindhive/some'

import { sinon } from '../mocha'

import { LocalStorage } from './storage'


describe('LocalStorage', () => {

  let localStorage
  let path
  let value

  beforeEach(() => {
    // noinspection JSAnnotator
    global.localStorage = {}
    path = some.string()
    value = some.string()
    localStorage = new LocalStorage()
  })

  describe('read', () => {

    beforeEach(() => {
      global.localStorage.getItem = sinon.stub()
    })

    it('should resolve to getItem result', () => {
      global.localStorage.getItem.returns(value)
      const actual = localStorage.read(path)
      global.localStorage.getItem.should.have.been.calledWith(path)
      return actual.should.eventually.equal(value)
    })

  })

  describe('write', () => {

    beforeEach(() => {
      global.localStorage.setItem = sinon.stub()
      global.localStorage.removeItem = sinon.stub()
    })

    it('should setItem and resolve to value', () => {
      const actual = localStorage.write(path, value)
      global.localStorage.setItem.should.have.been.calledWith(path, value)
      return actual.should.eventually.equal(value)
    })

    it('should removeItem when value is null', () => {
      value = null
      const actual = localStorage.write(path, value)
      global.localStorage.removeItem.should.have.been.calledWith(path)
      return actual.should.eventually.equal(value)
    })

    it('should reject when removeItem throws', () => {
      value = null
      const error = new Error()
      global.localStorage.removeItem.throws(error)
      const actual = localStorage.write(path, value)
      return actual.should.be.rejectedWith(error)
    })

  })

})
