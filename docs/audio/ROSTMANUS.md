# Schacklabbet – röstmanus för ElevenLabs

Det här är ett inspelningsunderlag. Ljuduppspelning är ännu inte inkopplad i appen och inga ljudfiler har genererats.

## Börja här

Gör först ett röstprov med `start-welcome.mp3`, `lesson-knight-intro.mp3` och `game-player-check.mp3`. När röst och uttal känns rätt, fortsätt med P1. P2 kan göras därefter. Vänta med P3: funktionerna för klocka och multiplayer är ännu inte implementerade.

Varje textfil i `elevenlabs-input/` innehåller endast orden som ska sägas. Ladda upp eller klistra in innehållet i ElevenLabs och spara ljudet med samma basnamn, men ändelsen `.mp3`. Exempel: `lesson-rook-intro.txt` → `lesson-rook-intro.mp3`.

## Röstregi

- Svenska, varm och lugn vuxen röst. Tala tydligt till elever omkring nio till tolv år, utan att låta barnslig.
- Naturligt och uppmuntrande, med korta pauser mellan tankarna. Varningar ska låta eftertänksamma, inte alarmerande.
- Samma röst och ungefär samma ljudnivå i alla filer. Ingen musik, ljudeffekter, extra hälsningsfras eller påhittad avslutning.
- Leverera MP3, en replik per fil. Inga inledande eller avslutande långa tystnader och inga avklippta ord.
- Läs endast själva manustexten. Läs inte upp filnamn, prioritet, användning eller inspelningsnoteringar.

## Uttal

Rutnamn är utskrivna för uppläsning: `a ett`, `be två`, `se tre`, `de fyra`, `e fem`, `eff sex`, `ge sju`, `hå åtta`. Säg bokstaven och siffran tydligt, med en liten paus. Exempel: `ge sju` betyder rutan `g7`, inte ordet ”gesju”.

Använd ”dam”, ”springare”, ”löpare”, ”torn”, ”bonde” och ”kung” konsekvent. ”Remi” betyder oavgjort. ”Patt” är en särskild remiorsak. Kontrollera uttalet av ”Schacklabbet”, ”rockad” och ”remi” i röstproven.

## Eleven styr rösten

- Rösten är av vid första besöket. Inget ljud startar automatiskt när sidan öppnas.
- En tydlig kontroll växlar mellan **Röst av** och **Röst på**. Att stänga av stoppar pågående uppläsning direkt och tar bort väntande repliker.
- Lektioner har **Lyssna**, **Stoppa** och **Lyssna igen**. Ett stopp ändrar inte spelläget och ”Lyssna igen” börjar från början.
- Röstvalet kan sparas lokalt på samma sätt som andra inställningar. Ett sparat på-läge får inte tvinga fram ljud vid omladdning; eleven ska kunna välja när uppspelning börjar.
- Spela högst ett klipp åt gången. Ett nytt manuellt klipp ersätter det föregående. Sidbyte, nytt parti och avstängning avbryter tidigare ljud.
- Läs inte upp något vid varje klick på en pjäs eller varje omrendering. Turmeddelanden och belöningar får inte upprepas. Slutresultat har företräde framför ”din tur” och ”schack”.
- Tävlingsprofilen får inga talade tips eller hotvarningar. Röst får inte bli en väg runt avstängda hjälpmedel.
- Röst är en egen inställning, separat från eventuella framtida dragljud. All viktig information finns också i text.

## Fasta repliker och varierande information

Vi spelar in hela, naturliga repliker. Vi spelar inte in alla tänkbara kombinationer av pjäs, färg och ruta. Vid ett konkret slaghot läser första versionen därför den generella varningen och visar exakt angripare och rutor i text och på brädet. Samma sak gäller motorförslag, spelkoder och positionsbundna ledtrådar.

## Leverans

Lägg färdiga ljudfiler i `public/audio/sv-SE/`, eller skicka dem samlade i en ZIP med oförändrade filnamn. P1 räcker för första omgången. MP3-filerna ska ligga direkt i mappen, utan ytterligare undermappar.

Inga ElevenLabs-nycklar eller elevuppgifter behövs i frontend. Inspelade filer kommer att hämtas från samma webbplats som spelet.

## P1 – första inspelningsomgången (25 filer)

### start-welcome.mp3

**Användning:** Frivillig välkomstuppläsning.

Välkommen till Schacklabbet! Här får du spela, prova idéer och lära dig schack i din egen takt. Nästa drag är ditt.

### help-move-piece.mp3

