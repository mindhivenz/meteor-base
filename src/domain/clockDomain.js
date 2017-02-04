import TickAtom from '@mindhive/mobx/TickAtom'


class ClockDomain {
  _perSecond = new TickAtom(1)
  _perTenSeconds = new TickAtom(10)

  get perSecond() {
    return this._perSecond.getCurrent()
  }

  get perTenSeconds() {
    return this._perTenSeconds.getCurrent()
  }
}

export default () => ({
  clockDomain: new ClockDomain(),
})
