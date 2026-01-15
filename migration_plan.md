# Go To Station Widget Migration Plan

This document outlines the architectural approach and critical path for migrating the "Go To Station" widget from ArcGIS Web AppBuilder (Legacy) to ArcGIS Experience Builder.

## 📂 Project Structure
- **Legacy Source**: `./GoToStationLEGACY/` (Dojo/Dijit, ArcGIS JS API 3.x)
- **Target Template**: `./WidgetTemplate/` (React, ArcGIS JS API 4.x, Jimu UI)

## 🎯 Objective
Port the station traversal capabilities—selecting a pipeline feature (Feeder), traversing a specific number of feet (Station), and accurately projecting/rendering the location—into a modern Experience Builder widget.

## 🛣️ Critical Path & Dependencies
The following phases must be executed sequentially.

| Phase | Dependency | Description |
| :--- | :--- | :--- |
| **0. Infrastructure** | None | **[COMPLETE]** ✅ Initialize GitHub, CI/CD, and Linting. |
| **1. Configuration** | Phase 0 | **[COMPLETE]** ✅ Define data interfaces for Feeders and Routes. |
| **2. Settings Experience** | Phase 1 | Build the sidebar settings for users to input Service URLs. |
| **3. Widget UI (Frontend)** | Phase 1 | Build the React UI (Dropdowns, Inputs) using Jimu UI components. |
| **4. Core Logic (Backend)** | Phase 3 | Port interpolation algorithms and query logic to ArcGIS JS API 4.x. |
| **5. Map Integration** | Phase 4 | Connect logic to the active Map View to render graphics. |

---

## 📝 Implementation Tasks

### Phase 0: Infrastructure & Quality Control (✅ COMPLETE)
**Goal**: Establish a robust development environment with source control and automated verification.

1.  **GitHub Initialization**:
    -   Initialize `main` branch.
    -   Configure `.gitignore` for Node/Experience Builder.

2.  **Linting & Code Quality**:
    -   **Install/Configure ESLint**: Enforce strict TypeScript rules (no unused vars, no `any`).
    -   **Prettier**: Set up for consistent formatting.
    -   **Rule**: "Clean and free of unassigned references" (Strict null checks, no unused locals).

3.  **Test Infrastructure**:
    -   **Unit Tests**: Configure `Jest` or `Vitest` for logic testing (specifically the interpolation math).
    -   **Automation**: Set up a basic test harness (e.g., `headless` browser or component testing) to verify the widget loads.

4.  **GitHub Actions (CI/CD)**:
    -   Create `.github/workflows/verify.yml`.
    -   **On Push/PR**:
        -   Run `npm install`.
        -   Run `npm run lint` (Fail on warnings/errors).
        -   Run `npm test` (Unit tests).
        -   Run `npm run build` (Verify compilation).

### Phase 1: Configuration Schema (✅ COMPLETE)
**Goal**: Replicate the legacy `config.json` structure in the strict TypeScript environment of Experience Builder.

1.  **Update `src/config.ts`**:
    -   Define a `Config` interface that includes:
        -   `feederUrl`: string (URL to MapServer/0)
        -   `feederLayerUrl`: string (URL to FeatureServer/0)
        -   `routeLayerUrl`: string (URL to FeatureServer/1)
        -   `geometryServiceUrl`: string (Optional, for fallback projection)
    -   *Reference Legacy*: `GoToStationLEGACY/config.json`

### Phase 2: Settings Experience
**Goal**: Allow the user to configure the widget in the Experience Builder builder interface.

1.  **Implement `src/setting/setting.tsx`**:
    -   Use `SettingSection` and `SettingRow` from `jimu-ui/advanced/setting-components`.
    -   Add `TextInput` components for:
        -   Feeder Name Layer URL
        -   Feeder Detail Layer URL
        -   Route Layer URL
    -   Save values to `props.config`.

### Phase 3: Widget UI Scaffolding
**Goal**: Create the visual interface for the end-user.

1.  **Implement `src/runtime/widget.tsx`**:
    -   **Imports**: Import `Select`, `Option`, `TextInput`, `Button`, `Label` from `jimu-ui`.
    -   **State**: Initialize state for:
        -   `feeders`: Array of `{label, value}` (initially empty).
        -   `selectedFeeder`: string.
        -   `station`: string/number.
        -   `reach`: string (optional).
    -   **Layout**:
        -   Create a clean vertical layout (using `div` or `Column` containers).
        -   **Feeder Select**: A dropdown populated by `state.feeders`.
        -   **Reach Input**: A text input (Optional).
        -   **Station Input**: A text input (Required).
        -   **Go Button**: A primary button triggering the calculation.
        -   **Message Area**: A div for error/status messages.

