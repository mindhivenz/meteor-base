

export const rolesEnhancer = Roles => ({

  viewerHasRole(roles, group) {
    return Roles.userIsInRole(this.viewer(), roles, group)
  },

  ensureViewerHasRole(roles, group) {
    if (! this.viewerHasRole(roles, group)) {
      this.accessDenied(`Viewer not ${Array.isArray(roles) ? `any of ${roles.join(', ')}` : `a ${roles}`}`)
    }
  },
})

export default ({ apiRegistry }) => {
  const { Roles } = global
  apiRegistry.apiContextEnhancer(rolesEnhancer(Roles))
  return {
    Roles,
  }
}
