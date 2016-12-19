

export const viewerEnhancer = (Users) => ({

  viewer() {
    if (! this.userId) {
      this.accessDenied('Not authenticated / logged in')
    }
    if (this.cachedViewerForUserId !== this.userId) {
      this._cacheViewer(Users.findOne(this.userId))
    }
    if (this.cachedViewer.disabled) {
      this.accessDenied('User is disabled')
    }
    return this.cachedViewer
  },

  isAuthenticated() {
    return !! this.userId
  },

  _cacheViewer(user) {
    if (! user) {
      throw new Error('Attempt to cache non-existent user for viewer')
    }
    this.cachedViewerForUserId = this.userId
    this.cachedViewer = user
  },

})

export default ({ apiRegistry, Users }) => {
  apiRegistry.apiContextEnhancer(viewerEnhancer(Users))
}
