# Utvecklingslogg

## 20 oktober 2026 – första implementationen

Repositoryt `andreaseighty1/schacklabbet` var tomt. Det klonades till den angivna projektmappen. Implementeringen prioriterar fas 1, med ett mindre fungerande urval ur fas 2. Ingen multiplayerfunktion utges för att vara färdig.

### Leverans

- Statisk React-/TypeScript-app med egen identitet, SVG-pjäser, startsida, spelrum, schackskola, utmaningar, träningsväg och lokala framsteg.
- chess.js är central auktoritet för enspelarregler. Full historik bevaras och alla motordrag valideras.
- Stockfish 19 lite single-threaded, UCI, fem nivåer, timeout, avbruten beräkning och felåterhämtning.
- Lagliga hot och förhandsrisker, inklusive bundna angripare och en passant. Inga påståenden om objektivt dåliga drag utifrån enbart slaghot.
- Fyra lektioner och två mattproblem; samtliga lösningar verifieras automatiskt.
- Automatisk Pages-workflow med repositorybas som standard. Planerad egen domän dokumenterad; CNAME genereras först efter uttrycklig domänkonfiguration.
- Källkod, nätverksfil och GPL-text distribueras tillsammans med motorfilerna. Källfiler verifieras med SHA-256 vid varje förberedelse av motorn.
- En lokal lösenordsfil upptäcktes. Den lästes inte och undantogs från Git. `.env.local` undantas också.

### Supabase

Projektet `ixioaisppcqqutufpuct` nåddes först med HTTP 401 utan nyckel. Den publika nyckel användaren angav gav HTTP 200 för Auth-inställningar. `anonymous_users` var först false. Efter användarens ändring verifierades `anonymous_users: true` och `disable_signup: false`.

Ingen administrativ anslutning, GitHub-integrationsstatus, RLS, Realtime, tabellstruktur eller Edge Function har verifierats. Denna app använder ännu inga Supabase-tabeller. Inga migrationsfiler eller multiplayer-API:er är implementerade. Den publika nyckeln används i workflow och lokalt; inga backendhemligheter har lagts i koden.

### Körda kontroller

- `npm run lint`: godkänd.
- `npm test`: 46 tester godkända i fem filer, inklusive slutlig en passant-riskkontroll, PGN-resultat och konkreta ledtrådar.
- `npm run build`: godkänd produktionsbuild inklusive TypeScript, JS, CSS och motorfiler.
- `npm run check:dist`: godkända kontroller av base path, refererade resurser, oförändrade motorbinärer, giltig WASM och distribuerade GPL-källfiler. Testat efter bygge med både `/` och `/schacklabbet/`.
- `node scripts/live-engine-check.mjs`: verklig Stockfish 19 WASM gav ett lagligt svar (`e7e6`) efter `e4` i Node. Detta verifierar motorn i Node, inte Web Worker i webbläsaren.
- `npm audit`: initiala sårbarheter i äldre Vitest/tinypool rättades genom uppgradering; installationen rapporterade sedan 0 sårbarheter.

### Verifieringsgränser

Lokal devserver startade på `127.0.0.1:5173`. In-app-förhandsvisning begärdes, men browserverktygets URL-säkerhetspolicy nekade åtkomst. Ingen alternativ browserväg användes för att kringgå detta. Visuell QA, klickflöden, drag-och-släpp och riktig browser-Worker har därför inte verifierats lokalt.

Playwright-tester för desktop och mobil har skrivits och ingår i GitHub Actions. Lokalt skrivna tester räknas inte som körda. DNS och HTTPS för den kommande domänen har inte ändrats. Motorstyrkan behöver kalibreras med målgruppen.

Publik GitHub-metadata visade `has_pages: false`. Pages måste aktiveras med GitHub Actions som källa. Automatisk godkännandekontroll nekade hämtning av sparade GitHub-inloggningsuppgifter för en administrativ API-kontroll; den vägen avbröts och en offentlig metadataförfrågan användes i stället.

Första implementationen sparades i lokal commit `96bce4e`. `git push -u origin main` stoppades först av automatisk godkännandekontroll i väntan på tydligare användargodkännande.

