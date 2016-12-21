import React from 'react'
import shallowEqual from 'shallowequal'
import { autorun } from 'mobx'


export const withDomain = ({
  domainClass,
  mapPropsToArgs = props => ({}),                                  // eslint-disable-line no-unused-vars
  createDomain = props => new domainClass(mapPropsToArgs(props)),  // eslint-disable-line new-cap
  propName = 'domain',
  shouldRecreateDomain = (currentProps, nextProps) =>
    ! shallowEqual(mapPropsToArgs(currentProps), mapPropsToArgs(nextProps)),
}) =>
  Component =>
    class DomainProvider extends React.Component {

      static displayName = domainClass.name

      componentWillMount() {
        this._createDomain(this.props)
      }

      componentWillReceiveProps(nextProps) {
        if (shouldRecreateDomain(this.props, nextProps)) {
          this.stop()
          this._createDomain(nextProps)
        } else if (this.state.domain && typeof this.state.domain.update === 'function') {
          this.state.domain.update(nextProps)
        }
      }

      componentWillUnmount() {
        this.stop()
      }

      _createDomain(props) {
        if (this.state && this.state.domain != null) {
          throw new Error('Expect domain to be uninitialized here')
        }
        if (this.autorunDisposer != null) {
          throw new Error('Expect no existing autorun here')
        }
        this.autorunDisposer = autorun(`DomainProvider creating ${domainClass.name}`, () => {
          this.setState({ domain: createDomain(props) })
        })
      }

      stop() {
        if (this.autorunDisposer) {
          this.autorunDisposer()
        }
        if (this.state.domain && typeof this.state.domain.stop === 'function') {
          this.state.domain.stop()
        }
        this.setState({ domain: null })
      }

      render() {
        return React.createElement(Component, { ...this.props, [propName]: this.state.domain })
      }
    }
