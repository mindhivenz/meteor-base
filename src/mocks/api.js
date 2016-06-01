import { inject } from '@mindhive/di'


export class MockApiRegistry {

  constructor() {
    this.methodFuncs = new Map()
    this.publicationFuncs = new Map()
  }

  method(methodName, serverFunc) {
    if (this.methodFuncs.has(methodName)) {
      throw new ReferenceError(`More than one method with the name "${methodName}"`)
    }
    this.methodFuncs.set(methodName, serverFunc)
  }

  methodUniversal(methodName, serverAndClientSimulationFunc) {
    this.method(methodName, serverAndClientSimulationFunc)
  }

  publication(recordSetName, func) {
    if (this.publicationFuncs.has(recordSetName)) {
      throw new ReferenceError(`More than one publication with the name "${recordSetName}"`)
    }
    this.publicationFuncs.set(recordSetName, func)
  }

  call(methodName, methodInvocation = {}, ...args) {
    const func = this.methodFuncs.get(methodName)
    if (! func) {
      throw new ReferenceError(`Unknown method name "${methodName}"`)
    }
    return inject(func)(
      {
        isSimulation: false,
        ...methodInvocation,
      },
      ...args
    )
  }

  subscribe(recordSetName, subscription = {}, ...args) {
    const func = this.publicationFuncs.get(recordSetName)
    if (! func) {
      throw new ReferenceError(`Unknown publication "${recordSetName}"`)
    }
    return inject(func)(
      subscription,
      ...args
    ).fetch()
  }
}
