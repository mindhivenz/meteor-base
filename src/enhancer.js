

export class Enhancer {

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
      Object.assign(this.apiContextEnhanceObj, objOrFunc)
    }
  }

  enhance(target) {
    if (typeof target.enhanced === 'undefined') {
      Object.assign(target, this.apiContextEnhanceObj)
      this.apiContextEnhanceFuncs.forEach(f => f(target))
      this.haveEnhanced = true
    }
  }
}
