import { app } from '@mindhive/di'

import { NOT_AUTHORIZED, VALIDATION_ERROR } from '../error'


export class UnhandledExceptionReporter {

  handledFilters = []

  onError = (apiContext, e) => {
    const { Meteor } = app()
    if (Meteor.isDevelopment) {
      console.warn(e)  // eslint-disable-line no-console
    }
    if (! this.handledFilters.some(f => f(e))) {
      const entry = {
        action: 'Unhandled exception',
        data: {
          exception: String(e),
        },
      }
      if (e.stack) {
        entry.data.stack = e.stack
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
        (this.isAuthenticated && this.isAuthenticated()) ? this.viewer() : null,
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
