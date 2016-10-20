import { app } from '@mindhive/di'
import { untracked } from 'mobx'


class LocalContext {

  get userId() {
    return untracked(() => {
      const { viewerDomain } = app()
      return viewerDomain.user && viewerDomain.user._id
    })
  }
}

export default ({ apiRegistry }) => ({
  localContext(contextName) {
    const localContext = new LocalContext()
    apiRegistry.enhanceApiContext(localContext, `local:${contextName}`)
    return localContext
  },
})
