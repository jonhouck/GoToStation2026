/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Setting from '../WidgetTemplate/src/setting/setting'
import React from 'react'
import defaultMessages from '../WidgetTemplate/src/setting/translations/default'

// Mock jimu-ui components
vi.mock('jimu-ui', () => ({
    TextInput: (props: { value: string; onChange: (e: any) => void }) => <input data-testid="text-input" value={props.value} onChange={props.onChange} />
}))

// Mock setting components
vi.mock('jimu-ui/advanced/setting-components', () => ({
    SettingSection: ({ children, title }: { children: React.ReactNode; title: string }) => <div title={title}>{children}</div>,
    SettingRow: ({ children, label }: { children: React.ReactNode; label: string }) => <div><label>{label}</label>{children}</div>
}))

describe('Setting Component', () => {
    it('renders all 3 inputs with correct labels', () => {
        const props = {
            id: 'widget_1',
            config: {
                feederUrl: 'http://feeder',
                feederLayerUrl: 'http://layer',
                routeLayerUrl: 'http://route',
                set: vi.fn()
            },
            onSettingChange: vi.fn()
        } as any

        render(<Setting {...props} />)

        // Check Labels
        expect(screen.getByText(defaultMessages.feederUrl)).toBeDefined()
        expect(screen.getByText(defaultMessages.feederLayerUrl)).toBeDefined()
        expect(screen.getByText(defaultMessages.routeLayerUrl)).toBeDefined()

        // Check Values
        const inputs = screen.getAllByTestId('text-input')
        expect(inputs).toHaveLength(3)
        expect((inputs[0] as HTMLInputElement).value).toBe('http://feeder')
        expect((inputs[1] as HTMLInputElement).value).toBe('http://layer')
        expect((inputs[2] as HTMLInputElement).value).toBe('http://route')
    })

    it('updates config when input changes', () => {
        const setMock = vi.fn().mockImplementation((key, val) => {
            return { ...props.config, [key]: val }
        })

        const props = {
            id: 'widget_1',
            config: {
                feederUrl: '',
                feederLayerUrl: '',
                routeLayerUrl: '',
                set: setMock
            },
            onSettingChange: vi.fn()
        } as any

        render(<Setting {...props} />)

        const inputs = screen.getAllByTestId('text-input')
        const feederInput = inputs[0] // First input is feederUrl

        fireEvent.change(feederInput, { target: { value: 'http://new-feeder' } })

        expect(setMock).toHaveBeenCalledWith('feederUrl', 'http://new-feeder')
        expect(props.onSettingChange).toHaveBeenCalledWith(expect.objectContaining({
            id: 'widget_1',
            config: expect.objectContaining({ feederUrl: 'http://new-feeder' })
        }))
    })
})
