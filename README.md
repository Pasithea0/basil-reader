# Basil Reader

A modern, beautiful online ebook reader built with SvelteKit and foliate-js.

## Features

- 📚 Support for multiple formats: EPUB, MOBI, KF8 (AZW3), FB2, CBZ, PDF
- 🎨 Beautiful, minimal interface with dark mode support
- 📖 Paginated and scrolled reading modes
- 🔖 Table of contents navigation
- 📊 Reading progress tracking
- ⌨️ Keyboard shortcuts (Arrow keys, h/l for navigation)
- 🎯 Calibre highlights support
- 🔒 Secure (Content Security Policy enabled)
- 📱 Responsive design

## Setup

### Prerequisites

- Node.js 18+ or compatible runtime
- pnpm (recommended) or npm

### Installation

1. Clone the repository with submodules:

```bash
git clone --recurse-submodules https://github.com/yourusername/basil-reader.git
cd basil-reader
```

If you already cloned without submodules, initialize them:

```bash
git submodule update --init --recursive
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

4. Open your browser to `http://localhost:5173`

## Building for Production

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

## Project Structure

```
basil-reader/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   └── reader/          # Reader UI components
│   │   │       ├── Reader.svelte
│   │   │       ├── DropTarget.svelte
│   │   │       ├── HeaderBar.svelte
│   │   │       ├── NavBar.svelte
│   │   │       ├── SideBar.svelte
│   │   │       ├── Menu.svelte
│   │   │       └── TOCView.svelte
│   │   ├── foliate-js/          # Ebook rendering library (submodule)
│   │   ├── utils/               # Utility functions
│   │   └── types/               # TypeScript type definitions
│   └── routes/
│       ├── +layout.svelte
│       └── +page.svelte         # Main reader page
└── IMPLEMENTATION.md            # Detailed implementation docs
```

## Usage

1. **Opening a Book**:
   - Drag and drop an ebook file onto the page
   - Or click "choose a file" to browse and select a file

2. **Navigation**:
   - Click the left/right arrows or use arrow keys
   - Use `h` and `l` keys for vim-style navigation
   - Drag the progress slider to jump to any position

3. **Table of Contents**:
   - Click the menu icon (≡) in the top-left to open the sidebar
   - Click any TOC entry to navigate to that section

4. **Settings**:
   - Click the gear icon in the top-right
   - Toggle between Paginated and Scrolled viewing modes

## Keyboard Shortcuts

| Key       | Action        |
| --------- | ------------- |
| `←` / `h` | Previous page |
| `→` / `l` | Next page     |

## Architecture

This reader is built as a modular Svelte application that integrates the powerful foliate-js library for ebook rendering. Each UI component is self-contained with its own styles, making the codebase maintainable and easy to extend.

See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for detailed architecture documentation.

## Foliate-JS

This project uses [foliate-js](https://github.com/johnfactotum/foliate-js) as a git submodule for easy updating. Foliate-js is a pure JavaScript library for rendering ebooks in the browser.

### Updating Foliate-JS

To update to the latest version:

```bash
cd src/lib/foliate-js
git pull origin main
cd ../../..
git add src/lib/foliate-js
git commit -m "Update foliate-js submodule"
```

## Security

The reader implements Content Security Policy (CSP) to prevent execution of scripts from ebook content, following security best practices for rendering potentially untrusted content.

## Development

### Adding New Features

1. **UI Components**: Add new components in `src/lib/components/reader/`
2. **Utilities**: Add helper functions in `src/lib/utils/`
3. **Types**: Update TypeScript definitions in `src/lib/types/`

### Testing

Open test ebooks can be found at:

- [Standard Ebooks](https://standardebooks.org/)
- [Project Gutenberg](https://www.gutenberg.org/)
- [EPUB Test Files](https://github.com/johnfactotum/epub-test)

## Browser Support

Supports the latest versions of:

- Chrome/Chromium
- Firefox
- Safari/WebKit

## License

MIT License - See LICENSE file for details

## Credits

- Built with [SvelteKit](https://kit.svelte.dev/)
- Ebook rendering by [foliate-js](https://github.com/johnfactotum/foliate-js)
- Inspired by [Foliate](https://github.com/johnfactotum/foliate)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
