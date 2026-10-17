# clonacase

A dark desk for a public missing-person poster. Search a name, choose an anonymous username, and open that person’s timeline. Clone the case into a private repository, then keep notes, sources, and media there. A draft reads only what you saved.

The landing search reads adult public posters from the [Washington State Patrol missing-persons page](https://wsp.wa.gov/crime/alerts-missing-persons/missing-persons/). Choosing a name opens that person’s timeline, photograph, and poster. Photographs and PDFs stay on the state site. Anyone under 18 is left out. clonacase does not scrape accounts, search the web for a suspect, or keep an offender list.

The public address is [clonacase.club](https://clonacase.club). DNS for that name is managed at Porkbun.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Desks already set

| Name | Email | Password |
| --- | --- | --- |
| Ada Voss | ada@clonacase.club | watchlight |
| Leif Moran | leif@clonacase.club | watchlight |

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

On Vercel the disk is read-only, so rooms, notes, and new accounts are kept in a shared document. A visit on a new server can still open them. That document is a prototype desk: if it is cleared, the rooms go with it and the two sample accounts are created again.

## Stack

Next.js, React, TypeScript, Tailwind, and shadcn/ui. Sign-in is a signed cookie. There is no external database and no model API key. The brief is written from the timeline in this app, on purpose: it cannot browse, name a suspect, or predict a place.
