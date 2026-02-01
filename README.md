# Infographics Editor

![Status](https://img.shields.io/badge/status-alpha-orange)

Desktop application for batch creating product infographics. Quickly create visual product cards with text and images for multiple products at once.

> [!WARNING]
> This project is in early development. Some features may be incomplete or change without notice.

[Русская версия](docs/README-ru.md)

## Features

### 1. Working Directory
- Select a folder with product images on startup
- Supported formats: JPG, PNG, GIF, WebP, BMP

### 2. Image Gallery
- View all images from the selected folder
- Pagination (15 images per page)
- Multiple selection via checkboxes
- "Select All" / "Deselect All" buttons

### 3. Visual Editor

#### Canvas
- Aspect ratio presets: 1:1, 4:3, 16:9
- Custom dimensions (width/height)
- Background color picker
- Mouse wheel / trackpad zoom
- Fit to view on load

#### Layers Panel
- Frame — canvas settings
- Hero Image — main product photo
- Text layers with data binding
- Additional images
- Background images
- Toggle layer visibility
- Delete layers (except Hero)

#### Objects
- **Text**: font, size, color, alignment, weight
- **Images**: position, size, rotation, opacity
- Drag to reposition
- Resize via corner handles
- Rotation around object center

#### Alignment
- Horizontal: left / center / right
- Vertical: top / middle / bottom

#### Properties Panel
- Transform: X, Y, width, height, rotation, opacity
- Text: key (for data binding), content, font, size, color

### 4. Templates
- Save editor state as reusable template
- Load saved templates
- Delete templates
- Auto-save when working with a template (1.5s debounce)
- Template indicator in tab bar with "detach" option
- Templates stored in `.infographics-templates/` inside working directory

### 5. Batch Processing (Table Tab)
- Edit text values for each image in a spreadsheet-like table
- Each text layer becomes a column
- Each selected image becomes a row
- Bulk fill: paste multiple values to fill a column at once
- Text keys link editor layers to table columns

### 6. Generation
- Generate infographics for all selected images
- **Parallel processing**: uses multiple CPU cores for faster generation
- **Thread selector**: choose how many cores to use (1 to max)
  - Default: half of available cores (keeps system responsive)
  - Maximum: all logical cores (fastest, but may slow other apps)
- Progress bar with current file indicator
- Auto-fit text: long text shrinks to fit the box (min 8px)
- Rotation support for all objects
- Output directory:
  - `infographics/` — when no template is active
  - `infographics/{template_name}/` — when working with a template

### 7. Hero Image Replacement
- "Replace Image" button in Hero properties
- Opens gallery overlay to select a different image

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
- **Rust** — backend logic and image processing
- **image + imageproc** — image manipulation
- **ab_glyph** — text rendering
- **font-kit** — system fonts access
- **tokio + futures** — async runtime and parallel processing
- **num_cpus** — CPU core detection

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

## Project Structure

```
infographics/
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Canvas/      # Konva canvas editor
│   │   │   ├── Editor/      # Main editor view
│   │   │   ├── GalleryTab/  # Gallery within editor
│   │   │   ├── GalleryOverlay/ # Image selection modal
│   │   │   ├── LayersPanel/ # Layer management
│   │   │   ├── PropertiesPanel/ # Object properties
│   │   │   ├── TabBar/      # Tab navigation
│   │   │   ├── TableTab/    # Batch processing table
│   │   │   ├── Toolbar/     # Top toolbar
│   │   │   └── StartupWindow/ # Directory selection
│   │   ├── store/           # Zustand store
│   │   ├── hooks/           # React hooks
│   │   └── types/           # TypeScript types
│   └── package.json
├── src-tauri/               # Tauri backend (Rust)
│   ├── src/lib.rs           # Tauri commands + image generation
│   ├── capabilities/        # Permissions
│   └── Cargo.toml
├── docs/                    # Documentation
│   └── README-ru.md         # Russian README
├── CLAUDE.md                # Technical notes for developers
└── README.md                # This file
```

## Workflow

1. **Select Working Directory** — Choose a folder containing product images
2. **Gallery Tab** — Select which images to process (all selected by default)
3. **Editor Tab** — Design your infographic template:
   - Add text layers with meaningful keys (e.g., "PRICE", "NAME")
   - Position and style all elements
   - Save as template for reuse
4. **Table Tab** — Fill in text values for each product:
   - Each row = one image
   - Each column = one text layer
   - Use "Bulk Fill" to paste multiple values at once
5. **Generate** — Click "Generate" to create infographics for all selected images

## Releases

To create a new release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions will automatically build binaries for:
- macOS (Apple Silicon)
- Windows (x64)

Download from [Releases](../../releases) page.

## License

MIT
