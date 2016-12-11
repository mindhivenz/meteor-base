import { app } from '@mindhive/di'
import url from 'url'

import { HTTP_LOGIN_TOKEN_HEADER, HTTP_LOGIN_TOKEN_QUERY_PARAM } from '../universal/httpAuthFields'


export const parseRequestUrl = request => url.parse(request.originalUrl, true)

export class HttpContext {

  constructor(req) {
    const { apiRegistry, Random } = app()
    this.userId = null
    this.connection = {
      id: `http:${Random.id()}`,
      clientAddress: req.socket.remoteAddress,  // TODO: This needs to work behind proxies like this does: https://github.com/meteor/meteor/blob/5e32a127631f7a6d21e90ffaeec979e92e0c6aac/packages/ddp-server/livedata_server.js#L895
      httpHeaders: req.headers,
    }
    this._parsedUrl = parseRequestUrl(req)
    apiRegistry.enhanceApiContext(this, `http:${this._parsedUrl.pathname}`)
  }

  auth() {
    const { Accounts } = app()
    let token = this.connection.httpHeaders[HTTP_LOGIN_TOKEN_HEADER]
    if (! token) {
      token = this._parsedUrl.query[HTTP_LOGIN_TOKEN_QUERY_PARAM]
    }
    if (token) {
      const loginHandlerResult = Accounts._runLoginHandlers(this, { resume: token })
      Accounts._attemptLogin(this, 'httpAuth', [], loginHandlerResult)
    }
  }

  setUserId(userId) {
    this.userId = userId
  }
}
