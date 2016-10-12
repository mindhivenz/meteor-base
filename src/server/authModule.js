import { app } from '@mindhive/di'


export default ({ Accounts }) => {

  Accounts.validateLoginAttempt(
    ({
      connection,
      user,
      type,
      error,
      methodName,
    }) => {
      const userDisabled = user && user.disabled
      let action = 'Login success'
      if (error) {
        action = 'Login failure'
      } else if (userDisabled) {
        action = 'Login denied: user disabled'
      }
      app().audit.log(
        connection,
        methodName ? `call:${methodName}` : 'callback:validateAndAuditLogins',
        user,
        {
          action,
          data: {
            authService: type,
            errorMessage: error ? error.toString() : null,
          },
        }
      )
      return ! userDisabled
    }
  )

  Accounts.onLogout(
    ({
      connection,
      user,
    }) => {
      app().audit.log(
        connection,
        'callback:onLogout',
        user,
        {
          action: 'Logout',
        }
      )
    }
  )

}
