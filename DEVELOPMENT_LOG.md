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

### Grundlektioner för alla pjäser och spelregler

Schackskolan utökas från fyra till 17 lektioner. De 13 nya omfattar bonden i fem steg (framåt, dubbelsteg, slag snett, svart riktning och förvandling), damen, kungens säkra steg, tre sätt att komma ur schack, matt, patt och en passant. De två tidigare mattutmaningarna finns kvar. En öppningsbar introduktion förklarar bräde, startuppställning, rutnamn och turordning. Katalogen är ordnad i fyra delar med delräknare och varje löst uppgift leder vidare till nästa lektion.

Övningsspelaren är en egen komponent och kan nu hantera frågor och elevstyrd bondeförvandling. Alla fyra tillåtna pjäsval godtas i förvandlingsövningen. Matt- och pattfrågorna har individuella förklaringar vid fel svar och verifierade slutställningar. Svarta bonden och slutställningarna visas från svarts sida. Ett legalt drag som inte löser det uttryckliga uppdraget ändrar inte ställningen eller framstegen. Tidigare övnings-ID:n och framsteg behålls. Rockadtexten anger även fria mellanrutor.

39 nya inspelningsmanus (uppdrag, ledtråd och förklaring för 13 lektioner) finns i ett separat SKOLA-paket. Rutnamn skrivs exempelvis D fyra. Generatorn validerar täckning mot det verkliga innehållet och skapar även sammanställt manus och filnamnslista. En ZIP med 39 rena textfiler och två översikter har kontrollerats: 41 filer, ingen tom. De nya ljuden är inte levererade och hämtas inte av appen. Befintliga 25 P1-filer används fortsatt.

Lokalt passerade 116 enhetstester, lint, TypeScript-/produktionsbygge, dist-kontroll och manusgeneratorns validering av 97 repliker och 19 övningar. Playwright hittar 62 tester för desktop/mobil, inklusive nya flöden för bondens lärväg, alla fyra förvandlingar, schackskydd, frågor om matt/patt, bevarade äldre framsteg, uteblivna saknade ljudanrop och en passant. CI och publicering verifieras efter push.

Första publiceringen från commit 75bf98f passerade samtliga kontroller i Actions-körning 39571420421, inklusive 62 webbläsartester. Vid manuell granskning på domänen syntes att katalogens scrolläge kunde följa med in i en vald lektion. Övningsvyn flyttar nu fokus till rubriken och börjar högst upp. När en bonde ska förvandlas får första pjäsvalet fokus så att alternativen kommer fram även på mobil. Webbläsartesterna kontrollerar rubrikens synlighet i viewporten och fokus på pjäsvalet.

