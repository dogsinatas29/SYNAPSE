# SYNAPSE VS Code Extension

Launch the extension in debug mode:

1. Press `F5` or go to Run > Start Debugging
2. A new VS Code window will open with the extension loaded
3. Open a project folder
4. Run command: `SYNAPSE: Open Canvas` (Ctrl+Shift+P)

## Commands

- `SYNAPSE: Open Canvas` - Open the visual canvas
- `SYNAPSE: Bootstrap from GEMINI.md` - Right-click on GEMINI.md file
- `SYNAPSE: Fit View` - Fit all nodes in view

## Development

```bash
npm install
npm run compile
npm run watch  # Auto-compile on changes
```

## Testing

1. Open this project in VS Code
2. Press F5 to launch Extension Development Host
3. In the new window, open a project with GEMINI.md
4. Right-click GEMINI.md > "SYNAPSE: Bootstrap from GEMINI.md"
5. Canvas will open automatically
