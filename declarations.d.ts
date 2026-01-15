/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
declare module 'jimu-core' {
    import React from 'react';
    export { React };
    export type AllWidgetProps<T> = any;
    export const FormattedMessage: any;
    export const defaultMessages: any;
    export const css: any;
    export const jsx: any;
}

declare module 'jimu-ui' {
    export const Tabs: any;
    export const Tab: any;
    export const Button: any;
}

declare module 'jimu-theme' {
    export const styled: any;
}

declare module 'jimu-for-builder' {
    export type AllWidgetSettingProps<T> = any;
}
