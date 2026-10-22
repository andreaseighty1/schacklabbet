# Privata kompispartier

Första versionen använder privat kod och två datorer/webbläsarprofiler, utan schackklocka. Skaparen väljer vit eller svart. Inga namn, lösenord eller chattmeddelanden samlas in. Ingen topplista eller klassgrupp finns ännu.

## Spel och återhämtning

Anonym inloggning sker först när eleven skapar eller går med i ett parti. Samma session sparas i webbläsaren och återanvänds. Ett aktivt parti per spelplats förhindrar övergivna parallella inbjudningar. Samma webbläsare på en delad dator är samma spelare; två flikar är inte två deltagare.

Projektets Auth → Rate Limits kontrollerades i dashboarden den 22 oktober 2026: **30 nya anonyma spelplatser per timme och IP-adress**. Inställningen ändrades inte. Flera klasser som börjar samtidigt bakom samma skolnät kan nå gränsen; befintliga sessioner räknas inte som nya registreringar. Planera ett klassrumsprov innan bred lansering och dimensionera gränsen efter antalet nya enheter.

Servern är källan till ställningen. Klienten skickar bara dragets frånruta/tillruta, eventuellt förvandlingsval, versionsnummer och ett slumpat kvitto-ID. chess.js 1.4.0 spelar upp serverns hela UCI-historik och kontrollerar färg, tur, laglighet, rockad, en passant, förvandling, schackmatt och remi. Klientens FEN, PGN, identitet och påstådda resultat accepteras inte.

SQL låser rummet och kontrollerar versionen före skrivning. Två samtidiga drag kan inte skriva över varandra. Ett upprepat kvitto ger samma senaste bekräftelse. Efter nätverksfel hämtas brädet på nytt; ett osäkert drag skickas aldrig automatiskt igen. Brädet låses vid tappad kontakt. Realtime uppdaterar deltagarna, med hämtning var 15:e sekund samt vid fokus/återanslutning som reserv för skolnätverk som blockerar WebSocket. En motståndares närvaro indikeras inte som säker bara för att kontot har anslutit; det finns ännu ingen närvaropuls.

Rörelsemarkeringar och rutnamn kan väljas. Motorhjälp, ångra, hotvarningar och talade speltips är avstängda i kompispartier. Röstkontrollerna fungerar som tidigare för övriga appen. Ett eget parti på tid måste slutföras innan ett kompisparti kan startas/spelas. Solo-PGN, analys och lokala framsteg ändras inte av kompispartier. Resultatet kan sparas som PGN.

## Åtkomst och lagring

- `public.chess_rooms`: RLS ger endast de två deltagarna SELECT på det egna, ännu giltiga partiet. Anonyma API-anrop har ingen tabellåtkomst. Inga browserroller får INSERT/UPDATE/DELETE eller exekvera skriv-RPC:n.
- `chess_private.room_codes`: 10 kryptografiskt slumpade tecken (50 bitar), endast åtkomliga för servern. Bara skaparen får tillbaka koden medan partiet väntar. Koden ligger inte i URL:er eller publik lobby. Den som får koden kan ta den lediga platsen; dela den med rätt kompis.
- `chess_private.request_limits`: per spelplats och timme, högst 10 skapaförsök, 60 anslutningsförsök och 600 bekräftade skrivförsök. Även felaktiga kodgissningar räknas. Supabase Auth begränsar därutöver nya anonyma konton per IP.
- Alla tre tabeller har RLS. Interna tabeller saknar browserpolicyer och deras schema är spärrat för `anon`/`authenticated`.
- Edge-funktionen har **Verify JWT aktiverat** och verifierar dessutom token mot projektets `/auth/v1/user`. Identiteten tas från svaret, aldrig från requestens JSON. Service-role finns bara i Supabases inbyggda servermiljö.
- Partier går ut 24 timmar efter skapandet. Därefter spärras läsning, drag och kodanslutning. Cron-jobbet `schacklabbet-expired-rooms` rensar utgångna partier inklusive koder varje timme; gränsräknare tas bort efter två dygn. Rensningen omfattar endast dessa nya speltabeller.
- Anonyma Auth-konton gallras inte av spelrummens jobb. Ingen identifierande elevinformation sparas i dem av appen. Supabase skapar och behåller tekniska konto-ID:n och driftloggar enligt projektets inställningar. En separat rutin för anonyma konton behöver beslutas om tjänsten används långsiktigt.

