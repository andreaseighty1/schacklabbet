# Plan: Dagens utmaning

Research och ursprungligt förslag, 9 november 2026. Version 1 är nu implementerad enligt [leveransbeskrivningen](DAILY_CHALLENGE.md). Texten nedan bevarar research och ursprungliga genomförandeförslag; dess dåtida statusbeskrivningar är inte den aktuella leveransstatusen.

## Rekommenderat upplägg

Ett kort högst upp under **Utmaningar**, före de befintliga uppgifterna. Samma grundproblem för alla den svenska kalenderdagen gör det möjligt att diskutera lösningen i klassrummet. Huvuduppgiften ska normalt ta 2–5 minuter. På utvalda dagar finns en frivillig **Lite klurigare** fortsättning från samma parti.

Kortet visar datum, tema, ungefärlig nivå och status: inte provad, påbörjad eller klar. En inledning kan vara: ”Kan du hjälpa tornet att sätta schackmatt?” Före start ska eleven veta vilken färg som spelar och vad uppgiften går ut på. Använd vanliga svenska ord och tydliga koordinater; eventuell ny uppläsning får eget manus senare. Textversionen ska fungera fullt ut utan nya ljudfiler.

Efter lösningen visas en kort förklaring, ”Ta med dig”-budskap och vid mästarpartier en liten faktaruta med spelare, plats och år. Där kan eleven spela igenom några relevanta drag. Presentera partiets historia utan att avslöja lösningen före försöket.

Ingen spelarklocka och ingen topplista för snabbast lösning. Ledtrådar och upprepade försök ska vara tillåtna. Skilj mellan att lösa själv, lösa med ledtråd och att ha tittat på lösningen, utan att framställa hjälp som ett misslyckande. Ingen obruten svit som förloras när eleven missar en helg eller skoldag.

## Källor och researchbeslut

