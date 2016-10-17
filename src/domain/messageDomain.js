import { observable, action, computed } from 'mobx'
import { app } from '@mindhive/di'

/* eslint-disable no-console */

class MessageDomain {

  @observable messages = []

  @computed get hasMessage() {
    return this.messages.length > 0
  }

  @computed get firstMessage() {
    return this.messages.length ? this.messages[0] : {}
  }

  @action show(title, message) {
    return new Promise((resolve) => {
      this.messages.push({
        title,
        message,
        resolve,
      })
    })
  }

  error(
    title,
    message,
    exception,
    context,
    auditData = null,
  ) {
    console.log(title, message)
    if (exception) {
      console.error(exception, exception.stack)
    }
    const data = auditData || {}
    if (exception) {
      data.exceptionMessage = String(exception)
      if (exception.stack) {
        data.stack = exception.stack
      }
    }
    app().api.optimisticCall(
      'audit.log',
      {
        context,
        entry: {
          action: title,
          data,
        },
      },
      { notifyViewerPending: false },
    )
    return this.show(title, message)
  }

  @action acknowledge(message) {
    this.messages.remove(message)
    message.resolve()
  }

}

export default () => ({
  messageDomain: new MessageDomain(),
})
