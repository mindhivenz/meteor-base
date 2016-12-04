import some from '@mindhive/some'
import { mockAppContext, appContext } from '@mindhive/di/test'

import { sinon } from '../mocha'

import { notAuthorizedError } from '../error'
import { MockApiRegistry } from '../test/mocks/mockApiRegistry'

import apiContextAuditModule, { UnhandledExceptionReporter } from './apiContextAuditModule'


describe('UnhandledExceptionReporter', () => {

  let apiContext
  let error
  let unhandledExceptionReporter

  beforeEach(() => {
    apiContext = {
      auditLog: sinon.spy(),
    }
    error = new Error(some.string())
    unhandledExceptionReporter = new UnhandledExceptionReporter()
  })

  it('should call apiContext.auditLog correctly', () => {
    unhandledExceptionReporter.onError(apiContext, error)
    apiContext.auditLog.should.have.been.calledWith({
      action: 'Unhandled exception',
      data: {
        exception: String(error),
        stack: error.stack,
      },
    })
  })

  it('should not call apiContext.auditLog when filtered', () => {
    unhandledExceptionReporter.registerHandledErrorFilter(e => e === error)
    unhandledExceptionReporter.onError(apiContext, error)
    apiContext.auditLog.should.not.have.been.called
  })

})

describe('apiContextAuditModule', () => {

  const modules = () => ({
    audit: {
      log: sinon.spy(),
    },
    apiRegistry: new MockApiRegistry(),
  })

  let error

  beforeEach(() => {
    error = new Error(some.string())
  })

  const givenApiContext = (viewer) => {
    const result = {
      isAuthenticated: () => !! viewer,
      viewer: () => viewer,
      connection: some.object(),
    }
    appContext.apiRegistry.mockEnhance(result)
    return result
  }

  const whenError = (apiContext) =>
    appContext.apiRegistry._errorEvent(apiContext, error)

  it('should call audit.log on error',
    mockAppContext(modules, () => {
      const viewer = some.object()
      apiContextAuditModule(appContext)
      const apiContext = givenApiContext(viewer)
      whenError(apiContext)
      appContext.audit.log.should.have.been.calledWith(
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
    mockAppContext(modules, () => {
      apiContextAuditModule(appContext)
      const apiContext = givenApiContext(null)
      whenError(apiContext)
      appContext.audit.log.should.have.been.calledWith(
        apiContext.connection,
        apiContext.apiName,
        null,
      )
    })
  )

  it('should not call audit.log when NOT_AUTHORIZED error',
    mockAppContext(modules, () => {
      apiContextAuditModule(appContext)
      error = notAuthorizedError()
      const apiContext = givenApiContext(null)
      whenError(apiContext)
      appContext.audit.log.should.not.have.been.called
    })
  )

})
