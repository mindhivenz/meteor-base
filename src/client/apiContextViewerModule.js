import { app } from '@mindhive/di'


const viewerEnhancer = {

  get userId() {
    const { viewerDomain } = app()
    return viewerDomain.user && viewerDomain.user._id
  },

  viewer() {
    const { viewerDomain } = app()
    this.ensureAuthenticated()
    return viewerDomain.user
  },

  get isAuthenticated() {
    const { viewerDomain } = app()
    return viewerDomain.isAuthenticated
  },

  ensureAuthenticated() {
    if (! this.isAuthenticated) {
      this.accessDenied('Not authenticated / logged in')
    }
  }

}

const exposeAddedPrototypeUserId = (apiContext) => {
  delete apiContext.userId
}

export default ({ apiRegistry }) => {
  apiRegistry.apiContextEnhancer(viewerEnhancer)
  apiRegistry.apiContextEnhancer(exposeAddedPrototypeUserId)
}
