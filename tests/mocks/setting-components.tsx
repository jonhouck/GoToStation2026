/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
export const SettingSection = (props: any) => <div title={props.title}>{props.children}</div>
export const SettingRow = (props: any) => <div><label>{props.label}</label>{props.children}</div>
export const MapWidgetSelector = (props: any) => (
    <div data-testid="map-widget-selector">
        <button onClick={() => props.onSelect(['map1'])}>Select Map</button>
    </div>
)
