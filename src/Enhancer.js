import extendAccessors from 'extend-accessors'


export default class Enhancer {

  constructor() {
    this.apiContextEnhanceObj = { enhanced: true }
    this.apiContextEnhanceFuncs = []
    this.haveEnhanced = false
  }

  registerEnhancement(objOrFunc) {
    if (this.haveEnhanced) {
      throw new Error("Can't register new enhancements after enhancing")
    }
    if (typeof objOrFunc === 'function') {
      this.apiContextEnhanceFuncs.push(objOrFunc)
    } else {
      extendAccessors(this.apiContextEnhanceObj, objOrFunc)
    }
  }

  enhance(target, { enhancePrototypes = true } = {}) {
    let assignTarget = target
    if (enhancePrototypes) {
      const targetPrototype = Object.getPrototypeOf(target)
      if (Object.getPrototypeOf(targetPrototype)) {  // Would be null if Object prototype
        assignTarget = targetPrototype
      }
    }
    if (typeof assignTarget.enhanced === 'undefined') {
      extendAccessors(assignTarget, this.apiContextEnhanceObj)
    }
    this.apiContextEnhanceFuncs.forEach(f => f(target))
    this.haveEnhanced = true
  }
}
