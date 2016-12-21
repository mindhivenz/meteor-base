import React from 'react'
import shallowEqual from 'shallowequal'


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

      domain

      componentWillMount() {
        this.domain = createDomain(this.props)
      }

      componentWillUpdate(nextProps) {
        if (shouldRecreateDomain(this.props, nextProps)) {
          this.stop()
          this.domain = createDomain(nextProps)
        } else if (this.domain && typeof this.domain.update === 'function') {
          this.domain.update(nextProps)
        }
      }

      componentWillUnmount() {
        this.stop()
      }

      stop() {
        if (this.domain && typeof this.domain.stop === 'function') {
          this.domain.stop()
        }
        this.domain = null
      }

      render() {
        return React.createElement(Component, { ...this.props, [propName]: this.domain })
      }
    }
