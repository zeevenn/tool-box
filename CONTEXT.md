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

## Relationships

- The workspace contains multiple **Tools**
- A text comparison **Tool** owns exactly one active **Diff Session**
- A **Diff Session** contains zero to twenty **Diff Snapshots**
- An image comparison **Tool** owns exactly one active **Image Comparison**

## Example dialogue

> **Dev:** "Does restoring a **Diff Snapshot** create a new **Diff Session**?"
> **Domain expert:** "No. It replaces the content and language mode of the active **Diff Session**."

## Flagged ambiguities

- "History" refers to the collection of **Diff Snapshots**, not every editor change.
