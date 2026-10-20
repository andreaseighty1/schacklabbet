# Schacklabbet

Ett gratis, reklamfritt schackspel på svenska för nyfikna elever, framför allt 9–12 år. Enspelarversionen fungerar utan elevkonto och utan Supabase. Projektet är fristående från Schackfyran.

**Spela:** <https://schacklabbet.42improbableowls.com/>

## Fungerar i version 0.1

- Komplett regelmotor med chess.js: schack, matt, patt, rockad, en passant, valfri förvandling och remiavslut.
- Lokal Stockfish.js 19 lite single-threaded i en avslutningsbar Web Worker. Fem konfigurerade nivåer; ingen betald AI-tjänst.
- Klick, drag och släpp, tangentbord, vändning, draglista, slagna pjäser och förra draget.
- Tre stödprofiler. Lagliga drag, lagligt slagbara pjäser, frivilliga förhandsvarningar inklusive en passant och tre steg av ledtrådar.
- Pågående parti och historik sparas lokalt. Ångra i stödprofiler, ge upp, slutresultat, genomspelning och PGN-export.
- Fyra interaktiva lektioner, två verifierade mattproblem, lokala medaljer och en enkel väg genom tävlingsträningen.
- Supabase-inställningar kan kontrolleras på kompis-sidan, utan att något elevkonto skapas.

Privata nätpartier, schackklocka och motorbaserad efteranalys av misstag är **inte implementerade**. Kompis-sidan märker multiplayer som kommande. Ingen klient kan skriva speldata till Supabase i denna version.

## Starta lokalt

Kräver Node.js 24 och npm.

```sh
npm ci
npm run dev
```

Öppna adressen som Vite skriver ut, normalt `http://127.0.0.1:5173`. Alla sidor använder hash-routing så att statisk hosting och omladdning fungerar.

```sh
npm run lint
npm test
npm run build
npm run preview
node scripts/live-engine-check.mjs
```

Webbläsartester:

```sh
npx playwright install chromium
npm run test:e2e
```

Playwright kör flöden med desktopstorlek 1366 × 768 och mobilstorlek. GitHub Actions installerar Chromium och kör samma tester före publicering. Se `DEVELOPMENT_LOG.md` för vad som faktiskt har körts i utvecklingsmiljön.

## GitHub Pages

Workflow: `.github/workflows/pages.yml`. Push till `main` kör lint, enhetstester, Playwright och produktionsbygge och publicerar därefter `dist`.

1. I repositoryt: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. Ange **Custom domain**: `schacklabbet.42improbableowls.com`. Workflow använder `/` som bas för JS, CSS, WASM, licenser och Worker och genererar motsvarande `CNAME`.
3. Supabase-projektets URL och publishable-nyckel har offentliga standardvärden i workflow. De kan ersättas med repository-variablerna `VITE_SUPABASE_URL` och `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Avvakta grön Actions-körning och verifiera sedan det publika spelet. Misslyckade tester stoppar publicering.

### Egen subdomän

Adress: **schacklabbet.42improbableowls.com**. Ägaren meddelade den 20 oktober 2026 att subdomänen är skapad. DNS ska peka på `andreaseighty1.github.io`. Inga DNS-poster har ändrats av utvecklingsverktygen.

Inställningar:

1. Skapa DNS-posten `CNAME`, namn `schacklabbet`, mål `andreaseighty1.github.io` (ingen `https://` och ingen sökväg).
2. Lägg in domänen under GitHub **Settings → Pages → Custom domain** och låt DNS-kontrollen slutföras.
3. Workflow har redan dessa standardvärden. Vid behov kan de ersättas med repository-variabler under **Settings → Secrets and variables → Actions → Variables**:
   - `PAGES_BASE_PATH` = `/`
   - `PAGES_CUSTOM_DOMAIN` = `schacklabbet.42improbableowls.com`
4. Kör workflow igen efter att Pages aktiverats. Byggskriptet genererar `CNAME` från domäninställningen.
5. Aktivera **Enforce HTTPS** när GitHub har utfärdat certifikatet.

För framtida byte till vanlig repository-Pages utan egen domän: ändra workflow så att `VITE_BASE_PATH` är `/schacklabbet/` och `VITE_CUSTOM_DOMAIN` är tom. Ta även bort Custom domain i Pages-inställningarna.

## Supabase

Projekt-URL: `https://ixioaisppcqqutufpuct.supabase.co`. Den 20 oktober 2026 verifierades HTTP 200 för `/auth/v1/settings` med projektets publishable-nyckel och `anonymous_users: true`, `disable_signup: false` efter att ägaren aktiverat anonym inloggning. Det verifierar inte GitHub-integrationen eller databasbehörigheter.

Kopiera `.env.example` till `.env.local` för lokal konfiguration. Endast dessa offentliga värden hör hemma i frontend:

```dotenv
VITE_SUPABASE_URL=https://ditt-projekt.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Databaslösenord, `sb_secret_...`, service-role-nycklar och Supabase access tokens får aldrig ligga i `VITE_*`, Git eller frontend. `.env.local` och lokala lösenordsfiler undantas från Git.

### Vad återstår för multiplayer?

GitHub-integrationen installerar inte automatiskt ett säkert schackbackend. I nästa etapp behövs migrationsfiler, RLS, anonym autentisering i klienten, privat lobby, servervalidering med chess.js, atomiska versionskontroller och Realtime. Inga tabeller, RLS-policyer eller Edge Functions har lagts in i projektet ännu. Se `ARCHITECTURE.md` och `ROADMAP.md`.

## Integritet och lokal data

Inga namn, e-postadresser, annonser, analysverktyg eller chattfunktioner. Spel och framsteg sparas i webbläsarens `localStorage` med versionerade nycklar. Data försvinner vid rensning av webbplatsdata och följer inte med till en annan dator. Supabase kontaktas bara när anslutningskontrollen används; ingen inloggning sker då.

## Grafik och motorlicens

Logotyp, favicon och samtliga pjäser är egna SVG-former. Ikoner: Lucide, ISC. Stockfish är GPL-3.0. Oförändrade motorfiler kopieras från den låsta npm-versionen vid bygge. Licenstext, motsvarande källkodsarkiv och nödvändig nätverksfil distribueras tillsammans med webbplatsen. Se `THIRD_PARTY_NOTICES.md` och `public/licenses/README.md`.

## Röstinstruktioner – förberett inspelningsunderlag

Manus och filnamn finns i [`docs/audio/ROSTMANUS.md`](docs/audio/ROSTMANUS.md). Första omgången P1 innehåller 25 klipp. Varje replik finns som en egen UTF-8-textfil under `docs/audio/elevenlabs-input/`. Spara det genererade ljudet med samma basnamn och `.mp3`, och lägg färdiga ljud i `public/audio/sv-SE/`.

`docs/audio/manifest.json` är källan för manuset. Kör `npm run prepare:voiceover` efter ändringar för att validera filnamn, prioritering och täckning av de sex övningarna och återskapa textfilerna. P2 innehåller senare spelhändelser och P3 avser klocka och multiplayer som ännu inte är implementerade.

Inga ljudfiler eller ljudspelare är inkopplade ännu. Den planerade spelaren är av som standard, med egen Röst på/av-kontroll och Lyssna/Stoppa/Lyssna igen per lektion. Ingen uppspelning börjar automatiskt när sidan öppnas. ElevenLabs-nycklar behövs inte i frontend; den ska använda färdiga lokala MP3-filer.
