import { app } from '@mindhive/di'

import { HTTP_LOGIN_TOKEN_HEADER, HTTP_LOGIN_TOKEN_QUERY_PARAM } from '../universal/httpAuthFields'


const getLoginToken = () =>
  app().Accounts._storedLoginToken()

const tokenDict = (key) => {
  const token = getLoginToken()
  if (! token) {
    return {}
  }
  return {
    [key]: token,
  }
}

const loginToken = {

  headers() {
    return tokenDict(HTTP_LOGIN_TOKEN_HEADER)
  },

  queryParams() {
    return tokenDict(HTTP_LOGIN_TOKEN_QUERY_PARAM)
  },
}

export default () => ({
  loginToken,
})
