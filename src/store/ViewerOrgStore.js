import {
  observable,
} from 'mobx'
import { app } from '@mindhive/di'

import ViewerStore from './ViewerStore'


export default class ViewerOrgStore extends ViewerStore {

  @observable.ref org = null

  _applyFromServer(user) {
    super._applyFromServer(user)
    this.org = user && app().Orgs.findOne(user.orgId)
  }

  _applyFromOfflineState(state) {
    super._applyFromOfflineState(state)
    this.org = state.org
  }

  _buildOfflineState(state) {
    super._buildOfflineState(state)
    state.org = this.org
  }

}
