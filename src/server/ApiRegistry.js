import { app } from '@mindhive/di'

import ClientApiRegistry from '../client/ClientApiRegistry'
import HttpContext from './HttpContext'
import renamePublicationCollection from './renamePublicationCollection'


const isCursor = o => typeof o === 'object' && typeof o.fetch === 'function'

export default class ApiRegistry extends ClientApiRegistry {

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
    const options = typeof funcOrOptions === 'function' ?
      { server: funcOrOptions }
      : funcOrOptions
    const {
      server,
      collectionName = null,  // Overrides the collection name sent to client
      publishesThroughSubscriptionMethods = false,
      ...otherOptions,
    } = options
    const func = (appContext, subscription, args) => {
      const result = server(appContext, subscription, args)
      if (result) {
        if (collectionName) {
          if (! isCursor(result)) {
            throw new Error(`Cannot rename a publication result from ${publicationName} that is not a cursor`)
          }
          return renamePublicationCollection({
            subscription,
            collectionName,
            cursor: result,
          })
        } else if (isCursor(result) || Array.isArray(result)) {
          return result
        }
        throw new Error(`Unexpected result from ${publicationName} that is not a cursor`)
      }
      if (publishesThroughSubscriptionMethods) {
        return result
      }
      return []  // How to return nothing from a publication
    }
    this._publication(
      this.Meteor.publish,
      publicationName,
      {
        server: func,
        ...otherOptions,
      },
    )
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
