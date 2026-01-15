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
    - **Verify**: The values persist when closing/reopening the settings.