Slutversionen b440747 publicerades med success i [Actions-körning 39572216822](https://github.com/andreaseighty1/schacklabbet/actions/runs/39572216822). Lint, 116 enhetstester, verkliga WASM-motorprov, alla 62 webbläsartester för desktop/mobil, produktionsbygge, dist-kontroll och Pages-deploy passerade. Domänen levererade därefter `/assets/index-CAnfgIBe.js` med HTTP 200 och JavaScript-MIME.

Den publicerade katalogen granskades visuellt på desktop. Vid mobilstorlek 390 × 844 öppnades förvandlingslektionen från katalogen: rubriken fick fokus och låg cirka 154 px från viewportens överkant. A7–A8 öppnade de fyra pjäsvalen och gav damknappen fokus, med alla alternativen synliga. Valet springare gav en vit springare på A8, korrekt återkoppling och markering som avklarad i katalogen. Tidigare avklarad tornlektion fanns kvar. Mobilens sidbredd och innehållsbredd var båda 375 px. Katalog och förvandlingsval sparades som bilder i visualiseringsmappen. Ingen Supabase-ändring krävdes.

### Nya lektionsljud och valfria rutnamn

Användaren levererade alla 39 SKOLA-ljud. Två extra punkter i filnamnen lesson-king-success..mp3 och lesson-pawn-double-success..mp3 rättades utan ändring av ljudinnehållet. Alla 19 övningar har nu inspelade uppdrag, ledtrådar och förklaringar via samma elevstyrda ljudspelare. Totalt 64 klipp är kopplade; P2/P3 efterfrågas fortsatt inte. Manifest, manusstatus och dist-kontroll är uppdaterade. Rösten är fortfarande av vid öppning/omladdning och kan stoppas, upprepas och stängas av.

Brädet kan visa rutnamn som D4 på alla 64 rutor med en tydlig på/av-knapp. De är på från början i lektioner och utmaningar och av från början i partier. Båda sammanhangen har egna lokalt sparade val. Etiketterna följer rutorna när brädet vänds, döljer de små kantmarkeringarna när overlayen är på och släpper igenom mus/touch/drag. Rutnamnen är dolda för skärmläsaren eftersom rutans namn redan ingår i pjäsens tillgängliga etikett. Spelets lagliga drag och tävlingsprofilens hjälpmedel påverkas inte.

Lokalt passerade 116 enhetstester, lint, produktionsbygge och dist-kontroll av samtliga 64 oförändrade ljudfiler. Playwright hittar 68 tester för desktop och mobil. Nya flöden täcker sparat rutnamnsval, separata lektions-/partival, svart perspektiv, vändning, drag med overlay samt riktig uppspelning av den nya bondlektionens tre repliker. Avkodningsprovet omfattar nu alla 64 MP3-filer. CI, publicering och visuell kontroll dokumenteras efter körning. Pedagogisk lyssningsgranskning är en separat kvarstående punkt.

Commit af051ec publicerades framgångsrikt i [Actions-körning 39606677053](https://github.com/andreaseighty1/schacklabbet/actions/runs/39606677053): lint, 116 enhetstester, verklig WASM-motor, alla 68 webbläsartester för desktop/mobil, bygge, dist-kontroll och deploy. Chromium kunde läsa samtliga 64 MP3-filer och den nya bondlektionens verkliga uppspelning, ledtråd, återkoppling och avstängning passerade. Domänen levererade rätt appfil `/assets/index-Dvavb-zx.js` med JavaScript-MIME. De två rättade ljudvägarna svarade HTTP 200.

I den publicerade bondlektionen verifierades 64 synliga rutnamn och fungerande Lyssna. Status blev Spelar: Uppdraget. Rutnamn av tog bort etiketterna och valet var fortsatt av efter omladdning; rösten var samtidigt återställd till av. Rutnamnen slogs på igen och granskades visuellt på desktop och vid 390 × 844. Mobilens sidbredd och innehållsbredd var båda 375 px. Skärmbilder sparades som schacklabbet-rutnamn.png och schacklabbet-rutnamn-mobil.png i visualiseringsmappen. Inget parti eller någon övning ersattes eller slutfördes under den manuella kontrollen. Detta var teknisk uppspelningskontroll och visuell QA, ingen fullständig pedagogisk lyssningsgranskning.

### Sammanhängande nybörjarpass och tydligare hjälprutor

Ett nybörjarpass med tre uppdrag nås från startsidan och en egen menylänk: tornets raka drag/slag, flytta kungen ur schack och matt i ett med torn. Ungefär 10 minuter är en uppskattning utan nedräkning. Befintliga ljud, ledtrådar, rutnamn och möjliga drag används; inga nya ljudfiler behövs. Efter tre verkliga lösningar visas konkret återkoppling om övningarna och en frivillig muntlig reflektionsfråga.

Passet sparas separat i schacklabbet.training.v1. Tidigare avklarade lektioner hoppar inte över uppgifter i passet. Paus, sidbyte och omladdning bevarar aktuellt steg, inklusive en redan löst ställning före Nästa. Sparat löst bräde och förklaring återställs utan automatisk uppspelning. Felaktiga försök och avbrutna pass registreras inte som avslut. Ett färdigt pass registreras en gång; nytt försök börjar tomt och behåller historiken. Upp till 20 avslut sparas, varav de fem senaste visas med datum under Mina framsteg. Pågående parti och tidigare framsteg behålls. Skadad passdata ger varning utan att hindra övrig sparning.

Övningarna förklarar nu att punkter visar möjliga drag och ringar möjliga slag. Ringmarkeringen räknas från regelmotorns dragtyp, så även en passant på tom målruta visas som slag. Sidomenyn kan rullas på låga skärmar efter att passlänken lagts till. Framstegssidans tidigare hårdkodade fyra lektioner är rättad till katalogens verkliga antal, 17.

Lokalt passerade 122 enhetstester, lint, TypeScript-/produktionsbygge och dist-kontroll av motor/licenser/64 ljudfiler. Playwright hittar 74 tester: nya flöden för hela passet med hjälprutor och ledtråd, paus/omladdning före och efter Nästa, engångsregistrering, ny omgång, historik, skadad sparning samt bevarade tidigare framsteg och parti. En passant-flödet verifierar också slagringen. CI och publicering dokumenteras efter push. Pedagogiskt elevtest återstår.

Commit 3a6ae6d publicerades med success i [Actions-körning 39619334423](https://github.com/andreaseighty1/schacklabbet/actions/runs/39619334423). Lint, 122 enhetstester, verkliga WASM-motorprov, alla 74 webbläsartester för desktop/mobil, produktionsbygge, dist-kontroll och Pages-deploy passerade. Domänen levererade därefter rätt appfil `/assets/index-_r38J9Af.js` med JavaScript-MIME och passets start-/återupptagningstexter. Pages-deploy tog längre tid än byggstegen; den tidigare versionen låg kvar tills publiceringen slutförts.

På den publicerade sidan startades ett nytt pass. Val av tornet på A1 visade lagliga hjälppunkter och slagring på bonden på A7. Tornuppgiften löstes, pausknappen användes och sidan laddades om. Fortsätt återställde den redan lösta ställningen och Nästa gick till den olösta kunguppgiften. De två återstående uppdragen slutfördes vid mobilstorlek 390 × 844 och återkopplingen visade tre genomförda övningar. Sid- och innehållsbredd var båda 375 px. Under Mina framsteg syntes ett avslutat nybörjarpass och korrekt lektionsnämnare, 17. Inget vanligt parti startades eller ersattes i den manuella kontrollen. Skärmbilder sparades som nyborjarpass-hjalprutor.png och nyborjarpass-klart-mobil.png i visualiseringsmappen.

### Kort efteranalys och elevdatorer med pekskärm

Efter avslutat parti kan eleven manuellt starta Upptäck ett drag. En separat Stockfish-session granskar högst de senaste åtta egna dragen med full historik, upprepningsregler och lagligt verifierad PV. Vid tillräckligt sökdjup visas högst ett positivt exempel och ett förbättringstips. Poäng byter perspektiv korrekt mellan spelaren och motståndaren; matt och redan kraftigt avgjorda ställningar jämförs inte som vanliga cp-förluster. Trösklar, sökbudget och begränsningar finns i docs/POST_GAME_REVIEW.md. Ingen exakthetsprocent eller bevisad materialförlust påstås.

Förslaget kan provas på ett separat bräde med rutnamn, hjälppunkter/slagringar och fullt förvandlingsval. Andra lagliga drag får neutral återkoppling, eftersom uppgiften är att prova ett granskat förslag. PGN, resultat, klocka och framsteg behålls. Stopp, sidbyte och nytt parti avbryter analysen; färdigt arbete släpper sin Worker. Genomgången visas inte under pågående tävlingsparti. Textinstruktioner används utan nya ljudfiler.

Användaren upplyste att elevernas datorer har pekskärm. Tryck på pjäs och sedan målruta fungerar i hela appen utan hover/dragkrav. Instruktionerna förklarar detta, rutorna använder touch-action manipulation och vanliga kontroller får minst 44 × 44 px på enheter med grov primär pekare. En separat Playwright-profil provar pekskärm vid 1366 × 768, inklusive riktiga tap-händelser i lektion, spel och analysövning. Mobilens analysprov använder också tap. Fysisk provning på skolans enheter återstår.

Lokalt passerade 131 enhetstester, lint, TypeScript-/produktionsbygge, dist-kontroll och verkliga Stockfish WASM-prov inklusive verifierad analysvariant och upptäckt damförlust. Playwright hittar 90 tester för desktop, mobil och pekskärm. Nya flöden täcker manuell analys, oförändrat sparat parti/framsteg, neutral återkoppling, hjälprutor, förvandlingsval, avbrott/sena svar och spärr under pågående tävling. CI och publicering dokumenteras efter push.

Runtimeversion d817f7e publicerades med success i [Actions-körning 39624555783](https://github.com/andreaseighty1/schacklabbet/actions/runs/39624555783): lint, 131 enhetstester, verkliga Stockfish WASM-prov, alla 90 webbläsartester för desktop/mobil/pekdator, produktionsbygge, dist-kontroll och Pages-deploy passerade. Slutjusteringen använder any-pointer: coarse så att större knappar även gäller hybriddatorer som har både styrplatta/mus och pekskärm.

Domänen levererade därefter /assets/index-BgS2z2Qb.js med korrekt JavaScript-MIME och de nya analys-/tryckinstruktionerna. Den manuella kontrollen använde det redan avslutade lokala testpartiet (E4, E6, tidsförlust). Genomgången startades via knapp och granskade det enda egna draget; E4 visades som positivt exempel utan att hitta på ett förbättringstips. Inget nytt parti startades och ingen gammal PGN ersattes. Analysresultatet granskades visuellt på desktop och i 390 × 844; mobilens sid- och innehållsbredd var båda 375 px. Bilder sparades som schacklabbet-efteranalys.png och schacklabbet-efteranalys-mobil.png i visualiseringsmappen. Fullt prova-förslaget-flöde med hjälprutor, neutral återkoppling, omtag, förvandling och oförändrad lokal sparning passerade i CI på alla tre profiler. Fysisk pekskärmsprovning på skolans datorer och pedagogiskt elevtest återstår.

### Skaparnamn och klassiskt trätema

Andreas Jonsson anges som skapare i en sidfot på varje sida. Där finns också Bräde och pjäser med två val: Klassiskt trä med varmvita/bruna pjäser som standard och det befintliga gröna temat med ljusa/mörkgröna pjäser. Valet sparas separat i schacklabbet.chess-theme.v1 och gäller gemensamt för spel, lektioner, nybörjarpass, analys och pjäsförhandsvisningar. Blockerad eller okänd lokal sparning återgår till klassiskt tema. Regelmotorns färger vit/svart behålls och hjälpen förklarar att svarts pjäser är bruna i trätemat.

SVG-siluetterna behålls med temaärvda färger, tydliga konturer och varma brädrutor/ram. Inga nya bildfiler eller ljud behövs. Färgvalet ändrar inte ställning, valt drag, regler, sparad PGN eller framsteg. Färgvalet fungerar även med tangentbord och har minst 44 px höjd.

Lint, TypeScript-/produktionsbygge och dist-kontroll passerade lokalt. Playwright hittar 93 tester; ett nytt flöde körs på desktop, mobil och pekdator och verifierar namn, verkliga ritfärger, temabyte med bibehållen pjäsmarkering, omladdning, gemensamt tema i lektion samt oförändrad sparad match/framsteg. CI och visuell kontroll på domänen dokumenteras efter publicering.

Version a7c2d81 publicerades med success i [Actions-körning 39626700936](https://github.com/andreaseighty1/schacklabbet/actions/runs/39626700936). Samtliga 131 enhetstester, 93 webbläsartester, verkliga WASM-motorprov, lint, bygge, dist-kontroll och Pages-deploy passerade. Domänen levererade därefter /assets/index-BpVRrFVL.js med JavaScript-MIME samt skaparnamnet och färgvalet.

På den publicerade sidan granskades träbräde och samtliga pjäsformer visuellt, följt av byte till grönt och tillbaka till klassiskt. Sidfoten visade Skapat av Andreas Jonsson och båda valen. Klassisk inställning fanns kvar efter omladdning i 390 × 844; sid- och innehållsbredd var båda 375 px. Inget parti startades, ingen pjäs flyttades och inga övningar slutfördes i den manuella kontrollen. Bilder sparades som schacklabbet-klassiskt-tra.png, schacklabbet-gront-val.png, schacklabbet-skaparnamn.png och schacklabbet-tra-skapare-mobil.png i visualiseringsmappen. Det klassiska temat återställdes efter kontrollen.

### Inställningssida och träningstips från partiet

Färgvalet har flyttats från sidfoten till Inställningar i huvudmenyn, med egen hash-route, fokuserad rubrik och direkt förhandsvisning. Sidan samlar också rutnamnsval för partier/lektioner samt röst på/av. Befintliga sparnycklar används, och rösten börjar fortsatt av vid omladdning. Partiernas rutnamnsval ändras i samma App-state som spelbrädet; lektioner och analysövning läser sitt gemensamma val när de öppnas. Andreas Jonssons skaparnamn behålls i sidfoten.

Efteranalysens förbättringsexempel kan nu ge ett konkret repetitionsförslag med skäl och länk till en befintlig lektion. Urvalet använder bara verifierade drag/ställningar: förvandling, föreslagen rockad, flytta kungen/ta schackaren/blockera, möjlig motståndarcapture eller motorförslagets pjäs. Om en kung tar en annan pjäs när den flyttar ur schack kallas det inte att ta schackaren. En passant beskrivs med bondens verkliga slagruta. Utan förbättringsexempel ges inget personligt tips; ingen färdighetsdiagnos eller historisk elevprofil byggs.

Eleven får samma sammanhang i lektionen och kan gå tillbaka till den färdiga analysen utan ny sökning. Analysresultatet hålls per parti-ID under besöket och följer med vid sidbyte; omladdning kräver ny analys. Pågående arbete avbryts vid sidbyte som tidigare. Den rekommenderade lektionen kräver en riktig lösning och kan repeteras utan dubbla framstegspoäng. PGN, klocka och resultat förändras inte. Befintliga lektionsljud återanvänds, nya inspelningar behövs inte.

136 enhetstester passerade lokalt, inklusive specifika gränsfall för rekommendationerna. Lint, TypeScript-/produktionsbygge och dist-kontroll passerade. Playwright hittar 96 tester: inställningsnavigation, förhandsvisning, sparat färgval, separata rutnamn, röst som återställs till av och full kedja från analys till genomförd/repetitionsbar lektion och tillbaka. Desktop, mobil och pekdator ingår. Slutlig CI/publicering och visuell kontroll dokumenteras efter push.