**Användning:** Hjälp med att flytta en pjäs.

Klicka på en av dina pjäser och sedan på rutan du vill flytta till. Du kan också dra pjäsen dit. När draghjälpen är på visar punkterna vilka drag som är möjliga.

### help-audio-controls.mp3

**Användning:** Frivillig förklaring av röstkontrollerna.

Du väljer själv när du vill lyssna. Tryck på stopp om du vill avbryta. Med lyssna igen hör du förklaringen från början. Du kan stänga av rösten när du vill.

### exercise-try-again.mp3

**Användning:** Ett lagligt drag löser inte övningen.

Det är ett möjligt drag, men det löser inte just den här uppgiften. Ta en titt till och prova en annan idé.

### exercise-move-not-allowed.mp3

**Användning:** Ett försök till drag har avvisats av regelmotorn.

Den pjäsen kan inte flytta dit just nu. Välj en annan ruta.

**Notering – läses inte upp:** Spela bara efter ett faktiskt avvisat drag. Ett klick på en tom ruta är inte i sig ett feldrag.

### lesson-rook-intro.mp3

**Användning:** Lyssna på tornlektionen.

Tornet går rakt, längs rader och linjer. Det kan gå flera rutor i samma drag om vägen är fri. Flytta tornet från a ett till a sju och ta den svarta bonden.

### lesson-rook-hint.mp3

**Användning:** Lyssna på tornlektionens ledtråd.

Tornet kan gå många rutor uppåt om vägen är fri. Följ linjen från a ett till a sju.

### lesson-rook-success.mp3

**Användning:** Tornlektionen löst.

Precis! Tornet gick rakt upp till a sju och tog bonden. Tornet kan slå en motståndarpjäs på rutan där det landar.

### lesson-bishop-intro.mp3

**Användning:** Lyssna på löparlektionen.

Löparen rör sig diagonalt och stannar alltid på samma färg. Den kan gå flera rutor om vägen är fri. Ta bonden på ge fem med löparen.

### lesson-bishop-hint.mp3

**Användning:** Lyssna på löparlektionens ledtråd.

Följ diagonalen från de två. Först e tre, sedan eff fyra och till sist ge fem.

### lesson-bishop-success.mp3

**Användning:** Löparlektionen löst.

Snyggt! Löparen följde diagonalen hela vägen till ge fem och tog bonden. Den stannade på samma färg hela vägen.

### lesson-knight-intro.mp3

**Användning:** Lyssna på springarlektionen.

Springaren går två rutor åt ett håll och en ruta åt sidan, som bokstaven L. Den kan hoppa över andra pjäser. Ta bonden på eff fem med springaren.

### lesson-knight-hint.mp3

**Användning:** Lyssna på springarlektionens ledtråd.

Börja på de fyra. Tänk två rutor åt höger och en ruta upp. Var hamnar springaren då?

### lesson-knight-success.mp3

**Användning:** Springarlektionen löst.

Rätt! Springaren hoppade i ett L från de fyra till eff fem och tog bonden.

### lesson-castle-intro.mp3

**Användning:** Lyssna på rockadlektionen.

Rockad är ett specialdrag med kungen och ett torn. Ingen av dem får ha flyttat tidigare, och rutorna mellan dem måste vara tomma. Kungen får inte stå i schack, eller passera eller landa på en ruta som motståndaren angriper. Gör kort rockad genom att flytta kungen från e ett till ge ett.

### lesson-castle-hint.mp3

**Användning:** Lyssna på rockadlektionens ledtråd.

Flytta kungen två rutor åt höger, mot tornet. Tornet följer automatiskt med.

### lesson-castle-success.mp3

**Användning:** Rockadlektionen löst.

Du gjorde rockad! Kungen står nu på ge ett och tornet har flyttat till eff ett. Två pjäser flyttades i samma drag.

### challenge-rook-mate-intro.mp3

**Användning:** Lyssna på mattproblemet med torn.

Svarts kung står vid kanten. Vit är på drag. Hitta ett torndrag som ger schackmatt direkt. Titta efter vilka rutor den svarta kungen kan fly till.

### challenge-rook-mate-hint.mp3

**Användning:** Lyssna på mattproblemets ledtråd.

Din kung täcker ge åtta och ge sju. Kan tornet ge schack längs hå-linjen?

### challenge-rook-mate-success.mp3

**Användning:** Mattproblemet med torn löst.

Schackmatt! Tornet täcker hå-linjen och din kung stänger flyktvägarna. Pjäserna samarbetar.

### challenge-queen-mate-intro.mp3

