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

Grafikcommitten `2ec7fcf` publicerades framgångsrikt i [Actions-körning 39415043082](https://github.com/andreaseighty1/schacklabbet/actions/runs/39415043082). Lokalt passerade lint, samtliga 46 enhetstester, TypeScript-/produktionsbygge och dist-kontroll. CI passerade även motor- och Playwright-tester samt Pages-deploy.

Den publicerade lektionskatalogen, medaljsidan och spelbrädet granskades visuellt på desktop. Lektionskatalog och medaljsida granskades också vid 390 × 844; katalogen hade sidbredd 375 px inom en viewport på 390 px och ingen horisontell överströmning. Tornlektionen slutfördes i den publicerade appen och låste upp upptäckarmedaljen med guldgrafik och textstatus. Ingen ny schemaläggning, poängräkning eller multiplayerfunktion implementerades i detta grafiksteg.

### Inspelningsunderlag för röstinstruktioner

Användaren spelar själv in/genererar rösten med ElevenLabs och behöver manus och filnamn. Ett svenskt underlag med 58 korta repliker har därför förberetts: 25 i första omgången P1, 23 senare spelhändelser i P2 och 10 framtida klock-/multiplayerrepliker i P3. De sex nuvarande övningarna har vardera intro, ledtråd och korrekt återkoppling. Rutnamn är utskrivna med svenskt uttal.

Manifestet är källan till individuella textfiler, en komplett manusöversikt och en filnamnslista. Generatorn validerar unika filnamn, prioriteringar och full täckning av de faktiska övnings-ID:na. Röstregin, leveransmappen och kraven på avstängd standard, aktivt val, omedelbart stopp och ingen överlappning dokumenteras i manuset. Dynamiska rutor, pjäsnamn och spelkoder hålls utanför de fasta ljudklippen. Inga ljudfiler genererades och ingen ljudspelare eller ElevenLabs-tjänst kopplades in i detta steg.

Roadmapen har även uppdaterats efter den tidigare regelkontrollen: föreslagen träning med 10 eller 15 minuter per spelare, utan klocka som standard, och 3/2/1 som förslag till Schackfyran-lik poängräkning. Klocka och topplista är fortfarande planerade funktioner.

`npm run prepare:voiceover` passerade valideringen för samtliga 58 manus och alla sex övningar. `npm run lint` passerade. Ett separat P1-paket för användaren skapades och kontrollerades: 25 rena textfiler, ett sammanställt P1-manus och en lista med exakta MP3-filnamn. Paketet innehåller inga ljudfiler och inga framtida P3-repliker. Ingen ny spelkod ändrades, så schack- och webbläsartester upprepades inte för detta dokumentationssteg.

### Levererade ljud och språk för årskurs 4

Alla 25 P1-filer finns nu lokalt med rätt filnamn och storlek större än noll. Själva inspelningarna har inte ändrats. Lyssningsgranskning, publicering av ljudfiler och ljudspelare återstår. Roadmapen skiljer därför på leverans och lyssningsgranskning.

Användaren har provat bokstäver direkt i ElevenLabs. Rutnamn i manus skrivs nu exempelvis `D fyra`, `F fyra` och `G fem`, utan fonetiska omskrivningar. Språkstödet för fortsatt manusarbete kräver korta meningar, en instruktion i taget och förklaringar av nya schackord för elever i årskurs 4. P2 har fått tydligare förklaringar av remi och enklare ord för datorns förslag. De uppdaterade manusen är inte kontrollerade transkriptioner av levererade MP3-filer.

### Begriplig draglista

Användaren uppmärksammade att internationell notation som `Nf6`, `Bxd2+` och `Qxc1#` var svår att förstå. Draglistan skriver nu ut exempelvis ”Springaren till F6”, ”Löparen tar på D2” och ”Damen tar på C1”, med schack och schackmatt som ord. Från- och tillruta visas under beskrivningen. Rockad visar båda pjäsernas flytt; en passant förklarar vilken bonde som tas och bondeförvandling anger den nya pjäsen. Formatteringen utgår från regelmotorns verifierade drag. Sparad PGN och export behåller standardnotation.

Hela användarens parti ingår i ett regressionstest, tillsammans med rockad för båda färgerna, en passant och samtliga fyra förvandlingsval. `npm test` passerade med 56 tester. Lint, TypeScript-/produktionsbygge, dist-kontroll och regenerering av de 58 manusen passerade. Ett nytt Playwright-flöde kontrollerar det avslutade partiets svenska draglista, bredd och genomspelning i desktop- och mobilprojekten. Dess körresultat och publiceringen kontrolleras efter push.

Commit `98ad996` publicerades framgångsrikt i [Actions-körning 39481334795](https://github.com/andreaseighty1/schacklabbet/actions/runs/39481334795). Alla byggsteg passerade, inklusive Playwright för desktop och mobil, och deploy slutfördes med success. Domänen levererade därefter den förväntade `/assets/index-Dv-jfHMn.js` med HTTP 200 och JavaScript-MIME; appfilen innehöll de svenska dragbeskrivningarna. De levererade MP3-filerna är fortfarande lokala och ljuduppspelning är ännu inte implementerad.

### Elevstyrd ljuduppspelning

De 25 levererade P1-filerna kopplas nu till välkomst- och hjälprepliker, samtliga sex övningars uppdrag/ledtråd/förklaring, verkliga felaktiga övningsförsök, schack och förhandsvarning om slaghot. Inga framtida P2-/P3-filer efterfrågas. Eleven kan slå på/av rösten och välja Lyssna, Stoppa eller Lyssna igen. Ett manuellt Lyssna slår också på rösten. Valet gäller under besöket; rösten är av efter sidöppning och omladdning och inga ljudfiler hämtas innan eleven väljer.

En gemensam ljudkanal avbryter tidigare uppspelning innan ett nytt klipp startar. Stopp och avstängning avbryter även pågående laddning. Sena play-svar och fel från tidigare klipp kan inte återstarta rösten eller ersätta aktuell status. Sidbyte, ny övning, nytt parti, genomspelning och dialogstängning tömmer gammal uppspelning. Tävlingsprofilen blockerar hjälprepliker även i spelarens centrala uppspelnings- och upprepningsfunktioner. Text, bräde och sparning fungerar vid ljudfel. Ingen ElevenLabs-nyckel eller extern rösttjänst används.

Löparens text förklarar diagonalt med ”snett”, mattuppgifterna säger ”Nu är det vits tur” och damens uppgift använder konsekvent pjäsnamnet dam. Befintliga inspelningar har inte ändrats. Manusens språkstöd gäller fortsatt arbete; pedagogisk lyssningsgranskning med elever återstår.

Lokalt passerade 64 enhetstester, lint, TypeScript-/produktionsbygge och kontroll av att alla 25 MP3-filer kopieras oförändrade till dist. Fem nya Playwright-flöden omfattar verklig uppspelning/stopp/upprepning, övningsrepliker, tävlingsprofilen, ljudfel och webbläsaravkodning av samtliga 25 MP3-filer. CI- och publiceringsresultat redovisas efter körning.

Första CI-försöket stoppades före teststart av en JSON-import som krävde importattribut i Nodes ESM-läge. E2E-filen läser nu manifestet med Nodes fil-API. `npx playwright test --list` passerade därefter med 30 tester. [Actions-körning 39483821075](https://github.com/andreaseighty1/schacklabbet/actions/runs/39483821075) från commit `61dd938` slutfördes med success: lint, 64 enhetstester, verklig motorkontroll, samtliga 30 webbläsartester för desktop/mobil, bygge, dist-kontroll och Pages-publicering. Alla 25 MP3-filer kunde avkodas av Chromium och faktisk uppspelning, stopp, upprepning och avstängning verifierades.

På den publicerade domänen öppnades tornlektionen. Lyssna ändrade röstläget till på, status blev ”Spelar: Uppdraget” och stopp/upprepning/avstängning blev tillgängliga. Avstängning tömde status och gjorde stopp/upprepning inaktiva. Röstkontrollerna granskades visuellt på desktop och vid mobilviewport 390 × 844. Mobilens sidbredd var 375 px inom 375 px innehållsbredd utan horisontell överströmning. Ingen ny övning löstes eller något pågående parti ersattes under den manuella ljudkontrollen. Detta är en teknisk uppspelningskontroll; fullständig pedagogisk lyssningsgranskning med målgruppen återstår.

### Motorkoppling, historik och startkostnad

Efter användarens önskemål om en motorgenomgång mäts och förbättras kopplingen till Stockfish 19.0.1. Den gamla kopplingen startade om motorn för varje sökning; sex lokala Node/WASM-prov gav 232–283 ms till redo och 249–299 ms till svar på nybörjarnivån.

En EngineSession återanvänder nu en färdig motor under partiet och delar den med experttips. Vid nivåbyte rensas gammal analys. Avbrott, timeout, fel, sidbyte, nytt eller avslutat parti stänger motorn helt; en nästa sökning startar med en ny instans. Både callback-skydd och kontroll mot aktuell ställning bevaras. Startställning plus samtliga UCI-drag skickas till motorn, även efter sparad PGN med FEN-start. Nybörjarval använder en komplett kandidatgrupp från samma sökdjup och tar inte med gränsbedömningar. Alla resultat kontrolleras mot lagliga drag.

Ett reproducerbart prov av samma sessionskod jämför sex nya starter med en återanvänd motor. Median för sökning 2–6 var 264 ms respektive 6,6 ms i den lokala Node-körningen. Första sökningen kräver fortsatt uppstart. Alla fem nivåer gav lagliga svar; detta är inte en elevdatormätning eller en Elo-kalibrering. Gränserna för de fem nivåerna är oförändrade. Rådata och begränsningar finns i `docs/engine/` och provet kan köras med `npm run benchmark:engine` i Node 24+.

Lokalt passerade 77 enhetstester, lint, TypeScript-/produktionsbygge och dist-kontroll. Den verkliga WASM-motorn klarade återanvändning, full historik, experttips, nivåbyte, avbrott/återstart och matt i ett på Nybörjare, Lätt och Expert genom den nya sessionskoden. Playwright hittar 34 flöden, inklusive nya kontroller av verkligt antal motorstarter, historik, nivåbyte, sidbyte och ett avsiktligt försenat motorsvar efter nytt parti. CI och publicering verifieras efter push.

Commit `c0a4c3e` publicerades framgångsrikt i [Actions-körning 39493724428](https://github.com/andreaseighty1/schacklabbet/actions/runs/39493724428). Lint, samtliga 77 enhetstester, verkliga motorprov, samtliga 34 webbläsartester för desktop/mobil, produktionsbygge, dist-kontroll och deploy passerade. Domänen levererade därefter den förväntade appfilen `/assets/index-C5BKnocw.js` med HTTP 200 och JavaScript-MIME. Appfilen innehöll den nya sessionskodens kommandon för ny motor och rensad analys. Mätning på enklare elevdatorer och pedagogisk nivåkalibrering är fortsatt öppna punkter.

### Valfri schackklocka

Klockvalen utan tid, 15 minuter var och 10 minuter var är implementerade. Utan tid är standard för första partiet. Tidsstämplar avgör förbrukningen; intervall uppdaterar bara visningen och upptäcker tidsavslut. Den aktiva klockan fortsätter under dialoger, sidbyte och omladdning. Datorns sökning fortsätter när eleven går till en annan appsida i ett parti på tid. Ångra återbetalar ingen tid. Avslut fryser klockorna och nytt parti återställer båda.

Tidsgränsen kontrolleras även innan ett drag eller motorsvar godtas. Tidsavslut avbryter motorn och ljud, stänger speldialoger och blockerar sena svar. PGN får tid och resultat; tidsvinster räknas en gång i framstegen. Äldre sparade partier öppnas utan klocka. Återläsning avgör redan passerade tidsgränser innan datorn startas. Ingen ny ljudfil eller Supabase-ändring krävs.

Remi vid tidsavslut kontrolleras utifrån båda sidors mattmaterial. Detta omfattar ensam kung, springare och löparnas rutfärger men är ingen fullständig lösare för alla fästningar eller tvingade dragföljder. Beteende, begränsningar och källa finns i docs/CLOCK.md.

Lokalt passerade 100 enhetstester, lint, TypeScript-/produktionsbygge och verkliga Stockfish/WASM-prov. Sex nya Playwright-flöden per skärmstorlek omfattar tidsval, layout, omladdning, dialoger, ett drag efter tidsgränsen före nästa tick, sena motorsvar, sidbyte, ångra, remi, framsteg och återställning. CI och publicering verifieras efter push.

De första CI-försöken stoppades av testet som håller tillbaka ett verkligt motorsvar. Vid återläsning av datorns tur startar Reacts utvecklingsläge en motor, avbryter den och startar en ny. Testet väntade felaktigt på den första instansen. Övervakningen håller nu tillbaka det första färdiga svaret oavsett instans och jämför antal avslut mot utgångsläget. GitHub-reportern gör dessutom framtida Playwright-fel läsbara som annoteringar.

Commit 5b8da22 passerade [Actions-körning 39567642476](https://github.com/andreaseighty1/schacklabbet/actions/runs/39567642476): lint, 100 enhetstester, verklig WASM-motor, samtliga 46 webbläsartester för desktop/mobil, bygge, dist-kontroll och Pages-publicering. Domänen levererade därefter den förväntade appfilen `/assets/index-XlnU6MOf.js` med HTTP 200 och JavaScript-MIME. Appfilen innehöll klockvalet, tidsresultat och PGN-tidskontroll.

I den publicerade appen startades ett kontrollparti med 10 minuter per spelare. Elevens E2–E4 fick datorns E7–E6 som svar; klockan växlade till datorn under sökningen och tillbaka till eleven efter draget. Spelrummet granskades visuellt på desktop och vid 390 × 844. Mobilens innehållsbredd och sidbredd var båda 375 px. Bilder sparades i taskens visualiseringsmapp. Ingen Supabase-konfiguration ändrades. Röstmanusets status är uppdaterad: klockan finns, men dess P3-ljud är fortfarande en senare ljudomgång.
