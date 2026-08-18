# Tool Box

Tool Box is a browser-local workspace for small developer utilities; user content stays in the browser unless the user explicitly creates a share link.

## Language

**Tool**:
A focused browser-local utility that transforms, compares, or inspects user-provided content.
_Avoid_: Feature, page

**Diff Session**:
The current pair of original and modified text, its language mode, derived statistics, and saved snapshots.
_Avoid_: Diff state, comparison state

**Diff Snapshot**:
An immutable saved point from a **Diff Session** that can be restored later.
_Avoid_: History item, saved diff

**Image Comparison**:
A pair of original and modified images viewed through side-by-side, overlay, slider, or difference modes.
_Avoid_: Image diff state, image viewer

**Local Drop**:
A global browser-local holding area for up to twenty short-lived text snippets. It stays available alongside every **Tool** and never sends content over the network.
_Avoid_: Notes, clipboard history, saved items

**Local Drop Item**:
One immutable text snippet in the **Local Drop**, including its capture time. Valid JSON may be formatted for display, but copying always returns the original text.
_Avoid_: Note, message

**Scratchpad**:
A browser-local writing **Tool** for editable drafts that persist across app sessions.
_Avoid_: Local Drop, clipboard

**Scratch Draft**:
One editable title and text body in the **Scratchpad**, including its last-updated time. A draft is automatically saved in the browser and can be copied or downloaded.
_Avoid_: Local Drop Item, snapshot

## Relationships

- The workspace contains multiple **Tools**
- A text comparison **Tool** owns exactly one active **Diff Session**
- A **Diff Session** contains zero to twenty **Diff Snapshots**
- An image comparison **Tool** owns exactly one active **Image Comparison**
- The workspace owns exactly one **Local Drop**
- The **Local Drop** contains zero to twenty **Local Drop Items**
- The workspace owns exactly one **Scratchpad**
- The **Scratchpad** contains one to twenty **Scratch Drafts**

## Example dialogue

> **Dev:** "Does restoring a **Diff Snapshot** create a new **Diff Session**?"
> **Domain expert:** "No. It replaces the content and language mode of the active **Diff Session**."

> **Dev:** "Should a JSON snippet become a special **Local Drop Item**?"
> **Domain expert:** "No. Every item keeps plain text; JSON formatting is only a derived presentation."

## Flagged ambiguities

- "History" refers to the collection of **Diff Snapshots**, not every editor change.
- The **Local Drop** is intentionally temporary and bounded; it is not a note-taking or archival system.
- **Scratch Drafts** persist across app sessions, unlike ordinary **Tool** input state and **Local Drop Items**.
