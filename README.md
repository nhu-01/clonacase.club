# clonacase

A desk for a public missing-person poster. Search a name, choose an anonymous username, and open that person’s timeline. Clone the case into a private repository, then keep notes, sources, and media there. A draft reads only what you saved.

The live demo uses adult public posters from the [Washington State Patrol missing-persons page](https://wsp.wa.gov/crime/alerts-missing-persons/missing-persons/). Choosing a name opens that person’s timeline, photograph, and poster. Photographs and PDFs stay on the state site. Anyone under 18 is left out. clonacase does not scrape accounts, search the web for a suspect, or keep an offender list.

The public address is [clonacase.club](https://www.clonacase.club).

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Sign in

Sign in with an email and password, or choose a username on a first visit. The username field says not to use a real name. Emails and passwords are not written down. The session is a signed cookie.

## What a room can do

- Clone an open file. It saves into your repository and starts private. Add notes, a link to an article, photo, video, or PDF, or a hypothetical timeline, then make that repository public or delete it.
- Add milestones with a date, a note, a source, and an optional image link.
- Leave notes in the room, then pin one onto the timeline with a label.
- Link another file. The line on the map stays unconfirmed until a different volunteer agrees.
- Draft a brief from the milestones already in the room. It lists the sourced sequence, gaps of ten days or more, leads, and inconclusive notes. It does not browse, name a suspect, or predict a place.
- Share the room only after every sourced milestone names a source, and you confirm the room names no suspect.
- From someone else’s public repository, clone a private copy tagged “Cloned from” that person, or fork it. A fork does not write onto their desk. A new note, media link, or hypothetical event is a pull request on the PRs page until they accept it. A hypothetical line stays a reading, not a finding.
- The username in the header opens your profile. A year of squares, 53 weeks aligned to Sunday, counts private clones and new info: notes, sources, hypothetical events, and pull requests. A fork is not a clone. A note copied from someone else’s repository does not count. The same actions are listed under the chart.

## Text alerts

Photon 2.0 can iMessage someone who follows a case or a repository. This uses the beta API at `https://api.photon.codes/v1`. In the [Photon 2.0 dashboard](https://app.beta.photon.codes), create a project, an API key with `project:read` and `project:write`, and an iMessage shared line. Project ids start with `pho_prj_` and API keys start with `pho_sk_`. Put these in the environment:

```bash
PHOTON_API_KEY=
PHOTON_PROJECT_ID=
PHOTON_AGENT_HANDLE=
PHOTON_WEBHOOK_SECRET=
```

`PHOTON_AGENT_HANDLE` is the number Photon assigned. A person has to iMessage that number first. Subscribing on the site then texts “You subscribed to” that case in the same chat, in that request. After that, a public change on a case they follow is sent in the same conversation: a new or edited note, comment, source, hypothetical event, working note, or a repository that was just shared. That includes a change they make themselves. A repository follow texts that desk even when it is still private, only to the person who followed it.

The agent answers in that same chat as soon as the text arrives. A poster name follows it. `list` shows follows. `stop` and a name ends one. `latest` and a name reads the newest public update. A question about last seen, age, height, weight, agency, or the poster link is answered from the Washington State record. Anything more open is answered from the public poster and the public repository notes. Outgoing text is held back when it names a suspect, a private street address, or a family member who is not on the poster.

Photon posts each new text to `POST /api/photon/inbox`. The signing secret from that webhook is `PHOTON_WEBHOOK_SECRET`. The same route runs once a minute as a backup. Set `CRON_SECRET` so only that cron can call the backup.

## Database

clonacase stores the timeline in MongoDB when `MONGODB_URI` connects. Poster dates live in the `posterEvents` collection. A private repository, including its notes, is one document in `repositories`. Discussion posts are in `threads`. Pull requests are in `pulls`. Follows are in `alerts`. If that database refuses the connection, the same desk is kept in a private Vercel Blob file instead, so a clone still saves. Emails and passwords are not fields in any document.

A fork checks a pull request before it can be sent. Set `GEMINI_API_KEY` to a Gemini API key and that check uses Gemini. The iMessage agent uses the same key for an open question. Without the key, the pull-request check still runs on the server, and the agent still answers poster facts and follow commands. Both paths hold back a suspect, a private address, or a family member who is not on the poster.

Set `MONGODB_URI` to a MongoDB connection string. Locally that is:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/clonacase
```

On the hosted site, create a free M0 cluster in [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and add that connection string as `MONGODB_URI` in the Vercel project. The free cluster stays free.

If `MONGODB_URI` is missing, the app falls back to `data/store.json` on your machine, or to a temporary shared document when it is running on Vercel.

## Stack

Next.js, React, TypeScript, Tailwind, shadcn/ui, Node.js, MongoDB, Vercel, Vercel Blob, Photon 2.0, iMessage, and Gemini. Sign-in is a signed cookie. The brief is written from the timeline in this app, on purpose: it cannot browse, name a suspect, or predict a place.
