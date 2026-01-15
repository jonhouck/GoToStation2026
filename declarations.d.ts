/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
declare module 'jimu-core' {
    export const React: any;
    export type AllWidgetProps<T> = any;
    export const FormattedMessage: any;
    export const defaultMessages: any;
    export const css: any;
    export const jsx: any;
    export type ImmutableObject<T> = T & {
        set: (key: string, val: any) => ImmutableObject<T>;
    }
}

declare module 'react' {
    interface Attributes {
        css?: any;
    }
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
        css?: any;
    }
}

declare module 'jimu-ui' {
    export const Tabs: any;
    export const Tab: any;
    export const Button: any;
    export const TextInput: any;
}

declare module 'jimu-ui/advanced/setting-components' {
    export const SettingSection: any;
    export const SettingRow: any;
}

declare module 'jimu-theme' {
    export const styled: any;
}

declare module 'jimu-for-builder' {
    export type AllWidgetSettingProps<T> = any;
}
