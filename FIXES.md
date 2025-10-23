# Fixes Applied

## Issue: File Upload Not Working

The drag & drop and file button click were not working.

### Root Cause

The components were using Svelte 4 event syntax (`on:event`) mixed with Svelte 5 (`$props()`), which caused event handlers to not be properly attached.

### Changes Made

#### 1. Updated DropTarget.svelte to Svelte 5 Syntax

**Before** (Svelte 4 style):

```typescript
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();

// ...
dispatch('open', { file });

// Template
<div on:drop={handleDrop} on:dragover={handleDragOver}>
<button on:click={handleClick}>
```

**After** (Svelte 5 style):

```typescript
interface Props {
    onopen?: (event: CustomEvent<{ file: File }>) => void;
}
let { onopen }: Props = $props();

// ...
onopen?.(new CustomEvent('open', { detail: { file } }));

// Template
<div ondrop={handleDrop} ondragover={handleDragOver}>
<button onclick={handleClick}>
```

#### 2. Updated Reader.svelte Event Binding

**Before**:

```svelte
<DropTarget on:open={(e) => openBook(e.detail.file)} />
```

**After**:

```svelte
<DropTarget onopen={(e) => openBook(e.detail.file)} />
```

#### 3. Removed Restrictive CSP

Removed the Content Security Policy from `+page.svelte` that was potentially blocking inline event handlers during development.

#### 4. Added Debug Logging

Added console.log statements in:

- `handleFileButtonClick()` - Logs when button is clicked
- `handleFileInputChange()` - Logs when file is selected
- `handleDrop()` - Logs when file is dropped
- `openBook()` - Logs when book opening starts

#### 5. Added File Type Accept Attribute

Added `accept` attribute to file input to filter for ebook formats:

```html
<input type="file" accept=".epub,.mobi,.azw,.azw3,.fb2,.cbz,.pdf" ... />
```

#### 6. Updated Vite Config

Added configuration to properly handle foliate-js modules:

```typescript
export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	optimizeDeps: {
		exclude: ['$lib/foliate-js']
	},
	server: {
		fs: {
			allow: ['..']
		}
	}
});
```

### Testing the Fix

1. Start the dev server:

   ```bash
   pnpm dev
   ```

2. Open browser to `http://localhost:5173`

3. Open browser console (F12) to see debug messages

4. Test file button:
   - Click "choose a file" button
   - Should see console log: "File button clicked"
   - Should see console log: "Input element: [HTMLInputElement]"
   - Select an ebook file
   - Should see console logs showing file selection and book opening

5. Test drag & drop:
   - Drag an ebook file over the page
   - Should see console log: "Drag over event"
   - Drop the file
   - Should see console logs: "Drop event", "Dropped item:", "File to open:", "openBook called with:"

### Expected Behavior

After the fix:

- ✅ File button click opens file picker
- ✅ Selecting a file starts book opening process
- ✅ Drag & drop works for ebook files
- ✅ Console logs show event flow
- ✅ DropTarget component hides after file selection
- ✅ Reader UI appears with book content

### Debug Console Output

When working correctly, you should see:

```
File button clicked
Input element: <input type="file" id="file-input" ...>
File input changed Event { ... }
Selected file: File { name: "book.epub", size: 1234567, ... }
openBook called with: File { ... }
Created foliate-view element: <foliate-view>
```

### If Still Not Working

1. **Check browser console** for any errors
2. **Verify foliate-js files exist**: `ls src/lib/foliate-js/view.js`
3. **Clear browser cache** and hard reload (Ctrl+Shift+R)
4. **Try a different browser** (Chrome, Firefox, Safari)
5. **Check file permissions** on the ebook file
6. **Try a different ebook file** (download a free EPUB from Standard Ebooks)

### Remaining TODO

If the fix works, the debug console.log statements can be removed from production build.

Other components (HeaderBar, NavBar, SideBar, Menu, TOCView) should also be migrated to Svelte 5 event syntax for consistency, but they're not critical for the file upload to work.
