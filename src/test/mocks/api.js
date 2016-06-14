import { inject } from '@mindhive/di'


export class MockApiContext {

  constructor(options = {}) {
    this.viewerUser = options.viewer
    this.userId = options.userId || (options.viewer && options.viewer._id)
  }

  viewer() {
    return this.viewerUser
  }

  viewerHasRole(roles, group) {
    return global.Roles.userIsInRole(this.viewer(), roles, group)
  }

  ensureViewerHasRole(roles, group) {
    if (! this.viewerHasRole(roles, group)) {
      throw new global.Meteor.Error('not-authorized', 'You are not authorized')
    }
  }
}

export class MockMethodInvocation extends MockApiContext {

  constructor(options = {}) {
    super(options)
    this.isSimulation = false
  }
}

export class MockSubscription extends MockApiContext {

}

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

  call(methodName, methodInvocation = new MockMethodInvocation(), ...args) {
    const func = this.methodFuncs.get(methodName)
    if (! func) {
      throw new ReferenceError(`Unknown method name "${methodName}"`)
    }
    return inject(func)(
      methodInvocation,
      ...args
    )
  }

  subscribe(recordSetName, subscription = new MockSubscription(), ...args) {
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

  subscribeComposite(recordSetName, subscription = new MockSubscription(), ...args) {
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
