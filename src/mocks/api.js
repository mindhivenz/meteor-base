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

  publicationComposite(...args) {
    this.publication(...args)
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
    const cursor = inject(func)(
      subscription,
      ...args
    )
    if (typeof cursor.fetch !== 'function') {
      throw new TypeError('Have you called subscribe when you meant subscribeComposite?')
    }
    return cursor.fetch()
  }

  subscribeComposite(recordSetName, subscription = {}, ...args) {
    const func = this.publicationFuncs.get(recordSetName)
    if (! func) {
      throw new ReferenceError(`Unknown publication "${recordSetName}"`)
    }
    const tree = inject(func)(
      subscription,
      ...args
    )
    if (typeof tree.find !== 'function') {
      throw new TypeError('Have you called subscribeComposite when you meant subscribe?')
    }
    const result = {
      found: tree.find().fetch(),
      children: [],
    }
    if (tree.children) {
      tree.children.forEach(child => {
        const childResult = {
          found: new Map(),
        }
        result.children.push(childResult)
        result.found.forEach(parentResult => {
          childResult.found.set(parentResult, child.find(parentResult).fetch())
        })
        if (child.children) {
          throw new Error('Mock fetching of children of children not implemented yet')
        }
      })
      
    }
    return result
  }
}