## Installation och uppdatering

Projektet `ixioaisppcqqutufpuct` installerades via ägarens inloggade Supabase-dashboard den 22 oktober 2026. En GitHub-integration i Supabase krävs inte för körningen. GitHub Pages bygger frontend med projektets offentliga URL och publishable-nyckel.

Källfiler:

1. `supabase/migrations/202610220001_private_chess.sql`: tabeller, rättigheter, RLS, service-RPC, Realtime-publicering.
2. `supabase/migrations/202610220002_room_retention.sql`: pg_cron och riktad gallring.
3. `supabase/functions/chess-room/`: serverns HTTP-hantering och schackkontroll. `supabase/config.toml` behåller JWT-verifiering.

`npm run prepare:multiplayer` genererar `supabase/dashboard/setup.sql` och den kompletta enkel-filsfunktionen `chess-room.ts` utan nycklar. För en ny installation: kör SQL i projektets SQL Editor, skapa Edge Function **chess-room** via editorn och ersätt `index.ts` med den genererade koden. Behåll Verify JWT på. Kör inte bootstrap-filen under `supabase/tests/` mot ett riktigt projekt. Kör inte den första skapamigrationen igen mot ett redan installerat projekt. Dashboard-installationen registrerar inte automatiskt CLI-migrationshistorik; använd `supabase migration repair` med de installerade versionsnumren före en framtida övergång till CLI-migrationer.

Framtida uppdateringar av enbart Edge-koden: ändra källorna, kör tester och `npm run prepare:multiplayer`, lägg in den genererade funktionen och publicera en ny version. Befintliga spel påverkas inte av frontendpublicering.

## Verifiering

`npm test` kör HTTP-hanteraren mot riktig PostgreSQL i PGlite med samma skapamigration. Tester omfattar obehöriga deltagare, RLS, förbjudna klientskrivningar/RPC, egen kod, båda färger, tur, olagliga drag, falska resultat, samtidiga anslutningar/drag, kvittorepetition, gammal version, full historik/remi, förvandlingsval, avslut och utgångna rum. PGlite ersätter inte prov av Supabase Auth, Edge-distribution eller nätverk.

Playwright använder två separata webbläsarkontexter med ett uttryckligt testbackend för gränssnittet. Desktop, mobil och pekdator kontrollerar kod, orientering, drag, omladdning utan extra konto, schackmatt, nätverkslåsning, förlorat dragkvitto, bekräftat ge upp, PGN-export och oförändrat soloparti/framsteg.

För ett medvetet prov av det **riktiga konfigurerade projektet**:

```sh
node scripts/check-multiplayer.mjs --live
```

Provet skapar tre anonyma testkonton och två korta testpartier; sessionsnycklar hålls i minnet och skrivs inte ut. Det provar Auth, Edge, nekad läsning för utomstående, nekade klientskrivningar/RPC, rätt tur, olagliga drag, atomisk konflikt, återupptagning, verklig Realtime, ge upp och serverbekräftad schackmatt. Det passerade mot produktionsprojektet den 22 oktober 2026. Testpartierna omfattas av den vanliga gallringen. Lärarprov med två fysiska elevdatorer, inklusive skolans nätverk och inloggningsgräns vid en hel klass samtidiga förstagångsbesök, återstår.

Officiella referenser: [anonyma konton](https://supabase.com/docs/guides/auth/auth-anonymous), [Auth-gränser](https://supabase.com/docs/guides/auth/rate-limits), [Edge-autentisering](https://supabase.com/docs/guides/functions/auth-headers), [Realtime och RLS](https://supabase.com/docs/guides/realtime/authorization), [Cron](https://supabase.com/docs/guides/cron/quickstart).
