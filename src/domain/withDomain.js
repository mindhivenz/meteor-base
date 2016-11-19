import React from 'react'
import shallowEqual from 'shallowequal'


export const withDomain = ({
  domainClass,
  mapPropsToArg,
  mapPropsToArgsArray = props => mapPropsToArg ? [mapPropsToArg(props)] : [],
  createDomain = props => new domainClass(...mapPropsToArgsArray(props)),  // eslint-disable-line new-cap
  propName = 'domain',
  shouldRecreateDomain = (currentProps, nextProps) =>
    ! shallowEqual(mapPropsToArgsArray(currentProps), mapPropsToArgsArray(nextProps)),
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
        }
      }

      componentWillUnmount() {
        this.stop()
        this.domain = null
      }

      stop() {
        if (this.domain && typeof this.domain.stop === 'function') {
          this.domain.stop()
        }
      }

      render() {
        return React.createElement(Component, { ...this.props, [propName]: this.domain })
      }
    }
