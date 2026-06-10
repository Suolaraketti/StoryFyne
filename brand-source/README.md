# Brand source assets — drop logo SVGs here

Two ways to get them to me (either works):
  A) **Commit them**:  copy the .svg files into this folder, then
       git add brand-source && git commit -m "logo svgs" && git push
  B) **Attach in chat**: drag the .svg file into the chat (like you did the videos).
     Don't paste it as an image — attach the actual file.

Then say the word and I wire the engine to use them.

## What to drop (use these names if you can)

| filename                | what it is                              |
|-------------------------|-----------------------------------------|
| dialfyne-lockup.svg     | mark + "DIALFYNE" wordmark (horizontal) |
| dialfyne-mark.svg       | just the dial mark (dot + tube + bars)  |
| dialfyne-wordmark.svg   | just the "DIALFYNE" text                |
| dialfyne-stacked.svg    | mark on top, wordmark below (optional)  |

A clean lockup SVG alone already lets me do a crisp, resolution-independent reveal.

## Bonus (only if it's easy) — element IDs unlock per-piece animation

If the SVG has named groups/ids for the pieces, I can animate each one on its own —
the dot pulsing in, the tube drawing on, the three bars firing out one at a time:

  <g id="mark">
    <circle id="mark-dot" .../>
    <path   id="mark-tube" .../>
    <rect   id="bar-1" .../>   <rect id="bar-2" .../>   <rect id="bar-3" .../>
  </g>
  <g id="wordmark"> ... </g>

Most export tools (Figma: name the layers, then "Export as SVG") carry the names
through as ids. If yours don't, no problem — the whole-logo reveal still looks great.
