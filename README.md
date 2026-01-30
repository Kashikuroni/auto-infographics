# Infographics Editor

![Status](https://img.shields.io/badge/status-alpha-orange)

Desktop application for creating product infographics. Quickly create visual product cards with text and images.

> [!WARNING]
> This project is in early development. Many features are incomplete or may not work as expected. Expect bugs and breaking changes.

[Русская версия](docs/README-ru.md)

## Tech Stack

### Frontend
- **React 19** — UI library
- **TypeScript** — type safety
- **Vite** — build tool
- **Zustand + Immer** — state management
- **react-konva** — canvas editor
- **Radix UI** — UI primitives (Dialog, etc.)

### Backend
- **Tauri v2** — desktop framework
- **Rust** — backend logic
- **font-kit** — system fonts access

## Installation & Development

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Tauri CLI](https://tauri.app/start/prerequisites/)

### Install Dependencies

```bash
# Frontend dependencies
cd frontend
npm install

# Rust dependencies are built automatically on first run
```

### Run in Development Mode

```bash
# From project root
cd frontend
npm run tauri:dev
```

The app will open in a separate window. Hot reload works for frontend code.

### Build

```bash
cd frontend
npm run tauri:build
```

The built application will be in `src-tauri/target/release/bundle/`.

## Current Features

### 1. Working Directory Selection
- Select a folder with product images on startup
- Supported formats: JPG, PNG, GIF, WebP

### 2. Image Gallery
- Display all images from the selected folder
- Pagination (15 images per page)
- Multiple selection via checkboxes
- "Select All" / "Deselect All" buttons

### 3. Visual Editor

#### Canvas
- Aspect ratio presets: 1:1, 4:3, 16:9
- Custom dimensions (width/height)
- Background color
- Mouse wheel / trackpad zoom
- Fit to view on load

#### Layers Panel
- Frame — canvas settings
- Hero Image — main product photo
- Text layers
- Additional images
- Toggle layer visibility
- Delete layers (except Hero)

#### Objects
- **Text**: font, size, color, alignment, weight
- **Images**: position, size, rotation, opacity
- Drag objects
- Resize via handles
- Rotation around object center

#### Alignment
- Horizontal: left / center / right
- Vertical: top / middle / bottom

#### Properties Panel
- Shows only for selected element
- Transform: X, Y, width, height, rotation, opacity
- For text: key, content, font, size, color

### 4. Templates
- Save current editor state as template
- Load saved templates
- Delete templates
- Templates stored in `.infographics-templates/` inside working directory

### 5. Hero Image Replacement
- "Replace Image" button in Hero properties
- Opens gallery to select new image

## Project Structure

```
infographics/
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Canvas/      # Editor canvas
│   │   │   ├── LayersPanel/ # Layers panel
│   │   │   ├── PropertiesPanel/ # Properties panel
│   │   │   ├── Toolbar/     # Top toolbar
│   │   │   └── Gallery/     # Image gallery
│   │   ├── store/           # Zustand store
│   │   ├── hooks/           # React hooks
│   │   └── types/           # TypeScript types
│   └── package.json
├── src-tauri/               # Tauri backend (Rust)
│   ├── src/lib.rs           # Tauri commands
│   ├── capabilities/        # Permissions
│   └── Cargo.toml
├── docs/                    # Documentation
│   └── README-ru.md         # Russian README
├── CLAUDE.md                # Technical notes
└── README.md                # This file
```

## Releases

To create a new release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions will automatically build binaries for:
- macOS (Apple Silicon & Intel)
- Windows (x64)
- Linux (x64)

Download from [Releases](../../releases) page.

## License

MIT
