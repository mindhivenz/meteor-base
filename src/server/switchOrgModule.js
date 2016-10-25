import { check } from '../check'


const SUPER_USER = 'super-user'

const registerApi = (apiRegistry) => {

  apiRegistry.method('switchOrg.orgs.selectionList', {
    runInParallel: true,
    server:
      (
        { Orgs },
        methodInvocation,
      ) => {
        methodInvocation.ensureViewerHasRole(SUPER_USER)
        return Orgs.find(
          {},
          { fields: {
            name: 1,
          } },
        ).fetch()
      },
  })

  apiRegistry.method('switchOrg.viewer.switch', {
    server:
      (
        { Users },
        methodInvocation,
        { orgId },
      ) => {
        check(orgId, String)
        methodInvocation.ensureViewerHasRole(SUPER_USER)
        const user = methodInvocation.viewer()
        if (user.orgId !== orgId) {
          // Don't use UsersView because we're playing with what it restricts by
          Users.update(
            user._id,
            { $set: { orgId } },
          )
          methodInvocation.auditLog({
            action: 'User changed organisation',
            collection: Users,
            id: user._id,
            data: {
              old: { orgId: user.orgId },
              new: { orgId },
            },
          })
        }
      },
  })

}

export default ({ apiRegistry }) => {
  registerApi(apiRegistry)
}
