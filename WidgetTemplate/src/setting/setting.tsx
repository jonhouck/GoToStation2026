import { React } from 'jimu-core'
import type { AllWidgetSettingProps } from 'jimu-for-builder'
import { SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { TextInput } from 'jimu-ui'
import type { IMConfig } from '../config'
import defaultMessages from './translations/default'

export default class Setting extends React.PureComponent<AllWidgetSettingProps<IMConfig>, unknown> {
  updateConfig = (key: string, value: string) => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set(key, value)
    })
  }

  onFeederUrlChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.updateConfig('feederUrl', evt.target.value)
  }

  onFeederLayerUrlChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.updateConfig('feederLayerUrl', evt.target.value)
  }

  onRouteLayerUrlChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.updateConfig('routeLayerUrl', evt.target.value)
  }

  render() {
    return <div className="widget-setting-demo">
      <SettingSection title="Map Services">
        <SettingRow label={defaultMessages.feederUrl}>
          <TextInput
            value={this.props.config.feederUrl || ''}
            onChange={this.onFeederUrlChange}
          />
        </SettingRow>
        <SettingRow label={defaultMessages.feederLayerUrl}>
          <TextInput
            value={this.props.config.feederLayerUrl || ''}
            onChange={this.onFeederLayerUrlChange}
          />
        </SettingRow>
        <SettingRow label={defaultMessages.routeLayerUrl}>
          <TextInput
            value={this.props.config.routeLayerUrl || ''}
            onChange={this.onRouteLayerUrlChange}
          />
        </SettingRow>
      </SettingSection>
    </div>
  }
}
