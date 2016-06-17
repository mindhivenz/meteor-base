

export class Enhancer {

  constructor() {
    this.apiContextEnhanceObj = { enhanced: true }
    this.apiContextEnhanceFuncs = []
  }

  registerEnhancement(objOrFunc) {
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
    }
  }
}
