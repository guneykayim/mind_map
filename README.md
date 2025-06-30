# Mind Map Application

A web-based mind mapping tool built with React and modern web technologies. This application allows users to create, edit, and organize ideas in a visual mind map format.

## ✨ Features

- **Infinite Canvas**: Zoom and pan around an infinite canvas to organize your ideas.
- **Node Management**: Add, edit, and delete nodes with ease.
- **Text Editing**: Edit node text with a simple double-click.
- **Drag and Drop**: Intuitively drag and move single or multiple nodes.
- **Multi-Node Selection**: Select multiple nodes using a selection rectangle.
- **Smart Connections**: Arrows automatically connect parent and child nodes and update as you move them.
- **Import/Export**: Save your mind map to a file or load a previously saved one.
- **Undo/Redo**: Correct mistakes with multi-level undo and redo.
- **Keyboard Shortcuts**: Efficiently manage your mind map with keyboard shortcuts.

## ⌨️ Keyboard Shortcuts

| Shortcut             | Action                       |
| -------------------- | ---------------------------- |
| `DoubleClick` on node| Edit node text               |
| `Shift` + `Click`    | Add node to selection        |
| `Shift` + `Drag`     | Pan the canvas               |
| `Ctrl` + `Z`         | Undo last action             |
| `Ctrl` + `Y`         | Redo last action             |
| `Scroll Wheel`       | Pan vertically               |
| `Ctrl` + `Scroll`    | Zoom in/out                  |
| `Delete` / `Backspace` | Delete selected node(s)    |

## 🛠 Tech Stack

- ⚛️ React 18 with Hooks
- 🎨 CSS Modules for scoped styling
- 🖱 Custom hooks for state management and interactions
- 🏗 Vite for fast development and builds
- 🎨 CSS Variables for theming

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm (v8 or later) or yarn

### Installation

1. Clone the repository:
    ```bash
    git clone <repository-url>
    cd mind_map
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

### Building for Production

To create a production build:
```bash
npm run build
```

## 🏗 Project Structure

```
src/
├── App.jsx             # Main application component
├── components/         # Reusable React components
├── hooks/              # Custom React hooks for logic and state
├── styles/             # Global styles and variables
├── utils/              # Utility functions
├── index.css           # Global stylesheet
└── index.jsx           # Application entry point
```

## 📝 Notes

- The application is currently in active development.
- UI/UX improvements are ongoing.
- Performance optimizations are planned for larger mind maps.
- This project is being developed entirely through vibe coding. So far, models like GPT-4, Gemini 2.5 Pro and Windsurf SWE-1 have contributed to the codebase.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
