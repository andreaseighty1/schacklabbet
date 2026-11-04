# Säkerhet

Säkerhetsuppgraderingen publicerades och verifierades 4 november 2026. Efter ägarens uttryckliga godkännande aktiverades daglig kontogallring och Cloudflare Turnstile i Supabase Auth samma dag. Den offentliga widgetnyckeln publicerades i commit `c43302d` före serveraktiveringen.

Commit `04c9c4f`: 271 enhetstester, 178 webbläsartester och samtliga byggkontroller passerade i [GitHub Actions](https://github.com/andreaseighty1/schacklabbet/actions/runs/41894866617). Npm audit rapporterade 0 sårbarheter. SQL-migrationen och Edge-koden installerades i projektet; liveprovet med Auth, RLS, nekade klientskrivningar, Realtime, drag, femminutersklocka och remi passerade. Verify JWT är på. Vid denna första verifiering gav förhandsgranskningen `eligible:0, deleted:0, dry_run:true` och inget kontoraderingsjobb var aktiverat. Produktionssidans CSP verifierades i DOM, kompislobbyn laddade utan konsolfel och inga främmande skript var laddade.

Turnstile-publiceringen `c43302d` passerade också 271 enhetstester, 178 webbläsartester och alla byggkontroller i [GitHub Actions](https://github.com/andreaseighty1/schacklabbet/actions/runs/41903568178). Produktionssidans huvudresurs `/assets/index-sKvA2cDe.js`, CSP för Cloudflares skript/iframe samt integritetsinformationen verifierades. Widgeten `Schacklabbet` har Managed-läge, enbart Schacklabbets hostname och ingen pre-clearance. Endast den offentliga sitekey finns i GitHub; den hemliga verifieringsnyckeln överfördes direkt till Supabase Auth efter ägarens särskilda godkännande.

`node scripts/check-multiplayer.mjs --check-captcha` passerade mot den aktiverade servern: registrering utan bevis ger HTTP 400 och `error_code: captcha_failed`. Skriptet accepterar Supabases båda fältnamn för felkod och avslutas normalt utan `process.exit`, som gav ett Windows/Node-fel med öppna nätverkshandtag. En befintlig profil skapade ett väntande testparti, återupptog det efter serveraktiveringen och stängde inbjudan utan att Turnstile laddades. Inbjudan stängdes i appen, inte genom databasradering. Ägaren provade också en helt ny profil i privat webbläsarfönster och bekräftade snabb automatisk kontroll följd av en inbjudningskod. Därmed är både giltigt verkligt bevis, nekad registrering utan bevis och återanvändning av sparad profil verifierade i drift.

Slutverifiering `81c6973`: **272 enhetstester och 178 webbläsartester** samt alla byggkontroller och Pages-publicering passerade i [GitHub Actions](https://github.com/andreaseighty1/schacklabbet/actions/runs/41907164980). Migration `202611040003_cleanup_auth_lock.sql` installerades separat i det befintliga projektet. Driftkontrollen bekräftade Auth-radlåsning, aktivt dagligt jobb, nekad exekvering av gallringen för browserrollen och oförändrad förhandsgranskning med noll aktuella konton. Ingen manuell kontoradering utfördes. Produktionssidan svarade HTTP 200 med förväntad huvudresurs och Turnstile-CSP.

## Befintligt skydd och nya gränser

Privata kompispartier kräver verifierad Supabase-inloggning. Servern validerar drag och bestämmer tid/resultat. RLS begränsar läsning till deltagarna. Browsern får inte skriva speltabeller eller anropa service-RPC:n. Hemliga service-nycklar ska aldrig placeras i frontend, GitHub eller VITE-variabler.

Sexteckenskoden skyddar den lediga platsen i ett visst parti. Den stoppar inte automatiserat skapande av anonyma konton. Supabase Auths gräns för nya konton gäller separat, även efter att CAPTCHA aktiveras. Klassrumsprov behövs för flera datorer på samma skol-IP.

Migration `202611040002_account_security.sql` lägger till högst 120 RPC-anrop per spelplats och minut, även läsningar och nekade åtkomstförsök. En spelaråtgärd kan använda två RPC-anrop. De tidigare timgränserna 10 skapa/60 ansluta/600 skriva kvarstår. Begränsningen gäller validerade anrop som når RPC:n, och ersätter inte plattformens nätverks- eller missbruksskydd. Edge läser högst 2048 byte av en begärans innehåll, även när Content-Length saknas.

## Turnstile – installation i rätt ordning

1. Skapa en widget i Cloudflares kostnadsfria Turnstile-plan, i Managed-läge, endast för `schacklabbet.42improbableowls.com`. Ingen DNS-flytt, pre-clearance eller betalplan behövs.
2. Lägg den offentliga sitekey i GitHub-variabeln `VITE_TURNSTILE_SITE_KEY` (eller workflowets offentliga fallback) och publicera frontend. Hemlig widgetnyckel hör endast hemma i Supabase Auths CAPTCHA-inställningar.
3. Kontrollera att widgeten fungerar från produktionsadressen. Aktivera därefter Turnstile i Supabase Auth med den hemliga nyckeln. Aktivera inte serverkravet innan frontend skickar bevis.
4. Kör `node scripts/check-multiplayer.mjs --check-captcha` för att verifiera att direkt registrering utan bevis nekas. Prova även ny spelprofil i webbläsaren och återanvändning efter omladdning. En verklig kontroll som kräver klick görs av användaren.

Kontrollen laddas först vid ny anonym spelplats för onlinespel. Sparad session återanvänds utan kontroll; inga kontroller i lektioner, datorpartier eller pågående matcher. Managed kan kräva en kryssruta, men inga bildpussel. Vid avbrott/blockerad kontroll skapas inget konto och nytt försök är möjligt. Cloudflare får tekniska uppgifter, exempelvis IP-adress; detta beskrivs i kompislobbyn när integrationen är konfigurerad.

Det gamla liveprovet `--live` skapar tre konton och kan därför inte köras utan giltiga bevis när serverns CAPTCHA är aktiverad. Stäng aldrig av skyddet för att få testet att passera. CI använder uttryckliga widget- och Auth-fixturer, och testar separat verklig PostgreSQL/RLS samt riktig Stockfish-WASM under produktions-CSP.

## Kontogallring

Migrationen registrerar senaste serverbekräftade användning av kompisfunktionen, högst en uppdatering per minut. Befintliga anonyma konton får 30 dagars frist från installationen. Förhandsgranskning i ägarens SQL Editor:

```sql
select chess_private.cleanup_inactive_players();
```

Detta raderar inget. Endast anonyma konton utan e-post/telefon som är äldre än 30 dagar, saknar inloggning och spelaktivitet under 30 dagar och saknar giltigt väntande/pågående parti kan gallras. Konton måste finnas i appens aktivitetsregister. Permanenta konton undantas. Gallringen tar samma spelar-lås som spelanropen, kontrollerar villkoren igen och raderar högst 100 konton per körning. Kontots kvarvarande kopplade speldata tas också bort via foreign keys. Lokala lektionsframsteg påverkas inte. Ett senare besök skapar ny spelprofil; ogiltig gammal session rensas lokalt utan att osäkra drag skickas igen.

Migration `202611040003_cleanup_auth_lock.sql` låser dessutom själva Auth-raden innan den sista kontrollen och upprepar villkoren direkt i DELETE. Därmed omfattas även uppdateringar av senaste inloggning eller konvertering till permanent konto som görs av Supabase Auth utan appens spelar-lås. Tester mot riktig PostgreSQL kontrollerar samtliga undantag, förhandsgranskning, begränsade behörigheter och att en batch med 102 gamla testkonton lämnar två orörda efter en körning. Ingen verklig kontoradering behövs för verifieringen.

Ingen schemalagd kontoradering ingår i migrationen. `supabase/operations/enable_account_cleanup.sql` aktiverar daglig körning först efter ägarens uttryckliga godkännande av permanent radering. Jobbet kan stoppas med `select cron.unschedule('schacklabbet-inactive-players');` men redan raderade konton återställs inte av det. Antal, inte elevuppgifter, räcker för driftuppföljning.

Drift: ägaren godkände daglig städning den 4 november 2026. Aktiveringsfilen kördes och `schacklabbet-inactive-players` verifierades med `active=true`, schema `41 2 * * *` och rätt privata gallringsfunktion. Förhandsgranskningen gav fortfarande `eligible:0, deleted:0, dry_run:true`. Ingen manuell raderingskörning gjordes. Befintliga anonyma profiler omfattas av fristen från installationen av aktivitetsregistret.

## Webbläsare och beroenden

Produktionsbygget sätter CSP före skripten. Egna skript/resurser tillåts, Supabase-nätverk begränsas till projektets HTTPS/WebSocket-adress, Turnstiles domän tillåts endast när integrationen är konfigurerad. Inbäddade skript och vanlig eval tillåts inte; WASM tillåts för schackmotorn. Inline CSS används för brädets layout. Referrer-policy begränsar referer-information till andra domäner.

GitHub Pages kan inte sätta alla egna HTTP-säkerhetsheaders. CSP via meta stöder bland annat inte `frame-ancestors`, så detta inför inte ett fullständigt skydd mot inramning. HTTPS och befintliga serverkontroller behålls.

En avgränsad npm-override ersätter typescript-estrees minimatch 10.2.6 med 11.0.1 på grund av [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). Felet gällde utvecklingsverktyg. Uppströmsberoendet låg ännu kvar på 10.x; ta bort overriden när uppströms har en säker version. Lint, typer och tester verifierar kompatibiliteten. CI kör npm audit och stoppar publicering vid varningar från moderate och uppåt.

Referenser: [Supabase CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha), [anonyma konton och gallring](https://supabase.com/docs/guides/auth/auth-anonymous), [Turnstile gratisplan](https://developers.cloudflare.com/turnstile/plans/), [widgetlägen](https://developers.cloudflare.com/turnstile/concepts/widget/), [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).
