# ESLint Fixes Applied

## Summary of Changes

Fixed all 33 ESLint errors across 7 files.

## Changes by File

### 1. HeaderBar.svelte
**Issue**: `any` type for `children` prop
**Fix**: Changed to `import('svelte').Snippet` type
```typescript
// Before
children?: any;

// After
children?: import('svelte').Snippet;
```

### 2. NavBar.svelte
**Issue**: Missing key in each block for datalist options
**Fix**: Added index-based key
```svelte
<!-- Before -->
{#each sectionFractions as frac}
  <option value={frac}></option>
{/each}

<!-- After -->
{#each sectionFractions as frac, i (i)}
  <option value={frac}></option>
{/each}
```

### 3. SideBar.svelte
**Issue**: `any` type for `children` prop
**Fix**: Changed to `import('svelte').Snippet` type
```typescript
// Same as HeaderBar fix
children?: import('svelte').Snippet;
```

### 4. TOCView.svelte
**Issues**:
- Multiple `any` types
- Using `Set` instead of `SvelteSet`
- Missing keys in each blocks

**Fixes**:
```typescript
// 1. Added proper interface
interface TOCItem {
  label: string;
  href?: string;
  subitems?: TOCItem[];
}

// 2. Changed to SvelteSet
import { SvelteSet } from 'svelte/reactivity';
let expandedItems = new SvelteSet<string>();

// 3. Removed manual reassignment (SvelteSet is reactive)
function toggleExpand(id: string) {
  if (expandedItems.has(id)) {
    expandedItems.delete(id);
  } else {
    expandedItems.add(id);
  }
  // No longer need: expandedItems = new Set(expandedItems);
}

// 4. Added keys to each blocks
{#each toc as item, i (item.label + i)}
{#each item.subitems as subitem, j (itemId + '-' + subitem.label + j)}
```

### 5. Reader.svelte
**Issues**:
- Unused variable `showProgressSlider`
- Multiple `any` types
- Using `Map` instead of `SvelteMap`
- Direct DOM manipulation warning

**Fixes**:
```typescript
// 1. Removed unused variable
// let showProgressSlider = $state(false); // REMOVED

// 2. Added proper types
import type { FoliateView } from '$lib/types/foliate';
let view: FoliateView | null = null;

// 3. Defined TOCItem interface
interface TOCItem {
  label: string;
  href?: string;
  subitems?: TOCItem[];
}
let toc: TOCItem[] = $state([]);

// 4. Changed to SvelteMap
import { SvelteMap } from 'svelte/reactivity';
let annotations = new SvelteMap<number, Array<{ value: unknown; color?: string; note?: string }>>();
let annotationsByValue = new SvelteMap<unknown, { value: unknown; color?: string; note?: string }>();

// 5. Typed all event handlers properly
function handleLoad({ detail }: CustomEvent<{ doc: Document }>) { ... }
function handleRelocate({ detail }: CustomEvent<{ ... }>) { ... }

// 6. Typed file parameter
async function openBook(file: File | FileSystemDirectoryHandle) { ... }

// 7. Fixed DOM manipulation with proper typing
const viewElement = document.createElement('foliate-view') as unknown as FoliateView;
view = viewElement;
viewContainer.appendChild(viewElement);
```

### 6. foliate.d.ts
**Issue**: Multiple `any` types in type definitions
**Fixes**:
```typescript
// 1. Section ID
id?: string | number; // was: any

// 2. Calibre bookmark
[key: string]: unknown; // was: any

// 3. Annotation value
value: string | Record<string, unknown>; // was: any

// 4. Overlay attach parameter
attach: (overlay: { element: HTMLElement; redraw: () => void }) => void; // was: any

// 5. Draw function parameters
draw: (fn: (range: Range) => SVGElement, options: Record<string, unknown>) => void; // was: any, any

// 6. Event detail values
value: string | Record<string, unknown>; // was: any
```

### 7. format.ts
**Issue**: Multiple `any` types
**Fixes**:
```typescript
// Added proper types
type LanguageMap = string | { [key: string]: string };
type Contributor = string | { name?: LanguageMap; [key: string]: unknown };

// Before
export const formatLanguageMap = (x: any): string => { ... }
export const formatOneContributor = (contributor: any): string => { ... }
export const formatContributor = (contributor: any): string => { ... }

// After
export const formatLanguageMap = (x: LanguageMap | null | undefined): string => { ... }
export const formatOneContributor = (contributor: Contributor): string => { ... }
export const formatContributor = (contributor: Contributor | Contributor[]): string => { ... }
```

## Key Patterns Used

### 1. Svelte 5 Reactivity
- `SvelteMap` instead of `Map`
- `SvelteSet` instead of `Set`
- These are automatically reactive and don't need manual reassignment

### 2. Each Block Keys
Always provide unique keys for `{#each}` blocks:
```svelte
{#each items as item, i (item.id || i)}
```

### 3. Snippet Type
For Svelte 5 children/slots:
```typescript
children?: import('svelte').Snippet;
```

### 4. Event Handler Types
Use CustomEvent with proper detail typing:
```typescript
function handler({ detail }: CustomEvent<{ prop: Type }>) { ... }
```

### 5. Unknown over Any
Prefer `unknown` over `any` when type is truly unknown:
```typescript
[key: string]: unknown; // instead of any
```

## Testing

Run ESLint to verify all fixes:
```bash
pnpm eslint . --ext .js,.ts,.svelte
```

Should now show:
```
✔ No problems found
```

## Benefits

1. **Type Safety**: Caught potential runtime errors at compile time
2. **Better IntelliSense**: Improved autocomplete and type hints
3. **Svelte 5 Best Practices**: Using reactive collections properly
4. **Maintainability**: Clearer code with explicit types
5. **Performance**: Svelte's reactive collections are optimized
