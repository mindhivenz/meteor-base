import { app } from '@mindhive/di'

import { ClientApiRegistry } from '../client/clientApiRegistry'
import { HttpContext } from './httpContext'


export class ApiRegistry extends ClientApiRegistry {

  constructor(Meteor, WebApp) {
    super(Meteor)
    this.WebApp = WebApp
  }

  _publication(meteorPublishFunc, publicationName, funcOrOptions) {
    const options = typeof funcOrOptions === 'function' ?
      { server: funcOrOptions }
      : funcOrOptions
    const {
      server,
      autoPublish = false,
    } = options
    const self = this
    const wrapper = function wrapper(args) {
      const subscription = this
      self.enhanceApiContext(subscription, `pub:${publicationName}`, args)
      subscription.unblock()  // meteorhacks:unblock, see https://github.com/meteor/meteor/issues/853
      try {
        return server(app(), subscription, args)
      } catch (e) {
        self._errorEvent(subscription, e)
        throw e
      }
    }
    meteorPublishFunc(autoPublish ? null : publicationName, wrapper)
  }

  publication(publicationName, funcOrOptions) {
    this._publication(this.Meteor.publish, publicationName, funcOrOptions)
  }

  publicationComposite(publicationName, funcOrOptions) {
    this._publication(this.Meteor.publishComposite, publicationName, funcOrOptions)
  }

  http(path, func) {
    if (! this.WebApp) {
      throw new Error('You need to: meteor add webapp')
    }
    this.WebApp.connectHandlers.use(path, (req, res) => {
      const context = new HttpContext(req)
      try {
        context.auth()
        func(app(), context, req, res)
      } catch (e) {
        console.warn('Translating unhandled exception into HTTP 500', e)  // eslint-disable-line no-console
        this._errorEvent(context, e)
        if (res.headersSent) {
          console.warn('Failed to send HTTP error as headers already written')  // eslint-disable-line no-console
          context.auditLog({ action: 'Failed to send HTTP error as headers already written' })
        }
        res.statusCode = Number.isInteger(e.error) ? e.error : 500
        res.end()
      }
    })

  }
}
