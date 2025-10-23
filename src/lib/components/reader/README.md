# Reader Components

This directory contains all the UI components for the ebook reader.

## Component Overview

### Reader.svelte

**Main orchestrator component**

Props: None (manages all state internally)

Events: None (top-level component)

Responsibilities:

- Creates and manages foliate-view instance
- Opens books and handles file input
- Coordinates all child components
- Manages reading state and progress
- Handles keyboard shortcuts
- Integrates with foliate-js library

### DropTarget.svelte

**Initial file selection interface**

Props: None

Events:

- `open` - Emitted when file is selected/dropped
  - `detail.file` - The file or directory entry

Responsibilities:

- Drag and drop zone
- File picker button
- Initial landing page UI

### HeaderBar.svelte

**Top toolbar**

Props:

- `visible: boolean` - Show/hide toolbar

Events:

- `toggle-sidebar` - Emitted when sidebar button clicked

Slots:

- `menu` - For Menu component

Responsibilities:

- Sidebar toggle button
- Settings menu container

### NavBar.svelte

**Bottom navigation toolbar**

Props:

- `visible: boolean` - Show/hide toolbar
- `fraction: number` - Current reading progress (0-1)
- `dir: string` - Reading direction ('ltr' or 'rtl')
- `title: string` - Tooltip text for progress slider
- `sectionFractions: number[]` - Section markers for slider

Events:

- `go-left` - Previous page requested
- `go-right` - Next page requested
- `seek` - Progress slider moved
  - `detail.fraction` - Target position (0-1)

Responsibilities:

- Navigation buttons
- Progress slider
- Reading position display

### SideBar.svelte

**Sliding panel from left**

Props:

- `show: boolean` - Show/hide sidebar (bindable)
- `title: string` - Book title
- `author: string` - Book author
- `coverSrc: string` - Cover image URL

Events:

- `close` - Emitted when dimming overlay clicked

Slots:

- Default - For TOCView component

Responsibilities:

- Book metadata display
- Cover image
- TOC container
- Dimming overlay

### Menu.svelte

**Settings dropdown menu**

Props:

- `show: boolean` - Show/hide menu (bindable)
- `selectedLayout: string` - Current layout mode (bindable)

Events:

- `layout-change` - Layout mode changed
  - `detail.value` - New layout ('paginated' or 'scrolled')

Responsibilities:

- Settings menu dropdown
- Layout toggle
- Menu button

### TOCView.svelte

**Table of contents navigation**

Props:

- `toc: TOCItem[]` - Table of contents structure
- `currentHref: string` - Currently active location

Events:

- `navigate` - TOC item clicked
  - `detail.href` - Target location

Responsibilities:

- Render hierarchical TOC
- Expand/collapse support
- Highlight current location
- Handle navigation clicks

## Component Hierarchy

```
Reader.svelte
├── DropTarget.svelte (conditional)
├── HeaderBar.svelte
│   └── Menu.svelte (slot)
├── NavBar.svelte
├── SideBar.svelte
│   └── TOCView.svelte (slot)
└── <foliate-view> (created dynamically)
```

## Styling

Each component includes its own scoped styles extracted from the original `reader.html`. Styles use:

- Canvas/CanvasText for themeable colors
- CSS custom properties for shared values
- System fonts for native appearance
- Responsive units (vh, rem, %)

Global CSS variables:

- `--active-bg` - Background for active/hover states

## Event Flow

1. **File Open**: `DropTarget` → `open` → `Reader.openBook()`
2. **Navigation**: `NavBar` → `go-left/go-right` → `view.goLeft()/goRight()`
3. **TOC**: `TOCView` → `navigate` → `view.goTo()` → closes `SideBar`
4. **Progress**: `NavBar` → `seek` → `view.goToFraction()`
5. **Layout**: `Menu` → `layout-change` → `view.renderer.setAttribute()`

## Integration with Foliate-JS

The Reader component:

1. Dynamically imports `foliate-js/view.js`
2. Creates `<foliate-view>` custom element
3. Listens for foliate events:
   - `load` - Section loaded
   - `relocate` - Position changed
   - `create-overlay` - Add annotations
   - `draw-annotation` - Render highlights
   - `show-annotation` - Display notes

## Type Safety

See `src/lib/types/foliate.d.ts` for TypeScript definitions of:

- FoliateView interface
- FoliateBook interface
- Event detail types
- TOC structure types

## Extending

To add new features:

1. **New Component**: Create in this directory, follow naming convention
2. **New Event**: Dispatch with `createEventDispatcher()`, document in README
3. **New Prop**: Add to component, document type and purpose
4. **New Style**: Add to component's `<style>` block, use scoped styles

Example new component:

```svelte
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let someProp: string;

	const dispatch = createEventDispatcher();
</script>

<div class="my-component">
	<!-- content -->
</div>

<style>
	.my-component {
		/* scoped styles */
	}
</style>
```
