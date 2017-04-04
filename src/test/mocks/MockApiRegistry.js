import { app } from '@mindhive/di'
import some from '@mindhive/some'
import assert from 'assert'

import { parseRequestUrl } from '../../server/HttpContext'
import Enhancer from '../../Enhancer'


export class MockApiContext {

  constructor(
    {
      viewer,
      userId = viewer && viewer._id,
      connection = MockApiContext.mockConnection(),
    } = {},
  ) {
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
  isSimulation = false
}

export class MockSubscription extends MockApiContext {
}

export class MockHttpContext extends MockApiContext {
}

export default class MockApiRegistry {
  enhancer = new Enhancer()
  methodFuncs = new Map()
  publicationFuncs = new Map()
  httpFuncs = []

  onError() {
    // REVISIT: should we replicate this functionality?
  }

  method(methodName, funcOrOptions) {
    if (this.methodFuncs.has(methodName)) {
      throw new Error(`More than one method with the name "${methodName}"`)
    }
    const serverFunc = typeof funcOrOptions === 'function' ?
      funcOrOptions
      : (funcOrOptions.universal || funcOrOptions.server)
    this.methodFuncs.set(methodName, serverFunc)
  }

  _publication(meteorPublishFunc, publicationName, funcOrOptions) {
    if (this.publicationFuncs.has(publicationName)) {
      throw new Error(`More than one publication with the name "${publicationName}"`)
    }
    const func = typeof funcOrOptions === 'function' ?
      funcOrOptions
      : funcOrOptions.server
    this.publicationFuncs.set(publicationName, func)
  }

  http(path, func) {
    this.httpFuncs.push({ path, func })
  }

  apiContextEnhancer(objOrFunc) {
    this.enhancer.registerEnhancement(objOrFunc)
  }

  enhanceApiContext(apiContext, includeInApiName = '', callArgs) {
    apiContext.apiName = some.unique.string('apiName') + includeInApiName
    apiContext.callArgs = callArgs
    this.enhancer.enhance(apiContext, { enhancePrototypes: false })
  }

  call(methodName, methodInvocation = new MockMethodInvocation(), args) {
    const func = this.methodFuncs.get(methodName)
    if (! func) {
      throw new Error(`Unknown method name "${methodName}"`)
    }
    this.enhanceApiContext(methodInvocation, methodName, args)
    return func(app(), methodInvocation, args)
  }

  _subscribeCursor(publicationName, subscription, args) {
    const func = this.publicationFuncs.get(publicationName)
    if (! func) {
      throw new Error(`Unknown publication "${publicationName}"`)
    }
    this.enhanceApiContext(subscription, publicationName, args)
    return func(app(), subscription, args)
  }

  subscribe(publicationName, subscription = new MockSubscription(), args) {
    const cursor = this._subscribeCursor(publicationName, subscription, args)
    if (! cursor) {
      return []
    }
    if (typeof cursor.fetch !== 'function') {
      throw new TypeError('Have you called subscribe when you meant subscribeComposite?')
    }
    return cursor.fetch()
  }

  subscribeComposite(publicationName, subscription = new MockSubscription(), args) {
    const tree = this._subscribeCursor(publicationName, subscription, args)
    if (typeof tree.fetch === 'function') {
      throw new TypeError('Have you called subscribeComposite when you meant subscribe?')
    }
    const cursor = tree.find()
    const result = {
      found: cursor ? cursor.fetch() : [],
      children: [],
    }
    if (tree.children) {
      tree.children.forEach((child) => {
        const childResult = {
          found: new Map(),
        }
        result.children.push(childResult)
        result.found.forEach((parentResult) => {
          childResult.found.set(parentResult, child.find(parentResult).fetch())
        })
        if (child.children) {
          throw new Error('Mock fetching of children of children not implemented yet')
        }
      })
    }
    return result
  }

  // See https://github.com/howardabrams/node-mocks-http#createrequest
  // You have to add node-mocks-http to your own project to use this method (lazy required)
  httpRequest(requestOptions, context = new MockHttpContext()) {
    const httpMocks = require('node-mocks-http')  // eslint-disable-line global-require
    const { req, res } = httpMocks.createMocks(requestOptions, {})
    const pathname = parseRequestUrl(req).pathname
    // Match Meteor's logic: https://docs.meteor.com/packages/webapp.html
    const httpFunc = this.httpFuncs.find(({ path }) =>
      pathname === path
      || pathname.startsWith(`${path}/`)
      || pathname.startsWith(`${path}.`)
    )
    if (! httpFunc) {
      throw new Error(`No matching HTTP path ${pathname}, searched: ${this.httpFuncs.map(h => h.path)}`)
    }
    this.enhanceApiContext(context, pathname)
    try {
      httpFunc.func(app(), context, req, res)
    } catch (e) {
      assert.equal(res.headersSent, false, `Must not have written to the response if throwing an exception: ${e}`)
      throw e
    }
    return res
  }
}
