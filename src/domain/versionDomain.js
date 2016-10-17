import { observable, computed } from 'mobx'
import format from 'date-fns/format'
import getYear from 'date-fns/get_year'


class VersionDomain {

  @observable version
  @observable releaseInfo
  @observable copyrightYear

  constructor(
    { version = 'unknown', release = {} } = {},
    copyrightDate,
  ) {
    this.version = version
    this.releaseInfo = release
    this.copyrightYear = getYear(copyrightDate)
  }

  @computed get number() {
    return this.version
  }

  @computed get releaseBy() {
    const { by = null } = this.releaseInfo
    return by
  }

  @computed get releaseOn() {
    const { on = null } = this.releaseInfo
    return on && format(on, 'D/M/YY, hh:mm a')
  }
}

export default ({ Meteor }) => ({
  // Using new Date() rather than clock() because we won't have synced to the server yet
  versionDomain: new VersionDomain(Meteor.settings.public, new Date()),
})
