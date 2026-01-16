# Manual Verification Walkthrough - Phase 0

## Objective
Verify that the project infrastructure is correctly set up and ready for development.

## Prerequisites
-   Node.js installed.
-   Terminal access to the project root.

## Steps

1.  **Verify Dependencies**
    -   Run `npm install` in the root directory.
    -   Expected: success message, `node_modules` folder created.

2.  **Verify Linting**
    -   Run `npm run lint`.
    -   Expected: No errors. If warnings appear, they should be related to empty files (which is expected at this stage).

3.  **Verify Testing**
    -   Run `npm test`.
    -   Expected: Vitest should run. (Note: It might fail if no tests are found, which is acceptable for now, or pass if we add a dummy test).

4.  **Verify Build/Typecheck**
    -   Run `npm run build`.
    -   Expected: TypeScript compiler runs without critical errors.

5.  **GitHub Actions**
    -   Push changes to GitHub.
    -   Check the "Actions" tab in the repository.
    -   Expected: The "Verify" workflow should trigger and pass.

## Phase 1 Verification: Configuration Schema

1.  **Verify Config Interface**
    -   Open `WidgetTemplate/src/config.ts`.
    -   Ensure `Config` interface has `feederUrl`, `feederLayerUrl`, `routeLayerUrl`.
    -   Ensure no legacy properties (`p1`, `p2`) exist.

2.  **Verify Build Integrity**
    -   Run `npm run build`.
    -   Expected: Success (no errors about missing properties in `widget.tsx` or `setting.tsx`).

## Phase 2 Verification: Settings Experience

1.  **Automated Verification**
    - Run `npm run lint`.
    - Expected: No errors.
    - Run `npx vitest run --environment jsdom`.
    - Expected: `tests/setting.test.tsx` passes, confirming that the settings UI renders the correct inputs and updates the configuration state.

2.  **Manual UI Verification (In Experience Builder)**
    - *Prerequisite: Widget is deployed to an Experience Builder instance.*
    - Open the Experience Builder builder interface.
    - Drag the "Go To Station" widget onto the canvas.
    - Open the widget settings panel (Sidebar).
    - **Verify**: You should see a section "Map Services" with three text inputs:
        - "Feeder Name Layer URL"
        - "Feeder Detail Layer URL"
        - "Route Layer URL"
    - **Action**: Type values into these fields.

## Phase 3 Verification: Widget UI

1.  **Automated Verification**
    - Run `npm run lint`.
    - Expected: No errors (after fixing initial type issues).
    - Run `npx vitest run tests/widget_ui.test.tsx`.
    - Expected: Tests pass, confirming inputs and buttons render and interactive state works (using mocks).

2.  **Manual UI Verification (In Experience Builder)**
    - *Prerequisite: Widget is deployed to an Experience Builder instance.*
    - Open your Experience.
    - **Verify**: The widget displays:
        - A "Feeder" dropdown (Placeholder "Select a Feeder").
        - A "Reach" text input (Optional, placeholder "e.g. 1").
        - A "Station" text input (Required, placeholder "e.g. 100+00").
        - A "Go" button.
    - **Action**: Enter "Test Reach" and "100+00", then click "Go".
    - **Verify**: A message appears below the button: "Navigating to [Selected Feeder] (Reach: Test Reach) @ 100+00".

## Phase 4 Verification: Core Logic

### Phase 4.1: Feeder Population
1.  **Automated Verification**:
    - Run `npm test`.
    - Ensure `tests/feederService.test.ts` passes.

2.  **Manual Verification**:
    - Configure the widget with a valid "Feeder Name Layer URL".
    - **Verify**: The "Feeder" dropdown automatically populates with sorted values.
    - **Verify**: If the URL is broken, an error message appears.

### Phase 4.2: Route Traversal
1.  **Automated Verification**:
    - Run `npm test`.
    - Ensure `tests/routeService.test.ts` passes.

2.  **Manual Verification**:
    - **Scenario A**: Select Feeder, Enter Station (e.g., 100). Click Go.
        - Expected: Success message "Found X locations" (check console for Point object).
    - **Scenario B**: Select Feeder, Enter Reach (e.g., 1), Enter Station.
        - Expected: Success message specific to that reach.
    - **Scenario C**: Invalid Station.
        - Expected: "Invalid station value" message.

    - **Scenario C**: Invalid Station.
        - Expected: "Invalid station value" message.

### Phase 4.4: Feeder Range Validation
1.  **Automated Verification**:
    - Run `npm test`.
    - Ensure `tests/feederService.test.ts` and `tests/widget_ui.test.tsx` pass.

2.  **Manual Verification**:
    - Select a Feeder known to have a range (e.g., Feeder A).
    - **Verify**: Text "Valid values: [Min] - [Max]" appears below the Station input.
    - **Scenario**: Enter a station outside this range (e.g., 99999).
    - Click Go.
    - **Verify**: Error message "Invalid station. Must be between [Min] and [Max]" appears. Search is NOT executed.

### Phase 4.3: Coordinate Projection
1.  **Automated Verification**:
    - Run `npm test`.
    - Ensure `tests/geometryUtils.test.ts` passes.

2.  **Manual Verification**:
    - **Scenario**: Perform a successful Route Traversal.
    - **Check Console**:
        - Look for "Found locations (Original)" log.
        - Look for "Found locations (Projected)" log.
        - Verify the Projected points have `wkid: 102100` (Web Mercator).

## Phase 5 Verification: Map Integration

1.  **Automated Verification**:
    - Run `npm test`.
    - Ensure `tests/widget_map.test.tsx` passes.
    - Confirm that `JimuMapViewComponent` and `GraphicsLayer` interactions are verified.

2.  **Manual Verification**:
    - **Prerequisites**:
        - Widget is configured with valid Service URLs.
        - Widget is added to an Experience page that also has a **Map Widget**.
    - **Configuration**:
        - Open Widget Settings.
        - **Select Map Widget**: Choose the Map Widget from the dropdown.
    - **Execution**:
        - Select Feeder, Enter Station, Click Go.
    - **Verification**:
        - **Zoom**: The map view should automatically pan and zoom (Level 16) to the calculated location.
        - **Graphic**: A cyan circle (SimpleMarkerSymbol) should appear at the location.
        - **Popup**: (Optional) Clicking the graphic might not show a popup yet unless explicitly implemented, but the visual marker confirms the graphic was added.

