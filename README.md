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

Sign in with an email and password, or choose a username on a first visit. Emails and passwords are not written down.

## What a room can do

- Clone an open file. It saves into your repository and starts private. Add notes, a link to an article, photo, video, or PDF, or a hypothetical timeline, then make that repository public or delete it.
- Add milestones with a date, a note, a source, and an optional image link.
- Leave notes in the room, then pin one onto the timeline with a label.
- Link another file. The line on the map stays unconfirmed until a different volunteer agrees.
- Draft a brief from the milestones already in the room. It lists the sourced sequence, gaps of ten days or more, leads, and inconclusive notes.
- Share the room only after every sourced milestone names a source, and you confirm the room names no suspect.
- From someone else’s public repository, clone a private copy tagged “Cloned from” that person, or fork it. A fork does not write onto their desk. A new note, media link, or hypothetical event is a pull request on the PRs page until they accept it. A hypothetical line stays a reading, not a finding.
- The username in the header opens your profile. A year of squares counts private clones and new info: notes, sources, hypothetical events, and pull requests. The same actions are listed under the chart.

## Database

clonacase stores the timeline in MongoDB when `MONGODB_URI` connects. Poster dates live in the `posterEvents` collection. A private repository, including its notes, is one document in `repositories`. Discussion posts are in `threads`. Pull requests are in `pulls`. If that database refuses the connection, the same desk is kept in a private Vercel Blob file instead, so a clone still saves. Emails and passwords are not fields in any document.

A fork checks a pull request before it can be sent. Set `GEMINI_API_KEY` to a Gemini API key and that check uses Gemini. Without the key, the same check runs on the server and still holds back a suspect, a private address, or a family member who is not on the poster.

Set `MONGODB_URI` to a MongoDB connection string. Locally that is:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/clonacase
```

On the hosted site, create a free M0 cluster in [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and add that connection string as `MONGODB_URI` in the Vercel project. The free cluster stays free.

If `MONGODB_URI` is missing, the app falls back to `data/store.json` on your machine, or to a temporary shared document when it is running on Vercel.

## Stack

Next.js, React, TypeScript, Tailwind, shadcn/ui, and MongoDB. Sign-in is a signed cookie. There is no model API key. The brief is written from the timeline in this app, on purpose: it cannot browse, name a suspect, or predict a place.
