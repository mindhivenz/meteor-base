import { app } from '@mindhive/di'
import some from '@mindhive/some'

import { ApiRegistry } from '../../apiRegistry'


export class MockApiContext {

  constructor({
    viewer,
    userId = viewer && viewer._id,
    connection = MockApiContext.mockConnection(),
  }) {
    this.userId = userId
    this.connection = connection
  }

  static mockConnection = (
    {
      id = some.string(),
      clientAddress = some.ipAddress(),
    } = {}
  ) => ({
    id,
    clientAddress,
  })
}

export class MockMethodInvocation extends MockApiContext {

  constructor(options) {
    super(options)
    this.isSimulation = false
  }
}

export class MockSubscription extends MockApiContext {
}

export class MockApiRegistry extends ApiRegistry {

  methodFuncs = new Map()
  publicationFuncs = new Map()

  method(methodName, funcOrOptions) {
    if (this.methodFuncs.has(methodName)) {
      throw new ReferenceError(`More than one method with the name "${methodName}"`)
    }
    const serverFunc = typeof funcOrOptions === 'function' ?
      funcOrOptions
      : (funcOrOptions.universal || funcOrOptions.server)
    this.methodFuncs.set(methodName, serverFunc)
  }

  publication(publicationName, funcOrOptions) {
    if (this.publicationFuncs.has(publicationName)) {
      throw new ReferenceError(`More than one publication with the name "${publicationName}"`)
    }
    const func = typeof funcOrOptions === 'function' ?
      funcOrOptions
      : funcOrOptions.server
    this.publicationFuncs.set(publicationName, func)
  }

  publicationComposite(...args) {
    this.publication(...args)
  }

  apiContextEnhancer(objOrFunc) {
    this.enhancer.registerEnhancement(objOrFunc)
  }

  mockEnhance(apiContext, includeInApiName = '') {
    this.enhancer.enhance(apiContext)
    apiContext.apiName = some.unique.string('apiName') + includeInApiName
  }

  call(methodName, methodInvocation = new MockMethodInvocation(), ...args) {
    const func = this.methodFuncs.get(methodName)
    if (! func) {
      throw new ReferenceError(`Unknown method name "${methodName}"`)
    }
    this.mockEnhance(methodInvocation, methodName)
    return func(app(), methodInvocation, ...args)
  }

  _subscribeCursor(publicationName, subscription, ...args) {
    const func = this.publicationFuncs.get(publicationName)
    if (! func) {
      throw new ReferenceError(`Unknown publication "${publicationName}"`)
    }
    this.mockEnhance(subscription, publicationName)
    return func(app(), subscription, ...args)
  }

  subscribe(publicationName, subscription = new MockSubscription(), ...args) {
    const cursor = this._subscribeCursor(publicationName, subscription, ...args)
    if (typeof cursor.fetch !== 'function') {
      throw new TypeError('Have you called subscribe when you meant subscribeComposite?')
    }
    return cursor.fetch()
  }

  subscribeComposite(publicationName, subscription = new MockSubscription(), ...args) {
    const tree = this._subscribeCursor(publicationName, subscription, ...args)
    if (typeof tree.fetch === 'function') {
      throw new TypeError('Have you called subscribeComposite when you meant subscribe?')
    }
    const cursor = tree.find()
    const result = {
      found: cursor ? cursor.fetch() : [],
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
