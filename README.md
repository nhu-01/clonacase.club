# Hearth

A dark, quiet desk for a public case file. Volunteers sign in, open a demonstration file, and clone it into a private room. The room is a timeline. Each milestone is sourced, a lead, or inconclusive. Two files can be linked only as a sourced claim, and a second volunteer has to confirm it. A draft brief cites the timeline and does not go looking.

The three people in the archive are fictional. Hearth does not scrape, search the web, or keep an offender list.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Desks already set

| Name | Email | Password |
| --- | --- | --- |
| Ada Voss | ada@hearth.local | watchlight |
| Leif Moran | leif@hearth.local | watchlight |

Ada created the sample link between Mara Ellison and Helen Cho. Sign in as Leif to confirm it.

You can also open your own desk from the sign-in page.

## What a room can do

- Clone an open file. The clone starts private, and the original timeline stays put.
- Add milestones with a date, a note, a source, and an optional image link.
- Leave notes in the room, then pin one onto the timeline with a label.
- Link another file. The line on the map stays unconfirmed until a different volunteer agrees.
- Draft a brief from the milestones already in the room. It lists the sourced sequence, gaps of ten days or more, leads, and inconclusive notes.
- Share the room only after every sourced milestone names a source, and you confirm the room names no suspect.

Rooms, notes, and accounts are stored in `data/store.json` on the machine running the app. That folder is local and is not committed.

## Stack

Next.js, React, TypeScript, Tailwind, and shadcn/ui. Sign-in is a signed cookie. There is no external database and no model API key. The brief is written from the timeline in this app, on purpose: it cannot browse, name a suspect, or predict a place.
