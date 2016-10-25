import { app } from '@mindhive/di'
import { untracked } from 'mobx'


export class LocalContext {

  constructor(contextName) {
    this.userId = untracked(() => {
      const { viewerDomain } = app()
      return viewerDomain.user && viewerDomain.user._id
    })
    app().apiRegistry.enhanceApiContext(this, `local:${contextName}`)
  }
}
