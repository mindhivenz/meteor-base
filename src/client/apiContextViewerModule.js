import { app } from '@mindhive/di'


const viewerEnhancer = {

  get userId() {
    const { viewerStore } = app()
    return viewerStore.user && viewerStore.user._id
  },

  viewer() {
    const { viewerStore } = app()
    this.ensureAuthenticated()
    return viewerStore.user
  },

  get isAuthenticated() {
    const { viewerStore } = app()
    return viewerStore.isAuthenticated
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
