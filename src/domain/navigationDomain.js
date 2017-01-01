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

  _relativeToAbsolutePathname(relativePathname) {
    let pathnameAddition = relativePathname
    if (this.location.pathname.endsWith('/')) {
      if (relativePathname.startsWith('/')) {
        pathnameAddition = relativePathname.substring(1)
      }
    } else {
      if (! relativePathname.startsWith('/')) {
        pathnameAddition = `/${relativePathname}`
      }
    }
    return this.location.pathname + pathnameAddition
  }

  pushDown(relativePathnameOrLocation) {
    const { pathname: relativePathname, ...locationRest } =
      this._pathnameOrLocationToBrowserLocation(relativePathnameOrLocation)
    this.push({ pathname: this._relativeToAbsolutePathname(relativePathname), ...locationRest })
  }

  popUp(dirCount = 1) {
    const { browserHistory } = app()
    if (this.atHistoryBeginning) {
      let popCount = dirCount
      let resultPathname = this.location.pathname
      while (popCount > 0) {
        const breakIndex = resultPathname.lastIndexOf('/')
        if (resultPathname === '/' || breakIndex === -1) {
          console.warn('pop dirCount too large, assuming root pathname')  // eslint-disable-line no-console
          resultPathname = '/'
          break
        }
        resultPathname = breakIndex === 0 ? '/' : resultPathname.substring(0, breakIndex)
        popCount -= 1
      }
      browserHistory.replace(resultPathname)  // Don't use our replace as we don't want to set our state marker so we will know we're still at the beginning
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
