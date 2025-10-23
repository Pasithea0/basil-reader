# Test Instructions

## Quick Test

1. **Start the server**:

   ```bash
   pnpm dev
   ```

2. **Open in browser**: http://localhost:5173

3. **Open browser console**: Press F12

4. **Test the button**:
   - Click "choose a file"
   - Look for console message: "File button clicked"
   - Select an .epub file (or .mobi, .fb2, .cbz)
   - Look for console messages about file selection

5. **Test drag & drop**:
   - Drag an ebook file onto the page
   - Drop it
   - Look for console messages about drop event

## What You Should See

### In Console:

```
File button clicked
Input element: <input type="file" ...>
File input changed Event { ... }
Selected file: File { name: "...", size: ..., type: "..." }
openBook called with: File { ... }
Created foliate-view element: <foliate-view>
```

### On Page:

1. The "Drop a book here!" screen should disappear
2. The book content should start loading
3. Top and bottom toolbars should appear
4. You should see book pages

## Get a Test Book

If you don't have an ebook file, download a free one:

### EPUB Files:

- **Standard Ebooks**: https://standardebooks.org/
  - Beautiful, well-formatted classics
  - Example: [Pride and Prejudice](https://standardebooks.org/ebooks/jane-austen/pride-and-prejudice)

- **Project Gutenberg**: https://www.gutenberg.org/
  - Select EPUB format when downloading

### Sample Direct Links:

```bash
# Download a sample EPUB
curl -o alice.epub "https://www.gutenberg.org/ebooks/11.epub3.images"

# Or use wget
wget -O alice.epub "https://www.gutenberg.org/ebooks/11.epub3.images"
```

## Common Issues

### Nothing happens when clicking button:

- Check console for errors
- Verify dev server is running
- Try hard refresh (Ctrl+Shift+R)

### Console shows errors about module loading:

- Run `pnpm install` again
- Check that `src/lib/foliate-js/view.js` exists
- Try: `git submodule update --init --recursive`

### File picker opens but selecting file does nothing:

- Check console logs - should see "File input changed"
- If no logs, there's an event binding issue
- Try a different browser

### Drop doesn't work:

- Some browsers block drag/drop in certain modes
- Try the file button instead
- Check console for "Drop event" message

## Troubleshooting Commands

```bash
# Verify foliate-js is present
ls -la src/lib/foliate-js/view.js

# Should show the file. If not:
git submodule update --init --recursive

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Clear .svelte-kit cache
rm -rf .svelte-kit
pnpm dev

# Check for TypeScript errors (some expected from foliate-js)
pnpm run check
```

## Success Criteria

✅ Clicking "choose a file" opens file picker
✅ Selecting file shows console logs
✅ Book content loads and displays
✅ Can navigate pages with arrow buttons
✅ Drag and drop works

## Next Steps After Success

Once file upload works:

1. Test navigation (arrow keys, buttons)
2. Test table of contents (click ≡ button)
3. Test settings menu (click ⚙ button)
4. Test different book formats
5. Test keyboard shortcuts (h/l, arrow keys)

## Report Results

If still not working, provide:

1. Browser name and version
2. Full console output (copy all errors/logs)
3. Contents of src/lib/foliate-js/ directory (`ls src/lib/foliate-js/`)
4. Output of `pnpm run check`
