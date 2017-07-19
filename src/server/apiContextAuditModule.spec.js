import some from '@mindhive/some'
import { mockAppContext, app } from '@mindhive/di'

import { sinon } from '../mocha'

import { notAuthorizedError } from '../error'
import LogLevel from '../LogLevel'
import ApiRegistry from '../server/ApiRegistry'

import apiContextAuditModule, { UnhandledExceptionReporter } from './apiContextAuditModule'


const modules = () => ({
  Meteor: {
    isDevelopment: false,
  },
  audit: {
    log: sinon.spy(),
  },
  apiRegistry: new ApiRegistry(),
})

let error

describe('UnhandledExceptionReporter', () => {

  let apiContext
  let unhandledExceptionReporter

  beforeEach(() => {
    apiContext = {
      callArgs: some.object(),
      auditLog: sinon.spy(),
    }
    error = new Error(some.string())
    unhandledExceptionReporter = new UnhandledExceptionReporter()
  })

  it('should call apiContext.auditLog correctly',
    mockAppContext(modules, () => {
      unhandledExceptionReporter.onError(apiContext, error)
      apiContext.auditLog.should.have.been.calledWith({
        level: LogLevel.ERROR,
        action: 'Unhandled exception',
        data: {
          exception: error.stack,
          callArgs: apiContext.callArgs,
        },
      })
    })
  )

  it('should use string form of error if not stack trace',
    mockAppContext(modules, () => {
      error = some.string()
      unhandledExceptionReporter.onError(apiContext, error)
      apiContext.auditLog.firstCall.args[0].data.exception.should.equal(error)
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
      get isAuthenticated() { return !! viewer },
      viewer: () => viewer,
      connection: some.object(),
    }
    app().apiRegistry.enhanceApiContext(result, some.string(), some.object())
    return result
  }

  const whenError = apiContext =>
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
          level: LogLevel.ERROR,
          action: 'Unhandled exception',
          data: {
            exception: error.stack,
            callArgs: apiContext.callArgs,
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
