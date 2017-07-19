import {
  observable,
  action as mobxAction,
  computed,
  when,
} from 'mobx'
import { app } from '@mindhive/di'

import LogLevel from '../LogLevel'

/* eslint-disable no-console */

class Message {
  message
  actionLabel
  onAction
  @observable show = true

  constructor(
    {
      message,
      actionLabel = null,
      onAction = null,
      cancelWhen = null,
    },
    store,
  ) {
    this.message = message
    this.actionLabel = actionLabel
    this.onAction = onAction
    this.store = store
    if (cancelWhen) {
      this.cancelDisposer = when(
        'Cancel message',
        cancelWhen,
        () => { this.stop() },
      )
    }
  }

  @mobxAction stop() {
    this.store.messages.remove(this)
    this.show = false
    if (this.cancelDisposer) {
      this.cancelDisposer()
    }
  }
}

export default class MessageStore {

  @observable messages = []

  @computed get firstMessage() {
    return this.messages.length > 0 ? this.messages[0] : undefined
  }

  @mobxAction addMessage(options) {
    const message = new Message(options, this)
    this.messages.push(message)
    return message
  }

  addMessageAndAuditLog({
    message,
    actionLabel = null,
    onAction = () => {},
    exception = null,
    audit: {
      level = LogLevel.INFO,  // Don't use ERROR when exception, only use ERROR when ops should be notified
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
          level: level.name,
          action,
          data,
        },
      },
      { notifyViewerPending: false },
    )
    return this.addMessage({ message, actionLabel, onAction })
  }
}
