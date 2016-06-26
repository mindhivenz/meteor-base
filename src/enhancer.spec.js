import some from '@mindhive/some'

import { sinon, should } from './mocha'

import { Enhancer } from './enhancer'


describe('Enhancer', () => {

  it('should enhance an object', () => {
    const enhancer = new Enhancer()
    const someProperty = some.object()
    const enhancerFunc = sinon.spy()
    const someFunc = sinon.spy()
    enhancer.registerEnhancement({
      someProperty,
      someFunc,
    })
    enhancer.registerEnhancement(enhancerFunc)
    const target = some.object()
    enhancer.enhance(target)
    target.should.have.property('someProperty', someProperty)
    target.should.have.property('someFunc', someFunc)
    enhancerFunc.should.have.been.calledWith(target)
  })

  it('should enhance a function prototype', () => {
    function SomePrototype() {
      this.somePrototypeProperty = some.primitive()
    }
    const enhancer = new Enhancer()
    const target = new SomePrototype()
    const someProperty = some.object()
    const enhancerFunc = sinon.spy()
    const someFunc = sinon.spy()
    enhancer.registerEnhancement({
      someProperty,
      someFunc,
    })
    enhancer.registerEnhancement(enhancerFunc)
    enhancer.enhance(Object.getPrototypeOf(target))
    enhancerFunc.should.have.been.calledWith(Object.getPrototypeOf(target))
    const newTargetInstance = new SomePrototype()
    newTargetInstance.should.have.property('somePrototypeProperty')
    newTargetInstance.should.have.property('someProperty', someProperty)
    newTargetInstance.should.have.property('someFunc', someFunc)
  })

  it('should only enhance once', () => {
    function SomePrototype() {
      this.somePrototypeProperty = some.primitive()
    }
    const enhancer = new Enhancer()
    const target = new SomePrototype()
    const someProperty = some.object()
    const enhancerFunc = sinon.spy()
    const someFunc = sinon.spy()
    enhancer.registerEnhancement({
      someProperty,
      someFunc,
    })
    enhancer.registerEnhancement(enhancerFunc)
    enhancer.enhance(Object.getPrototypeOf(target))
    enhancer.enhance(Object.getPrototypeOf(target))
    enhancerFunc.should.have.been.calledOnce
  })

  it("should throw if enhancement registered after use because prototype won't be enhanced again", () => {
    const enhancer = new Enhancer()
    enhancer.registerEnhancement({
      someProperty: some.object(),
    })
    enhancer.enhance(some.object())
    should.throw(() => {
      enhancer.registerEnhancement({
        someOtherProperty: some.object(),
      })
    })
  })

  it('should enhance with objects before functions', () => {
    const enhancer = new Enhancer()
    const someProperty = some.object()
    const someFunc = sinon.spy()
    const someNewProperty = some.primitive()
    enhancer.registerEnhancement(obj => {
      obj.someProperty = someNewProperty
    })
    enhancer.registerEnhancement({
      someProperty,
      someFunc,
    })
    const target = some.object()
    enhancer.enhance(target)
    target.should.have.property('someProperty', someNewProperty)
  })

  it('should enhance with functions in order registered', () => {
    const enhancer = new Enhancer()
    const someNewProperty = some.primitive()
    const someFinalProperty = some.primitive()
    enhancer.registerEnhancement(obj => {
      obj.someProperty = someNewProperty
    })
    enhancer.registerEnhancement(obj => {
      obj.someProperty = someFinalProperty
    })
    const target = some.object()
    enhancer.enhance(target)
    target.should.have.property('someProperty', someFinalProperty)
  })

})
