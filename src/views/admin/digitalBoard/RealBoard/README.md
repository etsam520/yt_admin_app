# RBoard - Real-time Digital Board with Excalidraw

A Vue.js component that natively integrates Excalidraw for creating a real-time digital whiteboard experience.

## Features

- ✨ Native Excalidraw integration with Vue 3 Composition API
- 🎨 Full-featured drawing tools (shapes, text, arrows, etc.)
- 💾 Auto-save functionality with localStorage
- 📤 Export to PNG/SVG
- 🔗 Share board functionality
- 📱 Responsive design
- 🎯 Floating toolbar for quick actions
- 📊 Real-time board statistics
- 🧹 Clear board with confirmation

## Usage

### Basic Usage

The RBoard component is already integrated into your application and can be accessed at:

```
/digital-board/rboard
```

### API Reference

#### Props

The component doesn't require any props for basic usage.

#### Events

- `boardChange` - Emitted when the board content changes
- `boardSaved` - Emitted when the board is saved
- `boardExported` - Emitted when the board is exported

### Methods

#### Board Actions

- `saveBoard()` - Save current board state to localStorage
- `exportBoard()` - Export board as PNG image
- `shareBoard()` - Generate and share board URL
- `clearBoard()` - Clear all elements (with confirmation)

#### Drawing Tools

- `addStickyNote()` - Add a sticky note with custom text
- `addShape(type)` - Add geometric shapes ('rectangle', 'circle')
- `addText()` - Add text element
- `addArrow()` - Add arrow element

### Toolbar Features

#### Header Toolbar

- **Save** - Save board to localStorage
- **Export** - Download board as PNG
- **Share** - Copy shareable URL
- **Clear** - Clear entire board

#### Floating Toolbar

- **Note** - Add sticky note
- **Rectangle** - Add rectangle shape
- **Circle** - Add circle shape
- **Text** - Add text element
- **Arrow** - Add arrow element

### State Management

The component maintains the following reactive state:

- `isConnected` - Connection status
- `hasChanges` - Indicates unsaved changes
- `elementCount` - Number of elements on board
- `lastModified` - Last modification timestamp
- `connectedUsers` - Number of connected users (for future use)

### Local Storage

Board data is automatically saved to localStorage with the key `rboard-data` containing:

```json
{
  "elements": [...],
  "appState": {...},
  "timestamp": "2025-09-19T..."
}
```

## Integration Details

### Excalidraw Integration

The component uses a custom integration utility (`excalidrawIntegration.js`) that:

- Dynamically imports Excalidraw and React dependencies
- Manages React component lifecycle within Vue
- Provides helper functions for creating elements
- Handles export functionality

### File Structure

```
src/
├── views/admin/digitalBoard/RealBoard/
│   └── RBoard.vue                    # Main component
└── utils/
    └── excalidrawIntegration.js      # Integration utility
```

## Customization

### Styling

The component uses scoped CSS with CSS custom properties for easy theming:

```css
.realtime-board-container {
  height: 100vh;
  background: #f8fafc;
}
```

### Configuration

You can customize the Excalidraw initialization in `initializeExcalidraw()`:

```javascript
const initResult = await excalidrawIntegration.initialize(excalidrawWrapper.value, {
  name: 'Custom Board Name',
  theme: 'dark',  // 'light' or 'dark'
  gridModeEnabled: true,
  // ... other options
})
```

## Real-time Features (Future)

The component is prepared for real-time collaboration with:

- `emitBoardChange()` - Ready for WebSocket integration
- `handlePointerUpdate()` - Cursor tracking support
- Connected users display

## Browser Compatibility

- Modern browsers with ES6+ support
- React 18+ (dynamically loaded)
- Vue 3 with Composition API

## Performance Notes

- Excalidraw is loaded dynamically to reduce initial bundle size
- React components are rendered in isolated containers
- Board state is efficiently managed with Vue reactivity

## Troubleshooting

### Common Issues

1. **Excalidraw not loading**: Check console for import errors
2. **Save/Export not working**: Verify localStorage permissions
3. **UI overlapping**: Check z-index values in CSS

### Debug Mode

Enable debug logging by adding to console:

```javascript
localStorage.setItem('rboard-debug', 'true')
```

## Examples

### Adding Custom Elements

```javascript
// Add a custom text element
const textElement = createExcalidrawElement.text(
  'Custom Text',
  100, 100,
  { fontSize: 24, strokeColor: '#ff0000' }
)

// Update board with new element
const newElements = [...currentElements.value, textElement]
await excalidrawIntegration.updateScene(newElements, currentAppState.value)
```

### Custom Export

```javascript
// Export with custom options
const result = await excalidrawIntegration.exportToPNG(
  currentElements.value,
  currentAppState.value,
  {
    exportBackground: true,
    exportScale: 3, // Higher resolution
    exportWithDarkMode: false
  }
)
```

## License

This component integrates with Excalidraw, which is licensed under MIT License.
