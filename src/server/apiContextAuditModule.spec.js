import some from '@mindhive/some'
import { mockAppContext, app } from '@mindhive/di'

import { sinon } from '../mocha'

import { notAuthorizedError } from '../error'
import { MockApiRegistry } from '../test/mocks/mockApiRegistry'

import apiContextAuditModule, { UnhandledExceptionReporter } from './apiContextAuditModule'


const modules = () => ({
  Meteor: {
    isDevelopment: false,
  },
  audit: {
    log: sinon.spy(),
  },
  apiRegistry: new MockApiRegistry(),
})

let error

describe('UnhandledExceptionReporter', () => {

  let apiContext
  let unhandledExceptionReporter

  beforeEach(() => {
    apiContext = {
      auditLog: sinon.spy(),
    }
    error = new Error(some.string())
    unhandledExceptionReporter = new UnhandledExceptionReporter()
  })

  it('should call apiContext.auditLog correctly',
    mockAppContext(modules, () => {
      unhandledExceptionReporter.onError(apiContext, error)
      apiContext.auditLog.should.have.been.calledWith({
        action: 'Unhandled exception',
        data: {
          exception: String(error),
          stack: error.stack,
        },
      })
    })
  )

  it('should not call apiContext.auditLog when filtered',
    mockAppContext(modules, () => {
      unhandledExceptionReporter.registerHandledErrorFilter(e => e === error)
      unhandledExceptionReporter.onError(apiContext, error)
      apiContext.auditLog.should.not.have.been.called
    })
  )

})

describe('apiContextAuditModule', () => {

  beforeEach(() => {
    error = new Error(some.string())
  })

  const givenApiContext = (viewer) => {
    const result = {
      isAuthenticated: () => !! viewer,
      viewer: () => viewer,
      connection: some.object(),
    }
    app().apiRegistry.mockEnhance(result)
    return result
  }

  const whenError = (apiContext) =>
    app().apiRegistry._errorEvent(apiContext, error)

  it('should call audit.log on error',
    mockAppContext(modules, ({ audit }) => {
      const viewer = some.object()
      apiContextAuditModule(app())
      const apiContext = givenApiContext(viewer)
      whenError(apiContext)
      audit.log.should.have.been.calledWith(
        apiContext.connection,
        apiContext.apiName,
        viewer,
        {
          action: 'Unhandled exception',
          data: {
            exception: String(error),
            stack: error.stack,
          },
        }
      )
    })
  )

  it('should handle no viewer',
    mockAppContext(modules, ({ audit }) => {
      apiContextAuditModule(app())
      const apiContext = givenApiContext(null)
      whenError(apiContext)
      audit.log.should.have.been.calledWith(
        apiContext.connection,
        apiContext.apiName,
        null,
      )
    })
  )

  it('should not call audit.log when NOT_AUTHORIZED error',
    mockAppContext(modules, ({ audit }) => {
      apiContextAuditModule(app())
      error = notAuthorizedError()
      const apiContext = givenApiContext(null)
      whenError(apiContext)
      audit.log.should.not.have.been.called
    })
  )

})
