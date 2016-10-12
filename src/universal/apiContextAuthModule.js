import { notAuthorizedError } from '../error'


export const authEnhancer = {

  accessDenied(
    reason,
    { data, ...auditEntry } = {},
  ) {
    this.auditLog({
      action: 'Access denied',
      ...auditEntry,
      data: {
        reason,
        ...data,
      },
    })
    throw notAuthorizedError(reason)
  },
}

export default ({ apiRegistry }) => {
  apiRegistry.apiContextEnhancer(authEnhancer)
}
