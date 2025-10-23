# Accessibility Fixes

Fixed all Svelte a11y warnings to ensure the app is accessible to screen readers and keyboard users.

## Fixes Applied

### 1. DropTarget.svelte - Drop Zone ARIA Role

**Issue**: `<div>` with drop/dragover handlers must have an ARIA role

**Fix**: Added proper role and label
```svelte
<div
  role="button"
  tabindex="0"
  aria-label="Drop zone for ebook files"
  ondrop={handleDrop}
  ondragover={handleDragOver}
>
```

**Benefits**:
- Screen readers announce this as an interactive element
- Users understand it's a drop target
- Keyboard focusable with `tabindex="0"`

### 2. TOCView.svelte - Expand/Collapse Button Labels

**Issue**: Buttons without text need `aria-label`

**Fix**: Added dynamic aria-label
```svelte
<button
  aria-expanded={isExpanded}
  aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
>
  <svg>...</svg>
</button>
```

**Benefits**:
- Screen readers announce button purpose
- Users know whether clicking will expand or collapse
- `aria-expanded` indicates current state

### 3. Menu.svelte - Proper Menu Structure

**Issues**:
- `<li>` elements had click handlers (non-interactive)
- `aria-checked` not supported on `<li role="listitem">`
- No keyboard event handlers

**Fix**: Complete rewrite using proper menu roles and buttons
```svelte
<ul role="menu">
  <li role="presentation">
    <strong>Layout</strong>
  </li>
  <li role="menuitemradio" aria-checked={selectedLayout === 'paginated'}>
    <button
      type="button"
      onclick={() => selectLayout('paginated')}
      onkeydown={(e) => handleKeyDown(e, 'paginated')}
      class="w-full text-left..."
    >
      <!-- Checkmark and text -->
    </button>
  </li>
</ul>
```

**Changes**:
1. **Proper ARIA roles**:
   - `role="menu"` on `<ul>`
   - `role="menuitemradio"` on menu items
   - `role="presentation"` on header item
   - `aria-checked` now valid on `menuitemradio`

2. **Interactive elements**:
   - Replaced clickable `<li>` with `<button>` inside `<li>`
   - Buttons are naturally keyboard accessible

3. **Keyboard support**:
   - Added `onkeydown` handler
   - Supports Enter and Space keys
   - Prevents default to avoid unwanted behavior

**Benefits**:
- Screen readers correctly identify this as a menu
- Keyboard users can navigate with Enter/Space
- Radio button semantics for mutually exclusive choices
- Proper focus management

## ARIA Roles Used

### role="button"
Used for the drop zone. Indicates an interactive element that performs an action when activated.

### role="menu"
Container for a set of actions or functions. Screen readers announce "menu" when entering.

### role="menuitemradio"
Menu item with radio button semantics. Can be checked/unchecked. Screen readers announce "radio button" and state.

### role="presentation"
Removes semantic meaning. Used for the "Layout" header which is just presentational text.

## Keyboard Navigation

### Drop Zone
- Can receive focus with Tab key
- Users can trigger file picker

### TOC Expand Buttons
- Tab to focus
- Enter or Space to expand/collapse
- `aria-expanded` announces state changes

### Menu Items
- Tab through menu buttons
- Enter or Space to select
- `aria-checked` announces selection state

## Testing Checklist

✅ Screen reader announces all interactive elements
✅ All buttons have labels or text
✅ Keyboard navigation works throughout
✅ ARIA roles are semantically correct
✅ Focus indicators visible
✅ No a11y warnings in Svelte compilation

## Tools for Testing

### Screen Readers
- **macOS**: VoiceOver (Cmd+F5)
- **Windows**: NVDA (free) or JAWS
- **Linux**: Orca

### Browser DevTools
- Chrome: Lighthouse accessibility audit
- Firefox: Accessibility Inspector
- Edge: Accessibility Insights

### Keyboard Testing
Test with keyboard only (no mouse):
1. Tab through all interactive elements
2. Use Enter/Space on buttons
3. Verify all functionality accessible

## Best Practices Applied

1. **Semantic HTML**: Use native interactive elements (`<button>`, `<a>`) when possible
2. **ARIA roles**: Only when native HTML isn't sufficient
3. **Labels**: All interactive elements have visible text or `aria-label`
4. **Keyboard**: All mouse interactions also work with keyboard
5. **Focus management**: Proper tab order and focus indicators
6. **State communication**: Use `aria-expanded`, `aria-checked` to announce states

## Resources

- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Svelte a11y warnings](https://svelte.dev/docs/accessibility-warnings)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
