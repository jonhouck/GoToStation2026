/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
export const SettingSection = (props: any) => <div title={props.title}>{props.children}</div>
export const SettingRow = (props: any) => <div><label>{props.label}</label>{props.children}</div>
