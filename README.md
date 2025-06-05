# Mind Map Application

A web-based mind mapping tool built with React and modern web technologies. This application allows users to create, edit, and organize ideas in a visual mind map format.

## 🚀 Features

### ✅ Implemented
- Interactive node manipulation
- Editable node text with double-click
- Draggable nodes with smooth transitions
- Hover-triggered + buttons for adding child nodes
- Add new nodes when + buttons are clicked
- Clean and modern UI with smooth animations

### 🚧 In Progress
- [ ] Add arrow connections between nodes
- [ ] Maintain arrow connections when nodes are dragged
- [ ] Save and load mind map functionality

## 🛠 Tech Stack

- ⚛️ React 18 with Hooks
- 🎨 CSS Modules for scoped styling
- 🖱 Custom drag-and-drop implementation
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

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

To create a production build:
```bash
npm run build
```

## 🏗 Project Structure

```
src/
├── components/         # React components
│   ├── Node/           # Node component and styles
│   └── NodeText/       # Node text editing component
├── styles/             # Global styles and variables
└── App.jsx             # Main application component
```

## 🧪 Testing

To run tests:
```bash
npm test
```

## 📝 Notes

- The application is currently in active development
- UI/UX improvements are ongoing
- Performance optimizations are planned for larger mind maps

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