### Phase 4: Core Logic Migration (The "Brain")
**Goal**: Port the Dojo/3.x logic to React/4.x.

1.  **Feeder Name Population (`_initSelect` equivalent)**:
    -   **Hook**: Use `useEffect` on widget load.
    -   **Query**: Use `esri/rest/query` (replacing `esri/tasks/QueryTask`).
        -   Target: `config.feederUrl`.
        -   Params: `where: "1=1"`, `outFields: ["FFNAME", "FFCODE"]`, `returnDistinctValues: true`.
    -   **Transform**: Map results to `{ label: attr.FFNAME, value: attr.FFCODE }` and update state.

2.  **Route Traversal Logic (`_onCalculateButton` equivalent)**:
    -   **Trigger**: `onClick` of Go Button.
    -   **Query**: Use `esri/rest/query.executeQueryJSON`.
        -   Target: `config.routeLayerUrl`.
        -   **Logic Branch**:
            -   *If Reach is present*: specific query for `ROUTEREACH = '{Feeder}_{Reach}'`.
            -   *If Reach matches Legacy*: `ROUTEREACH LIKE '{Feeder}%'`.
        -   **Important**: Ensure `returnM: true` and `returnGeometry: true` are set.
    -   **Interpolation Data**:
        -   Extract `paths` from the returned feature geometry.
        -   Legacy logic iterates vertices `[x, y, m]`.
        -   **Task**: Copy the `_interpolatePoint` logic from Legacy `Widget.js` (lines 203-241) but adapt for 4.x `Polyline` paths structure.

3.  **Coordinate Interpolation**:
    -   Implement the math to find the segment where `Station` M-value falls between `Vertex A` (m1) and `Vertex B` (m2).
    -   Linear Interpolation formula:
        ```javascript
        ratio = (TargetStation - m1) / (m2 - m1);
        x = x1 + (x2 - x1) * ratio;
        y = y1 + (y2 - y1) * ratio;
        ```

### Phase 5: Map Integration
**Goal**: Visualize the result.

1.  **JimuMapView**:
    -   Wrap widget in `JimuMapViewComponent` (from `jimu-arcgis`) to access the active map view.
    -   Store `jimuMapView` in state/ref.

2.  **Graphics Layer**:
    -   On `activeViewChange`, create a `GraphicsLayer` and add it to `jimuMapView.view.map`.
    -   **Render**:
        -   Create a `Graphic` (Point) using the interpolated X/Y.
        -   **Spatial Reference**: Use the SR from the Route Layer result (likely 2230) or the Map View.
        -   **Projection**:
            -   *Preferred*: Use `esri/geometry/projection` (client-side) if the engine supports 2230 -> 102100 (Web Mercator).
            -   *Fallback*: Use `geometryService.project()` if configured.
    -   **Zoom**: Call `jimuMapView.view.goTo(graphic)` to pan/zoom to the result.

## 🧪 Verification Plan

1.  **Automated CI Checks**:
    -   **Linting**: Must pass with 0 errors (ensures clean code).
    -   **Unit Tests**: Validate `interpolation` logic (math) in isolation before UI integration.
    -   **Build**: Verify widget compiles without TypeScript errors.

2.  **Config Test**:
    -   Run `npm start` in `client` folder.
    -   Open Widget Controller.
    -   Verify Settings inputs save URLs references correctly.

2.  **Feeder Loading Test**:
    -   Add widget to a page.
    -   Verify "Feeder" dropdown populates with list (e.g., "Feeder A", "Feeder B").

3.  **Traversal Test**:
    -   Input Feeder: `[Select a known feeder]`
    -   Input Station: `[Known Station Value]`
    -   Click Go.
    -   **Expected**: Map zooms to a specific point on the pipeline.
    -   **Validation**: Compare visual result against Legacy Web AppBuilder widget if available, or verify against known GIS data.

4.  **Error Handling**:
    -   Input invalid Station (out of range).
    -   Expected: Error message "Could not find reach" or "Invalid station".
