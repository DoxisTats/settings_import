# Business Studio – Application settings prototype

Clickable prototype of the **Settings** page in a Doxis Business Studio application (edit mode), including importing, exporting and updating settings definitions. Built with the Doxis One.Cloud design system.

**Start here:** [`index.html`](index.html). With GitHub Pages turned on, that is the prototype’s home page.

> Design prototype, not production code. Names and values (CRM connection, Salesforce EU, endpoint, namespaces) are example content. Nothing is saved: reloading a page resets it.

## What you can click

**Settings page** (`settings.html`)
- ⋯ next to each instance → **Rename** (dialog with name field) and **Delete** (confirmation)
- Red trash icon in the instance header → delete confirmation
- Click an instance name to select it
- **Definition options ▾** next to the tabs → Import definition, Export definition, Update from file
- ⋯ in the application header → **More options** (Export, Update from file, Update from library)
- Definition tabs, section links (Connection, Synchronization, Provider settings)
- **Find a setting** and **Search instances** filter as you type
- **Save**, **Reset changes**, **Create instance** show notifications
- Menus close on outside click or Esc

**Import definition** (`import-definition.html`)
- Trash icon removes the file; **Choose a file** puts it back
- ✕ and **Cancel** return to Settings
- **Import** returns to Settings with a “Definition imported” notification (or opens the error state if no file is chosen)

**Export definition** (`export-definitions.html`)
- Pick one definition (current tab preselected)
- Include instance values switch
- **Export** closes the panel and shows a notification

**Update from file** (`update-definition.html`)
- Definition picker (standard definitions are disabled), file card with remove / choose, summary of changes
- **Update definition** with the sample file returns to Settings with “Definition not updated”; **Read more** opens the details dialog. With a file you choose yourself, it shows “Definition updated”.

**Import definition – errors** (`import-definition-errors.html`)
- Validation summary and field errors; ✕ and Cancel return to Settings

**Reference sheets** (static): import file states, update rejected, notifications.

## Files

All files sit in one folder: `index.html` (start page), one `.html` per screen, `prototype.js` and `prototype.css` (interactions), `avatar.jpg`, and `shot-*.png` screenshots.

## Viewing it on GitHub

GitHub shows HTML files as code. To run the prototype in the browser, turn on GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**. The prototype is then at `https://<owner>.github.io/<repo>/`.

## Open points

- Whether exports include instance values by default, and whether standard definitions can be exported.
- The **Expandable** option in the import panel has a placeholder description.
- Create instance only shows a notification; it doesn’t add a row yet.
