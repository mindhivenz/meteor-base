

export const viewerEnhancer = Users => ({

  viewer() {
    this.ensureAuthenticated()
    if (this.cachedViewerForUserId !== this.userId) {
      const user = Users.findOne(this.userId)
      if (! user) {
        throw new Error(`No user found for id ${this.userId}`)
      }
      this.cachedViewerForUserId = this.userId
      this.cachedViewer = user
    }
    if (this.cachedViewer.disabled) {
      this.accessDenied('User is disabled')
    }
    return this.cachedViewer
  },

  get isAuthenticated() {
    return !! this.userId
  },

  ensureAuthenticated() {
    if (! this.isAuthenticated) {
      this.accessDenied('Not authenticated / logged in')
    }
  }

})

export default ({ apiRegistry, Users }) => {
  apiRegistry.apiContextEnhancer(viewerEnhancer(Users))
}
