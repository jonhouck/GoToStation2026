/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'

export const JimuMapViewComponent = (props: any) => {
    React.useEffect(() => {
        if (props.onActiveViewChange) {
            props.onActiveViewChange({
                view: {
                    map: {
                        layers: {
                            find: () => undefined,
                            add: () => { },
                            removeAll: () => { }
                        },
                        add: () => { }
                    },
                    goTo: () => Promise.resolve()
                }
            })
        }
    }, [props.onActiveViewChange])
    return <div data-testid="jimu-map-view-component">{props.children}</div>
}
