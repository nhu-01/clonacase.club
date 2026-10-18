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

## Sign in

Any made-up email and password will open a desk. The password is thrown away. The email and username stay in a signed browser cookie for that visit and are not written down. There is no MongoDB database and no Teradata database.

The sign-in page also has two shortcuts, Ada Voss and Leif Moran. Any password works for those too.

## What a room can do

- Clone an open file. The clone starts private, and the original timeline stays put.
- Add milestones with a date, a note, a source, and an optional image link.
- Leave notes in the room, then pin one onto the timeline with a label.
- Link another file. The line on the map stays unconfirmed until a different volunteer agrees.
- Draft a brief from the milestones already in the room. It lists the sourced sequence, gaps of ten days or more, leads, and inconclusive notes.
- Share the room only after every sourced milestone names a source, and you confirm the room names no suspect.

Notes inside a repository are kept in `data/store.json` on the machine running the app. That folder is local and is not committed. On Vercel the disk is read-only, so those notes sit in a temporary shared document so a clone can be opened again. If that document is cleared, the notes go with it. Emails and passwords are not in that document.

## Stack

Next.js, React, TypeScript, Tailwind, and shadcn/ui. Sign-in is a signed cookie. There is no model API key. The brief is written from the timeline in this app, on purpose: it cannot browse, name a suspect, or predict a place.
