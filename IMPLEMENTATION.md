# Basil Reader - Svelte Implementation

This document describes the Svelte-based implementation of the ebook reader using foliate-js.

## Architecture

The application is structured as a collection of Svelte components, each handling a specific part of the UI:

### Components

#### 1. **Reader.svelte** (`src/lib/components/reader/Reader.svelte`)
Main component that orchestrates the entire reader experience.
- Manages foliate-view lifecycle
- Handles book opening and navigation
- Coordinates all child components
- Manages state for book metadata and reading progress

#### 2. **DropTarget.svelte** (`src/lib/components/reader/DropTarget.svelte`)
Initial landing page that allows users to:
- Drag and drop ebook files
- Click to select files via file picker
- Supports both files and directories (for unpacked EPUBs)

#### 3. **HeaderBar.svelte** (`src/lib/components/reader/HeaderBar.svelte`)
Top toolbar containing:
- Sidebar toggle button
- Settings menu

#### 4. **NavBar.svelte** (`src/lib/components/reader/NavBar.svelte`)
Bottom toolbar with:
- Previous/Next page buttons
- Progress slider with section markers
- Shows current location and reading progress

#### 5. **SideBar.svelte** (`src/lib/components/reader/SideBar.svelte`)
Sliding panel from the left showing:
- Book cover image
- Book title and author
- Table of contents

#### 6. **Menu.svelte** (`src/lib/components/reader/Menu.svelte`)
Dropdown settings menu with options:
- Layout toggle (Paginated/Scrolled)
- Extensible for additional settings

#### 7. **TOCView.svelte** (`src/lib/components/reader/TOCView.svelte`)
Table of contents navigation:
- Hierarchical structure with expand/collapse
- Current location highlighting
- Click to navigate

### Utilities

#### `format.ts` (`src/lib/utils/format.ts`)
Formatting helpers:
- `formatLanguageMap`: Handle multi-language metadata
- `formatContributor`: Format author names
- Number/percentage formatters

#### `css.ts` (`src/lib/utils/css.ts`)
CSS generation for book content:
- Typography settings (spacing, justification, hyphenation)
- Dark mode support
- EPUB namespace handling

## Foliate-JS Integration

The reader integrates with foliate-js library through:

1. **Dynamic Import**: `view.js` is imported at runtime in the Reader component
2. **Custom Element**: Creates `<foliate-view>` element programmatically
3. **Event Handling**: 
   - `load`: Fired when a section loads
   - `relocate`: Fired when reading position changes
   - `create-overlay`: For annotations/highlights
4. **API Calls**:
   - `view.open(file)`: Open ebook file
   - `view.goTo(href)`: Navigate to location
   - `view.goLeft()`/`view.goRight()`: Page navigation
   - `view.goToFraction(n)`: Jump to position

## Styling

Each component carries its own scoped styles, extracted from the original `reader.html`. This ensures:
- Component isolation
- Easy maintenance
- Consistent styling with the original implementation

Global CSS variables are defined for theming:
- `--active-bg`: Background color for active/hover states
- Respects system color scheme preferences

## File Structure

```
src/
├── lib/
│   ├── components/
│   │   └── reader/
│   │       ├── Reader.svelte          # Main orchestrator
│   │       ├── DropTarget.svelte      # File selection
│   │       ├── HeaderBar.svelte       # Top toolbar
│   │       ├── NavBar.svelte          # Bottom toolbar
│   │       ├── SideBar.svelte         # Sidebar panel
│   │       ├── Menu.svelte            # Settings menu
│   │       ├── TOCView.svelte         # Table of contents
│   │       └── index.ts               # Exports
│   ├── foliate-js/                    # Git submodule
│   └── utils/
│       ├── format.ts                  # Formatting utilities
│       └── css.ts                     # CSS generation
└── routes/
    ├── +layout.svelte                 # App layout
    └── +page.svelte                   # Main page (uses Reader)
```

## Features

- ✅ Open EPUB, MOBI, KF8, FB2, CBZ files
- ✅ Drag and drop file opening
- ✅ Table of contents navigation
- ✅ Reading progress tracking
- ✅ Paginated and scrolled viewing modes
- ✅ Keyboard shortcuts (Arrow keys, h/l)
- ✅ Dark mode support
- ✅ Calibre highlights support
- ✅ Responsive design

## Security

Content Security Policy is applied via meta tag in `+page.svelte` to prevent script execution from ebooks, following foliate-js security guidelines.

## Future Enhancements

Potential improvements:
- [ ] Bookmarking system
- [ ] Annotation creation
- [ ] Dictionary lookup
- [ ] Text-to-speech
- [ ] Search functionality
- [ ] Font/theme customization UI
- [ ] Reading statistics
- [ ] Cloud sync
