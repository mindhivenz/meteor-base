import { app } from '@mindhive/di'
import some from '@mindhive/some'

import { Enhancer } from '../../enhancer'


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

export class MockApiRegistry {

  constructor() {
    this.methodFuncs = new Map()
    this.publicationFuncs = new Map()
    this.enhancer = new Enhancer()
  }

  onError() {}

  method(methodName, funcOrOptions) {
    if (this.methodFuncs.has(methodName)) {
      throw new ReferenceError(`More than one method with the name "${methodName}"`)
    }
    const serverFunc = typeof funcOrOptions === 'function' ?
      funcOrOptions
      : (funcOrOptions.universal || funcOrOptions.server)
    this.methodFuncs.set(methodName, serverFunc)
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

  subscribeCursor(recordSetName, subscription, ...args) {
    const func = this.publicationFuncs.get(recordSetName)
    if (! func) {
      throw new ReferenceError(`Unknown publication "${recordSetName}"`)
    }
    this.mockEnhance(subscription, recordSetName)
    return func(app(), subscription, ...args)
  }

  subscribe(recordSetName, subscription = new MockSubscription(), ...args) {
    const cursor = this.subscribeCursor(recordSetName, subscription, ...args)
    if (typeof cursor.fetch !== 'function') {
      throw new TypeError('Have you called subscribe when you meant subscribeComposite?')
    }
    return cursor.fetch()
  }

  subscribeComposite(recordSetName, subscription = new MockSubscription(), ...args) {
    const tree = this.subscribeCursor(recordSetName, subscription, ...args)
    if (typeof tree.fetch === 'function') {
      throw new TypeError('Have you called subscribeComposite when you meant subscribe?')
    }
    const result = {
      found: tree.find ? tree.find().fetch() : [],
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