### Förberedelse för godkänd publicering

Användaren godkände sedan uttryckligen push till det offentliga repots `main` och start av CI samt meddelade att subdomänen är skapad. Workflow uppdaterades till `/` och `schacklabbet.42improbableowls.com` som standardvärden. Pages aktiveras av ägaren i GitHub. CI- och publiceringsresultat redovisas först när de är kontrollerade.

### Verifierad publicering

- Koden pushades till `main` i `andreaseighty1/schacklabbet`, först till commit `0fbf4e0`.
- Ägaren aktiverade Pages och lade till domänen via GitHub, vilket skapade commit `98be356` med `CNAME`. Den committen hämtades lokalt med fast-forward utan överskrivning.
- GitHub Actions-körning [39410338396](https://github.com/andreaseighty1/schacklabbet/actions/runs/39410338396) slutfördes med **success** för både build och deploy. Lint, enhetstester, verklig motorkontroll, Playwright för desktop och mobil, produktionsbuild och resurskontroller passerade.
- DNS verifierades: `schacklabbet.42improbableowls.com` har CNAME till `andreaseighty1.github.io`.
- HTTPS på <https://schacklabbet.42improbableowls.com/> gav HTTP 200 med den byggda appens root-element, titel och JS-bundle.
- Appens JS, Stockfish Worker, WASM och källkodsarkiv gav HTTP 200. WASM levererades som `application/wasm`.
- Lokal visuell QA är fortfarande inte utförd; de faktiska browserflödena har nu verifierats av Playwright i GitHub Actions. Multiplayer är fortfarande kommande.

Denna dokumentationsuppdatering ändrar inte appens källkod och publiceras med `[skip ci]` för att undvika att upprepa den redan godkända bygg- och testkörningen.

### Rättad publiceringskälla

Efter den första korrekta Actions-publiceringen körde GitHubs separata Jekyll-publicering från `main` och ersatte det byggda spelet med källfiler. Domänen gav då HTTP 200 men laddade `/src/main.tsx` som `application/octet-stream`, vilket gav en vit sida. Det var inte ett Supabase-fel.

Ägaren har därefter meddelat att Pages-källan ändrats enligt instruktionen **Settings → Pages → Build and deployment → Source → GitHub Actions**. En ny vanlig push startar den befintliga test-, bygg- och publiceringskedjan igen. Efterkontrollen ska verifiera en byggd `/assets/*.js`-fil, korrekt MIME och att appen faktiskt visas.

Ompubliceringen från commit `62d1f13` slutfördes med **success** i [Actions-körning 39411746709](https://github.com/andreaseighty1/schacklabbet/actions/runs/39411746709). Ingen ny Jekyll-körning startade för den pushen. Den publika sidan laddade därefter `/assets/index-1wNjC2Qe.js` med HTTP 200 och `application/javascript`.

Den publicerade startsidan och spelrummet öppnades också i en riktig webbläsare och granskades visuellt. Ett nytt nybörjarparti startades: elevdraget `e4` följdes av motorns `c6`, och status återgick till elevens tur. Felet med den vita sidan är därmed åtgärdat och verifierat i produktion. Ingen Supabase-ändring behövdes.

### Grafik och planerade topplistor

Nästa grafiska uppdatering ger alla sex pjäser en mer genomarbetad form, gemensam sockel och subtil materialskuggning. Brädet får en tydligare ram. Fyra lektionskort och två utmaningskort får egna rörelsediagram, och framstegssidan får fyra specialritade medaljer med olika motiv och separata färger för låst/upplåst. All grafik är lokal SVG/CSS och kräver inga nya beroenden eller externa bildtjänster. Spelregler och sparformat ändras inte.

Användaren föreslog även topplistor. Roadmapen beskriver därför ett förslag till privata klassgrupper, 3/1/0 i en matchserie med lika många matcher och en separat veckolista för gemensamma uppgifter. Antal drag är extra statistik. Resultat måste verifieras på servern; ingen topplista är ännu aktiverad i appen.
