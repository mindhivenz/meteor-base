import { app } from '@mindhive/di'


export const defaultValidateLoginDeniedReason = user =>
  user.disabled && 'user disabled'

export default (validateLoginDeniedReason = defaultValidateLoginDeniedReason) =>
  ({ Accounts }) => {

    Accounts.validateLoginAttempt(
      ({
        connection,
        user,
        type,
        error,
        methodName,
      }) => {
        const deniedReason = validateLoginDeniedReason(user)
        let action = 'Login success'
        if (error) {
          action = 'Login failure'
        } else if (deniedReason) {
          action = `Login denied: ${deniedReason}`
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
        return ! deniedReason
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
