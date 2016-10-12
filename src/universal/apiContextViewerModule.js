

export const viewerEnhancer = (Users) => ({

  viewer() {
    if (! this.userId) {
      this.accessDenied('Not authenticated / logged in')
    }
    if (this.cachedViewerForUserId !== this.userId) {
      this.cachedViewerForUserId = this.userId
      this.cachedViewer = Users.findOne(this.userId)
      if (this.cachedViewer.disabled) {
        this.accessDenied('User is disabled')
      }
    }
    return this.cachedViewer
  },

  isAuthenticated() {
    return !! this.userId
  },
})

export default ({ apiRegistry, Users }) => {
  apiRegistry.apiContextEnhancer(viewerEnhancer(Users))
}
