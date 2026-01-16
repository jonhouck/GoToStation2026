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

// Mock FeederService
vi.mock('../WidgetTemplate/src/runtime/services/feederService', () => ({
    getFeeders: vi.fn().mockImplementation(() => {
        console.log('Mock getFeeders called')
        return Promise.resolve([
            { label: 'Mock Feeder', value: 'mock' }
        ])
    }),
    getFeederRange: vi.fn()
}))

vi.mock('../WidgetTemplate/src/runtime/services/routeService', () => ({
    findStationOnRoute: vi.fn().mockResolvedValue([])
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

    it('displays message on Go click', async () => {
        const props: any = {
            config: { feederUrl: 'mock' },
            theme: {}
        }
        render(<Widget {...props} /> as any)

        // Wait for feeders to load
        await screen.findByText('Mock Feeder')

        // Select Feeder
        const select = screen.getByTestId('select')
        fireEvent.change(select, { target: { value: 'mock' } })

        // Enter Station
        const inputs = screen.getAllByTestId('text-input')
        const stationInput = inputs[1]
        fireEvent.change(stationInput, { target: { value: '100' } })

        const goBtn = screen.getByText('Go')
        fireEvent.click(goBtn)

        // Since findStationOnRoute mocks returning [], we expect the "Could not find" message
        // We use findByText to wait for the async state update
        expect(await screen.findByText(/Could not find reach/)).toBeDefined()
    })

    it('validates station range', async () => {
        const props: any = {
            config: { feederUrl: 'mock', feederLayerUrl: 'mockLayer' },
            theme: {}
        }

        // Mock range response using the imported mock
        const { getFeederRange } = await import('../WidgetTemplate/src/runtime/services/feederService')
            ; (getFeederRange as any).mockResolvedValue({ min: 100, max: 2000 })

        const { getByText, findByText, getAllByTestId, getByTestId } = render(<Widget {...props} /> as any)

        // Wait for feeders
        await findByText('Mock Feeder')

        // Select Feeder
        fireEvent.change(getByTestId('select'), { target: { value: 'mock' } })

        // Check if range is displayed (async)
        expect(await findByText('Valid values: 1+00.00 - 20+00.00')).toBeDefined()

        // Enter invalid station
        const stationInput = getAllByTestId('text-input')[1]
        fireEvent.change(stationInput, { target: { value: '9999' } })

        // Click Go
        fireEvent.click(getByText('Go'))

        // Check error message
        expect(await findByText('Invalid station. Must be between 1+00.00 and 20+00.00.')).toBeDefined()
    })
})
