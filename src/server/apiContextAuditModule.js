import { app } from '@mindhive/di'

import { NOT_AUTHORIZED, VALIDATION_ERROR } from '../error'


export class UnhandledExceptionReporter {

  handledFilters = []

  onError = (apiContext, e) => {
    const { Meteor } = app()
    const errorHandled = this.handledFilters.some(f => f(e))
    if (Meteor.isDevelopment) {
      if (errorHandled) {
        console.log('handled:', apiContext.apiName, e)  // eslint-disable-line no-console
      } else {
        console.error('UNHANDLED:', apiContext.apiName, e)  // eslint-disable-line no-console
      }
    }
    if (! errorHandled) {
      const entry = {
        action: 'Unhandled exception',
        data: {
          callArgs: apiContext.callArgs,
          exception: e.stack || String(e),
        },
      }
      apiContext.auditLog(entry)
    }
  }

  registerHandledErrorFilter = (handledFilter) => {
    this.handledFilters.push(handledFilter)
  }
}

const registerApi = (apiRegistry) => {

  apiRegistry.apiContextEnhancer({
    auditLog(entry) {
      app().audit.log(
        this.connection,
        this.apiName,
        this.isAuthenticated ? this.viewer() : null,
        entry,
      )
    },
  })
}

const HANDLED_ERRORS = [NOT_AUTHORIZED, VALIDATION_ERROR]

export default ({ apiRegistry }) => {
  registerApi(apiRegistry)
  const unhandledExceptionReporter = new UnhandledExceptionReporter()
  unhandledExceptionReporter.registerHandledErrorFilter(e => HANDLED_ERRORS.includes(e.error))
  apiRegistry.onError(unhandledExceptionReporter.onError)
  return {
    unhandledExceptionReporter,
  }
}
