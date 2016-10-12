import { app } from '@mindhive/di'

import { NOT_AUTHORIZED } from '../error'


export class UnhandledExceptionReporter {

  handledFilters = []

  onError = (apiContext, e) => {
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

export default ({ apiRegistry }) => {
  registerApi(apiRegistry)
  const unhandledExceptionReporter = new UnhandledExceptionReporter()
  unhandledExceptionReporter.registerHandledErrorFilter(e => e.error === NOT_AUTHORIZED)
  apiRegistry.onError(unhandledExceptionReporter.onError)
  return {
    unhandledExceptionReporter,
  }
}