**Användning:** Lyssna på mattproblemet med dam.

Damen och kungen kan samarbeta. Vit är på drag. Hitta ett drag med damen som sätter svart schackmatt.

### challenge-queen-mate-hint.mp3

**Användning:** Lyssna på mattproblemets ledtråd.

Kan du ge schack med damen på en ruta som din egen kung försvarar? Kontrollera också motståndarens flyktvägar.

### challenge-queen-mate-success.mp3

**Användning:** Mattproblemet med dam löst.

Schackmatt! Damen på ge sju täcker flyktvägarna och är försvarad av kungen på eff sex.

### game-player-check.mp3

**Användning:** Spelarens kung står i schack, men partiet är inte matt.

Din kung står i schack. Du måste skydda den. Kan du flytta kungen, slå pjäsen som ger schack, eller ställa en pjäs emellan?

**Notering – läses inte upp:** De tre alternativen är saker att undersöka, inte löften om att alla är lagliga i ställningen. Spela inte denna efter schackmatt.

### game-move-risk.mp3

**Användning:** Förhandsvarning efter ett verkligt lagligt slaghot i nybörjarprofilen.

Stanna upp och ta en titt. Din pjäs kan bli tagen om du gör det draget. Det betyder inte alltid att draget är dåligt. Du kan undersöka hotet, välja ett annat drag eller göra draget ändå.

**Notering – läses inte upp:** Pjäs, angripare och rutor visas i text och på brädet. Den här fasta repliken läser inte upp variabla rutnamn.

## P2 – fler spelhändelser och belöningar (23 filer)

### game-turn-player.mp3

**Användning:** Tur övergår till eleven.

Din tur. Ta en titt på motståndarens senaste drag innan du väljer ditt eget.

**Notering – läses inte upp:** Spela högst en gång per tur. Inte efter varje rendering eller pjäsval.

### game-turn-computer.mp3

**Användning:** Tur övergår till datorn.

Nu är det datorns tur att tänka.

### game-opponent-check.mp3

**Användning:** Elevens drag ger schack, men inte matt.

Schack! Nu måste motståndaren skydda sin kung.

### game-promotion.mp3

**Användning:** Dialog för bondeförvandling.

Din bonde har nått sista raden. Nu får du välja en ny pjäs. Vill du ha en dam, ett torn, en löpare eller en springare?

### game-undo.mp3

**Användning:** Ångra har genomförts i tillåten profil.

Prova en annan idé. Det är så man lär sig.

### game-hint-general.mp3

**Användning:** Första ledtråden på begäran.

Börja med att leta efter schackar, möjliga slag och hot. Vad har motståndaren just ändrat?

### game-hint-safety.mp3

**Användning:** Allmän inledning till en konkret ledtråd på skärmen.

Undersök vilka av dina pjäser som är angripna. Kan du göra en pjäs säkrare, eller få fler av dina pjäser att samarbeta?

**Notering – läses inte upp:** Ersätter inte den positionsbundna texten. Använd inte som exakt uppläsning av en specifik pjäs och ruta.

### game-hint-engine.mp3

**Användning:** Ett motorförslag har faktiskt laddats på begäran.

Här är motorns förslag. Titta på det markerade draget och fundera på vilka möjligheter det skapar. Du bestämmer själv vilket drag du vill göra.

**Notering – läses inte upp:** Spela först när ett giltigt förslag finns. Påstå inte att förslaget är det säkert bästa draget.

### game-risk-explainer.mp3

**Användning:** Eleven väljer att visa ett slaghot.

En angripen pjäs är inte automatiskt förlorad. Den kan vara försvarad, eller du kan ha en annan plan. Tänk igenom vad som händer om motståndaren tar den.

### game-result-win.mp3

**Användning:** Verifierad vinst för eleven.

Du vann partiet. Bra tänkt! Spela gärna igenom dragen och upptäck vad som hjälpte dig att vinna.

### game-result-loss.mp3

**Användning:** Verifierad förlust för eleven.

Motståndaren vann det här partiet. Du kan fortfarande lära dig mycket av det. Spela gärna igenom dragen och leta efter en idé att prova nästa gång.

### game-result-stalemate.mp3

**Användning:** Partiet har slutat med patt.

Det blev patt. Spelaren som är på tur har inget lagligt drag, men kungen står inte i schack. Då blir partiet remi.

### game-result-repetition.mp3

**Användning:** Remi genom trefaldig upprepning enligt appens regelmodell.

Partiet blev remi eftersom samma ställning upprepades tre gånger.