| Källa                                                                                                                                                              | Verifierat                                                                                                                            | Användning i förslaget                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [Lichess problemexport](https://database.lichess.org/#puzzles)                                                                                                     | Problemexport med CC0; FEN, UCI-drag, rating, teman och partilänk. Första draget ska appliceras före elevens startställning.          | Primär källa för utvalda vardagsproblem.                                                                                  |
| [Lichess broadcasts](https://database.lichess.org/#broadcasts)                                                                                                     | Turneringsexporten anges separat som CC BY-SA 4.0.                                                                                    | Möjlig senare mästarkälla med dess egna licensvillkor och attribution.                                                    |
| [Lichess API: dagens problem](https://raw.githubusercontent.com/lichess-org/api/master/doc/specs/tags/puzzles/api-puzzle-daily.yaml)                               | JSON-endpointen finns och kräver ingen autentisering.                                                                                 | Möjlig referens/prototyp, men inte rekommenderat elevflöde för version 1.                                                 |
| [PGN Mentor](https://www.pgnmentor.com/files.html)                                                                                                                 | Erbjuder fria PGN-nedladdningar efter spelare och evenemang. Sidan som granskats ger ingen uttrycklig CC0-licens för återpublicering. | Referens och korskontroll; inte ett automatiskt klartecken för massimport.                                                |
| [FIDE Historical Committee](https://his.fide.com/2026/07/08/milestones-of-1851-1860-the-first-international-tournament-and-the-meteoric-emergence-of-paul-morphy/) | Beskriver Morphys operaparti mot hertigen och greven i Paris 1858.                                                                    | Historiska fakta för ett möjligt första mästarexempel, med egen svensk text.                                              |
| [Operapartiets spelprotokoll](https://lichess.org/study/embed/aVdQHxwx/jHDna5ZE)                                                                                   | Visar den spelade avslutningen med damoffret och tornmatten.                                                                          | Korsreferens för ställning och drag. Ingen generell CC0-licens antas för användarskapade studier eller deras kommentarer. |

Problemexport och turneringsexport har alltså olika angivna licenser. Varje importerad post ska få dokumenterad källa och rättighetsstatus. Kopiera inga färdiga förklaringar, foton eller annoteringar från andra sajter. Skriv svenska ledtrådar och förklaringar själva och använd projektets befintliga grafik.

Lichess problemrating kan hjälpa redaktionen att hitta kandidater. Den ska inte presenteras som elevens Elo eller användas som enda bedömning av barnens svårighetsnivå. Ett historiskt parti ska också kontrolleras för korrekt spelare, år och ställning. Osäkra detaljer utelämnas.

## Innehåll och redaktionellt arbetsflöde

Börja med en granskad bank som täcker **30 kalenderdagar**, med ett grundproblem per dag och cirka 10 frivilliga fördjupningar. Välj några välkontrollerade mästarexempel; övriga kan komma från vanliga partier. Alla problem behöver inte vara från kända spelare.

1. Hitta kandidater med korta lösningar och ett tydligt tema: matt i ett drag, gaffel, obevakad pjäs eller samarbete mellan pjäser. Högre problemlängd läggs i fördjupningen.
2. Importera ett begränsat urval i ett redaktionsskript. Hämta aldrig hela databasen i elevens webbläsare. Spara ursprungs-id, URL, licens och importversion.
3. Normalisera varje källa till Schacklabbets start-FEN och lösningsträd. För Lichess-exporten måste motståndarens första UCI-drag tas med vid denna omvandling; det är inte elevens första svar. [Formatbeskrivning](https://database.lichess.org/#puzzles).
4. Verifiera drag och mål maskinellt. Skriv sedan svensk instruktion, stegvisa ledtrådar och förklaring. Låt någon läsa det med en fjärdeklassares förkunskaper i åtanke.
5. Kontrollera alternativa bra lösningar. Om en uppgift säger ”matt i ett drag” ska alla lagliga mattdrag godtas. Vid materialvinst behövs ett tydligt mål och analyserade svar, så att ett likvärdigt drag inte felmarkeras.
6. Granska och godkänn innehållet innan det läggs i kalendern. Automatisk import får skapa kandidater, inte automatiskt publicera elevuppgifter.

Ett mästarproblem märks **Från partiet** om ställningen är identisk med originalet. Ändras ställningen för att göra den enklare ska det stå **Inspirerat av partiet**. En motorföreslagen fortsättning får inte beskrivas som om den faktiskt spelades.

## Ett konkret mästarexempel: operapartiet

En egen svensk presentation kan vara: ”År 1858 spelade Paul Morphy ett berömt parti i Paris. Här kan du prova hur tornet och löparen samarbetar.” Historiken stöds av [FIDE](https://his.fide.com/2026/07/08/milestones-of-1851-1860-the-first-international-tournament-and-the-meteoric-emergence-of-paul-morphy/); avslutningen finns i [spelprotokollet](https://lichess.org/study/embed/aVdQHxwx/jHDna5ZE).

| Variant        | Startställning             | Uppdrag och verifierad följd                                                   |
| -------------- | -------------------------- | ------------------------------------------------------------------------------ |
| Grund          | Efter svarts sextonde drag | Hitta matt i ett drag: torn D1 → D8.                                           |
| Lite klurigare | Före vits sextonde drag    | Hitta matt i två egna drag: dam B3 → B8, springare D7 tar på B8, torn D1 → D8. |

FEN för grunduppgiften:

```text
1n2kb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2KR4 w k - 0 17
```

FEN för fördjupningen:

```text
4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 16
```

Lokalt verifierat med projektets chess.js: hela vägen till ställningarna kan spelas lagligt; efter `Qb8+` är `Nxb8` enda lagliga svaret; i grundställningen är `Rd8#` det enda mattdraget. Detta verifierar exempelställningarna, inte en färdig importerad produktpost. Ursprung och distributionsunderlag ska dokumenteras före publicering. Inget av exemplen har lagts in i appen ännu.

## Teknisk lösning i befintliga projektet

Version 1 kan levereras statiskt med GitHub Pages, utan ny Supabase-funktion, inloggning eller extern anslutning under lösningen. Lägg bara det granskade urvalet i publiceringspaketet. Ingen iframe behövs och befintlig CSP behöver inte öppnas för en ny leverantör. Återöppning helt utan nät kräver fungerande cache/PWA och ingår inte som nytt löfte i första versionen.

Föreslagna delar:

- `src/daily/catalog.v1.json`: godkända problem, svårighetsbeskrivning, mål, start-FEN, sida, ledtrådar, förklaringar, lösningsträd och källmetadata.
- `src/daily/calendar.v1.json`: uttrycklig koppling datum → grundproblem och eventuell fördjupning. Samma publicerade datum ska fortsätta peka på samma problem även om banken senare utökas.
- `src/daily/session.ts`: separat problemläge som hanterar lösningsträd och alternativa svar. Nuvarande `ExercisePlayer` har fasta steg och ett författat motståndarsvar per steg; det räcker inte generellt för flera svargrenar. Behåll befintliga lektioners beteende.
- `DailyChallengeCard` överst i Utmaningar och en `DailyChallengePlayer` som återanvänder `Board`, pjäsval, glidningar, rutnamn, pekstöd och mönstret för ledtråd/motståndarsvar.
- `src/daily/storage.ts`: separat lokal lagring, exempelvis `schacklabbet.daily.v1`. Nyckla på datum, problem-id och innehållsversion. Spara påbörjat läge, försök, ledtrådsnivå, visad lösning och klarstatus utan att skriva om lektionsframsteg eller matchstatistik.

Beräkna datum med `Europe/Stockholm`, inte elevdatorns godtyckliga tidszon eller UTC-dygnets längd. Byt dagens kort vid svensk midnatt och kontrollera igen när fliken återfår fokus. En påbörjad uppgift behåller sitt problem tills eleven lämnar den. Testa sommartidsbyten; dygnet är inte alltid 24 timmar. Eftersom upplägget saknar tävlingspoäng behöver klientens kalender inte vara en säkerhetsgräns.

Visa en **Träningsfavorit** om kalendern saknar ett godkänt problem, i stället för att krascha eller utge en gammal uppgift för att vara ny. Ett litet arkiv kan komma senare. Hämta inte slumpmässigt från ett externt API som reserv under lektionen.

Motståndarens drag visas på begäran med ”Visa motståndarens svar”, som i befintliga stegövningar. Spelaren ska få se varför draget fungerar. Felaktiga eller orelaterade drag ändrar inte ställning eller klarstatus. Ett korrekt alternativ leder till sin egen verifierade gren. För version 1 väljs framför allt problem med korta, fullständigt granskade grenar.

Källfakta lagras med bland annat `sourceUrl`, `sourceId`, `license`, `credit`, `players`, `year`, `sourcePly` och `continuationKind` (`played`/`analysis`). För vanliga nätpartier räcker en neutral beskrivning i elevvyn; inga spelarnamn behöver kopieras in. Källänk kan ligga i en separat faktaruta efter uppgiften och laddas inte automatiskt.

## Kvalitetskrav före första publicering

- Alla FEN- och UCI-drag är lagliga, spelarsida och dragnummer stämmer och rätt startposition har härletts från källan.
- Varje accepterad gren når det utlovade målet. Vid forcerad matt kontrolleras motståndarens lagliga försvar, inte bara en enskild motorlinje. Stockfish kan hjälpa granskningen; exakta mattmål kontrolleras även med chess.js. Osäkra uppgifter publiceras inte.
- Alla avsedda likvärdiga lösningar accepteras. Författade motståndarsvar ska motsvara vald gren.
- Grundläggande språk, källfakta och rättighetsstatus är redaktionellt granskade. Datum och problem-id är unika.
- Samma dag ger samma problem på olika enheter. Omladdning, midnatt, sommartid, saknat datum och skadat lokalt sparande har förutsägbara resultat.
- Pekskärm, litet laptopfönster och mobil fungerar; mobil har inget vyval. Hjälpval och minskad rörelse följer befintliga inställningar.
- Påbörjat och löst sparas utan att dubbleras. Visad lösning skiljs från självständig lösning. Vanliga lektioner, datorpartier och kompispartier påverkas inte.

## Byggordning

1. Bygg kort, kalender och problemläge med tre interna provuppgifter. Testa även alternativa lösningar och återupptagning.
2. Färdigställ och granska 30 grundproblem och cirka 10 fördjupningar, inklusive några mästarställningar med klar källstatus.
3. Prova med några elever, bedöm språk/svårighet och publicera första innehållsbanken.
4. Utöka med arkiv, fler mästarpartier och eventuell textlokalisering. Gemensam klassuppföljning eller topplista är ett separat framtida beslut; lokal klarstatus är inte ett manipulationsskyddat tävlingsresultat.

Inga nya betaltjänster eller konton föreslås för version 1. Ingen automatisk import, schemalagd publicering eller ny databas har aktiverats i planeringsarbetet.
