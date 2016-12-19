import { computed } from 'mobx'
import { app } from '@mindhive/di'


const viewerEnhancer = {

  @computed get userId() {
    const { viewerDomain } = app()
    return viewerDomain.user && viewerDomain.user._id
  },

  viewer() {
    const { viewerDomain } = app()
    if (! viewerDomain.isAuthenticated) {
      this.accessDenied('Not authenticated / logged in')
    }
    return viewerDomain.user
  },

  get isAuthenticated() {
    return app().viewerDomain.isAuthenticated
  },
}

const exposeAddedPrototypeUserId = (apiContext) => {
  delete apiContext.userId
}

export default ({ apiRegistry }) => {
  apiRegistry.apiContextEnhancer(viewerEnhancer)
  apiRegistry.apiContextEnhancer(exposeAddedPrototypeUserId)
}
