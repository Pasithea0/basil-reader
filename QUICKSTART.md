# Quick Start Guide

## Get Started in 3 Steps

### 1. Setup

```bash
# Clone with submodules
git clone --recurse-submodules <your-repo-url>
cd basil-reader

# Install dependencies
pnpm install
```

### 2. Run

```bash
pnpm dev
```

### 3. Read

Open http://localhost:5173 and drag & drop an ebook file!

## What Can You Read?

- **EPUB** - Most common ebook format
- **MOBI/AZW3** - Kindle books
- **FB2** - FictionBook format
- **CBZ** - Comic book archives
- **PDF** - Experimental support

## Where to Get Test Books?

Free, legal ebooks:

- [Standard Ebooks](https://standardebooks.org/) - Beautifully formatted classics
- [Project Gutenberg](https://www.gutenberg.org/) - Thousands of free books
- [Internet Archive](https://archive.org/details/books) - Massive collection

## Basic Controls

- **Arrow Keys** or **h/l** → Navigate pages
- **Click ≡** → Open table of contents
- **Click ⚙** → Change reading mode
- **Drag slider** → Jump to any page

## Troubleshooting

### No files showing after drop?

- Check browser console (F12) for errors
- Ensure foliate-js submodule is initialized: `git submodule update --init`

### Page won't load?

- Clear browser cache
- Try a different book file
- Check Content Security Policy isn't blocking

### Performance issues?

- Switch from Paginated to Scrolled mode
- Try closing other browser tabs
- Update to latest version of foliate-js

## Next Steps

- Read [IMPLEMENTATION.md](./IMPLEMENTATION.md) to understand the architecture
- Check out [README.md](./README.md) for full documentation
- Explore components in `src/lib/components/reader/`
- Customize styles in individual component files

Enjoy reading! 📚
