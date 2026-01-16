# Go To Station Widget

This widget ports the "Go To Station" functionality from Web AppBuilder to ArcGIS Experience Builder. It allows users to select a pipeline feeder, enter a station number, and zoom to that location on the map.

## 🚀 Deployment to Experience Builder Developer Edition

To deploy this widget to your on-premise Experience Builder Developer Edition:

1.  **Locate Extensions Folder**:
    Navigate to your Experience Builder installation directory:
    `.../ArcGISExperienceBuilder/client/your-extensions/widgets/`

2.  **Copy Widget**:
    Copy the entire `WidgetTemplate` folder from this repository into the widgets directory.
    *Recommendation: Rename the folder from `WidgetTemplate` to `go-to-station`.*

3.  **Install Dependencies**:
    Open a terminal in the new widget folder and run:
    ```bash
    npm install
    ```

4.  **Restart Server**:
    Restart your Experience Builder client server (`npm start` in the `client` root).

5.  **Configure in Builder**:
    -   Open an Experience.
    -   Add the **Go To Station** widget from the "Custom" section.
    -   In the Settings panel, populate the Service URLs.

### ⚙️ Configuration Reference (Legacy Mapping)

Use the values from your legacy `config.json` to populate the Experience Builder settings:

| Experience Builder Setting | Legacy Config Key | Example Value |
| :--- | :--- | :--- |
| **Feeder Name URL** | `feeder_names.url` | `.../MapServer/0` |
| **Feeder Detail URL** | `feeder_layer.url` | `.../FeatureServer/0` |
| **Route Layer URL** | `route_layer.url` | `.../FeatureServer/1` |

---

## 🛠 Development

### Project Structure
- `src/runtime/`: Main widget logic (React).
- `src/setting/`: Builder configuration panel.
- `src/config.ts`: Configuration interface definition.

### Commands
- `npm start`: Compile code in watch mode.
- `npm run build`: Build for production.
- `npm test`: Run unit tests.
- `npm run lint`: Run ESLint.
