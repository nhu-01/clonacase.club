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

Any made-up email and password will open a desk. The password is thrown away. The email and username stay in a signed browser cookie for that visit. Emails and passwords are not written to the database.

The sign-in page also has two shortcuts, Ada Voss and Leif Moran. Any password works for those too.

## What a room can do

- Clone an open file. The clone starts private, and the original timeline stays put.
- Add milestones with a date, a note, a source, and an optional image link.
- Leave notes in the room, then pin one onto the timeline with a label.
- Link another file. The line on the map stays unconfirmed until a different volunteer agrees.
- Draft a brief from the milestones already in the room. It lists the sourced sequence, gaps of ten days or more, leads, and inconclusive notes.
- Share the room only after every sourced milestone names a source, and you confirm the room names no suspect.

## Database

clonacase stores the timeline in Tiger Data. Tiger Data is PostgreSQL with TimescaleDB hypertables, so poster dates, repository notes, discussion posts, and room messages are rows partitioned by time.

Set `DATABASE_URL` to a Postgres connection string. Locally that is TimescaleDB on this machine:

```bash
DATABASE_URL=postgres://clonacase:clonacase@127.0.0.1:5432/clonacase
```

On the hosted site, create a free service in [Tiger Cloud](https://console.tigerdata.com/) and add that connection string as `DATABASE_URL` in the Vercel project. The public posters are loaded into the `poster_events` hypertable. A private repository’s notes go into the `evidence` hypertable. Emails and passwords are not columns in any table.

If `DATABASE_URL` is missing, the app falls back to `data/store.json` on your machine, or to a temporary shared document when it is running on Vercel.

## Stack

Next.js, React, TypeScript, Tailwind, shadcn/ui, and Tiger Data (PostgreSQL and TimescaleDB). Sign-in is a signed cookie. There is no model API key. The brief is written from the timeline in this app, on purpose: it cannot browse, name a suspect, or predict a place.