### game-result-insufficient.mp3

**Användning:** Regelmotorn har fastställt otillräckligt material.

Partiet blev remi. Det finns inte tillräckligt med material kvar för att någon ska kunna sätta schackmatt.

### game-result-fifty-moves.mp3

**Användning:** Remi enligt femtiodragsregeln i appens regelmodell.

Partiet blev remi enligt femtiodragsregeln. Båda spelarna har gjort femtio drag var utan att flytta en bonde eller slå någon pjäs.

### game-result-draw.mp3

**Användning:** Annat fastställt remiavslut.

Partiet blev remi. Det betyder oavgjort. Spela gärna igenom dragen och se vad ni kan lära er av partiet.

### game-result-resigned.mp3

**Användning:** Eleven har bekräftat att ge upp.

Du har avslutat partiet genom att ge upp. Du kan fortfarande gå igenom dragen och upptäcka något att prova nästa gång.

**Notering – läses inte upp:** Spela efter bekräftelsen, inte när dialogen för att ge upp öppnas.

### system-engine-unavailable.mp3

**Användning:** Schackmotorn kunde inte starta eller svara.

Schackmotorn kunde inte svara. Prova att trycka på försök igen.

### system-save-unavailable.mp3

**Användning:** Lokal sparning misslyckades.

Det gick inte att spara ditt parti på den här datorn. Du kan fortsätta spela så länge fliken är öppen.

### progress-first-lesson.mp3

**Användning:** Medaljen Nyfiken upptäckare låses upp för första gången.

Din första lektion är klar. Du har låst upp medaljen nyfiken upptäckare!

### progress-first-game.mp3

**Användning:** Medaljen Första partiet låses upp för första gången.

Ditt första parti är avslutat. Du har låst upp din första partimedalj!

### progress-first-win.mp3

**Användning:** Medaljen Första vinsten låses upp för första gången.

Din första vinst! Du har låst upp en ny medalj. Vad vill du prova härnäst?

### progress-mate-detective.mp3

**Användning:** Båda nuvarande mattproblem är lösta och medaljen låses upp.

Du har löst båda mattproblemen och blivit en mattdetektiv. Din nya medalj finns bland dina framsteg.

## P3 – framtida funktioner – vänta med inspelning (10 filer)

### clock-start-ten-minutes.mp3

**Användning:** Framtida tidsläge med tio minuter per spelare.

Varje spelare har tio minuter på sig. Din klocka går bara när det är din tur. Försök att använda tiden till att tänka igenom dina drag.

### clock-start-fifteen-minutes.mp3

**Användning:** Framtida tidsläge med femton minuter per spelare.

Varje spelare har femton minuter på sig. Din klocka går bara när det är din tur. Ta tid på dig att undersöka brädet innan du flyttar.

### clock-player-one-minute.mp3

**Användning:** Framtida valbar tidsvarning, en gång när en minut återstår.

En minut kvar på din klocka.

### clock-player-thirty-seconds.mp3

**Användning:** Framtida valbar tidsvarning, en gång när trettio sekunder återstår.

Trettio sekunder kvar på din klocka.

### clock-player-expired.mp3

**Användning:** Framtida verifierat tidsavslut för eleven.

Din tid är slut. Partiet är avslutat. Du kan gå igenom dragen och prova igen.

**Notering – läses inte upp:** Läs upp den verkliga slutorsaken separat. Påstå inte automatiskt att det är förlust; reglerna kan ge remi.

### clock-opponent-expired.mp3

**Användning:** Framtida verifierat tidsavslut för motståndaren.

Motståndarens tid är slut. Partiet är avslutat.

**Notering – läses inte upp:** Påstå inte automatiskt att eleven vann; använd det fastställda resultatet.

### multiplayer-waiting.mp3

**Användning:** Framtida privat lobby har faktiskt skapats.

Partiet är skapat. Dela spelkoden med din kompis. Vi väntar på att din kompis ska ansluta.

### multiplayer-connected.mp3

**Användning:** Framtida verifierad anslutning av motspelare.

Din kompis har anslutit till partiet.

### multiplayer-connection-lost.mp3

**Användning:** Framtida avbruten anslutning.

Anslutningen är bruten. Spelet försöker ansluta igen.

**Notering – läses inte upp:** Påstå inte att partiet eller klockan har pausats om servern inte faktiskt har gjort det.

### multiplayer-reconnected.mp3

**Användning:** Framtida anslutning och serverställning har återställts.

Anslutningen är tillbaka. Titta på brädet innan du gör ditt nästa drag.
