/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import Widget from '../WidgetTemplate/src/runtime/widget'
import { React } from 'jimu-core'

// Mock jimu-ui components
vi.mock('jimu-ui', () => ({
    TextInput: (props: any) => <input data-testid="text-input" value={props.value} onChange={props.onChange} placeholder={props.placeholder} />,
    Select: (props: any) => <select data-testid="select" value={props.value} onChange={props.onChange}>{props.children}</select>,
    Option: (props: any) => <option value={props.value}>{props.children}</option>,
    Button: (props: any) => <button onClick={props.onClick}>{props.children}</button>,
    Label: (props: any) => <label>{props.children}</label>
}))

describe('Widget UI', () => {
    it('renders all required inputs', () => {
        // Mock props
        const props: any = {
            config: {},
            theme: { sys: { color: { primary: { light: 'blue' } } } }
        }

        render(<Widget {...props} /> as any)

        // Check for Feeder Select
        expect(screen.getByText('Feeder')).toBeDefined()
        expect(screen.getByTestId('select')).toBeDefined()

        // Check for Reach Input
        expect(screen.getByText('Reach (Optional)')).toBeDefined()
        expect(screen.getAllByTestId('text-input')[0]).toBeDefined()

        // Check for Station Input
        expect(screen.getByText('Station')).toBeDefined()
        expect(screen.getAllByTestId('text-input')[1]).toBeDefined()

        // Check for Go Button
        expect(screen.getByText('Go')).toBeDefined()
    })

    it('updates state on input change', () => {
        const props: any = {
            config: {},
            theme: {}
        }
        render(<Widget {...props} /> as any)

        // Simulate Reach Input
        const reachInput = screen.getAllByTestId('text-input')[0]
        fireEvent.change(reachInput, { target: { value: '1' } })
        expect(reachInput.getAttribute('value')).toBe('1')

        // Simulate Station Input
        const stationInput = screen.getAllByTestId('text-input')[1]
        fireEvent.change(stationInput, { target: { value: '100+00' } })
        expect(stationInput.getAttribute('value')).toBe('100+00')
    })

    it('displays message on Go click', () => {
        const props: any = {
            config: {},
            theme: {}
        }
        render(<Widget {...props} /> as any)

        // Set some values first (simulating user input) - note: directly setting state is hard in black-box test, 
        // so we rely on the component's internal state update via fireEvent which we verified above.
        const reachInput = screen.getAllByTestId('text-input')[0]
        fireEvent.change(reachInput, { target: { value: 'TestReach' } })

        const goBtn = screen.getByText('Go')
        fireEvent.click(goBtn)

        expect(screen.getByText(/Navigating to/)).toBeDefined()
        expect(screen.getByText(/TestReach/)).toBeDefined()
    })
})
