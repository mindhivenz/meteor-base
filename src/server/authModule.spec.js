import { initModules } from '@mindhive/di'
import { mockAppContext, appContext } from '@mindhive/di/test'
import some from '@mindhive/some'

import { sinon } from '../mocha'

import authModule from './authModule'


describe('authModule', () => {

  let connection
  let user

  beforeEach(() => {
    connection = some.object()
    user = some.object()
  })

  const modules = () =>
    initModules([
      () => ({
        Accounts: {
          validateLoginAttempt: sinon.spy(),
          onLogout: sinon.spy(),
        },
        audit: {
          log: sinon.spy(),
        },
      }),
      authModule,
    ])

  describe('validateAndAuditLogins', () => {

    let type
    let methodName
    let error

    beforeEach(() => {
      type = some.string()
      methodName = some.string()
      error = null
    })

    const whenCalledBack = () => {
      const callback = appContext.Accounts.validateLoginAttempt.firstCall.args[0]
      return callback({
        connection,
        user,
        type,
        methodName,
        error,
      })
    }

    it('should return true and log an auditEntry when login success',
      mockAppContext(modules, () => {
        const canLogIn = whenCalledBack()
        canLogIn.should.equal(true)
        appContext.audit.log.should.have.been.calledWith(
          connection,
          `call:${methodName}`,
          user,
          {
            action: 'Login success',
            data: {
              authService: type,
              errorMessage: null,
            },
          },
        )
      })
    )

    it('should log in audit generic context if no methodName provided',
      mockAppContext(modules, () => {
        methodName = null
        whenCalledBack()
        const logArgs = appContext.audit.log.firstCall.args
        logArgs[1].should.equal('callback:validateAndAuditLogins')
      })
    )

    it('should log an auditEntry when login failure',
      mockAppContext(modules, () => {
        const errorMessage = some.string()
        error = new Error(errorMessage)
        user = null
        whenCalledBack()
        const logEntry = appContext.audit.log.firstCall.args[3]
        logEntry.action.should.equal('Login failure')
        logEntry.data.errorMessage.should.contain(errorMessage)
      })
    )

    it('should return false and log an auditEntry when users is disabled',
      mockAppContext(modules, () => {
        error = null
        user.disabled = true
        const canLogIn = whenCalledBack()
        canLogIn.should.equal(false)
        const logEntry = appContext.audit.log.firstCall.args[3]
        logEntry.should.have.properties({
          action: 'Login denied: user disabled',
          data: {
            authService: type,
          },
        })
      })
    )

  })

  describe('onLogout', () => {

    const whenCalledBack = () => {
      const callback = appContext.Accounts.onLogout.firstCall.args[0]
      return callback({
        connection,
        user,
      })
    }

    it('should log an auditEntry',
      mockAppContext(modules, () => {
        whenCalledBack()
        appContext.audit.log.should.have.been.calledWith(
          connection,
          'callback:onLogout',
          user,
          {
            action: 'Logout',
          },
        )
      })
    )

  })

})
