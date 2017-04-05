import {
  observable,
  action as mobxAction,
  computed,
} from 'mobx'
import { app } from '@mindhive/di'

/* eslint-disable no-console */

export default class MessageStore {

  @observable messages = []

  @computed get firstMessage() {
    return this.messages[0]
  }

  @mobxAction addMessage({
    message,
    actionLabel = null,
    onAction = () => {},
  }) {
    const messageRecord = { message, actionLabel, onAction }
    this.messages.push(messageRecord)
    return messageRecord
  }

  addMessageAndAuditLog({
    message,
    actionLabel = null,
    onAction = () => {},
    exception = null,
    audit: {
      action,
      context,
      data = {},
    },
  }) {
    const { api } = app()
    console.log(message)
    if (exception) {
      console.error(exception, exception.stack)
    }
    if (exception) {
      data.exceptionMessage = String(exception)
      if (exception.stack) {
        data.stack = exception.stack
      }
    }
    api.optimisticCall(
      'audit.log',
      {
        context,
        entry: {
          action,
          data,
        },
      },
      { notifyViewerPending: false },
    )
    return this.addMessage({ message, actionLabel, onAction })
  }

  @mobxAction dismissMessage(message) {
    this.messages.remove(message)
  }
}
