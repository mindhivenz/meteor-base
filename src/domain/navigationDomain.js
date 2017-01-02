import { observable, action, asReference, when } from 'mobx'
import { app } from '@mindhive/di'


class NavigationDomain {

  @observable location = {
    pathname: null,
    state: asReference({}),  // asReference as state is not altered internally
  }
  @observable atHistoryBeginning = true

  constructor() {
    const { browserHistory } = app()
    this._locationChanged(browserHistory.getCurrentLocation())  // TODO: browserHistory.location in reactRouter v4
    browserHistory.listen((location) => {
      this._locationChanged(location)
    })
  }

  @action _locationChanged(browserLocation) {
    this.location.pathname = browserLocation.pathname
    this.location.state = browserLocation.state == null ? {} : browserLocation.state
    this.atHistoryBeginning = browserLocation.state == null
  }

  _pathnameOrLocationToBrowserLocation(pathnameOrLocation) {
    const location = typeof pathnameOrLocation === 'string' || typeof pathnameOrLocation === 'number' ?
      { pathname: String(pathnameOrLocation) }
      : pathnameOrLocation
    if (location.state == null) {
      // ensure there is always state so we know when we are at the first page in this history
      location.state = {}
    }
    return location
  }

  push(pathnameOrLocation) {
    app().browserHistory.push(this._pathnameOrLocationToBrowserLocation(pathnameOrLocation))
  }

  replace(pathnameOrLocation) {
    app().browserHistory.replace(this._pathnameOrLocationToBrowserLocation(pathnameOrLocation))
  }

  _joinPaths(path1, path2) {
    let path2Addition = path2
    if (path1.endsWith('/')) {
      if (path2.startsWith('/')) {
        path2Addition = path2.substring(1)
      }
    } else {
      if (! path2.startsWith('/')) {
        path2Addition = `/${path2}`
      }
    }
    return path1 + path2Addition
  }

  // If dirCount is >= 0 then the number of directories in the URL to keep
  // If dirCount is < 0 then the number of directories to remove
  // Prefer specific positive numbers to avoid issues with quick double actions performing using the wrong state
  _keepDirs(dirCount) {
    if (dirCount === 0) {
      return '/'
    }
    return this.location.pathname.split('/').slice(0, dirCount > 0 ? dirCount + 1 : dirCount).join('/')
  }

  pushDown(dirsToKeep, relativePathnameOrLocation) {
    const { pathname: relativePathname, ...locationRest } =
      this._pathnameOrLocationToBrowserLocation(relativePathnameOrLocation)
    this.push({
      pathname: this._joinPaths(this._keepDirs(dirsToKeep), relativePathname),
      ...locationRest,
    })
  }

  popUp(dirs = -1) {
    const { browserHistory } = app()
    if (this.atHistoryBeginning) {
      // Don't use our replace as we don't want to set our state marker so we will know we're still at the beginning
      browserHistory.replace(this._keepDirs(dirs))
    } else {
      browserHistory.goBack()
    }
  }

  whenNavigateAway(callback) {
    const originalPathname = this.location.pathname
    when(
      () => this.location.pathname !== originalPathname,
      callback,
    )
  }
}

export default () => ({
  navigationDomain: new NavigationDomain(),
})
