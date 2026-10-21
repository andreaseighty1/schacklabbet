# Schacklabbet – röstmanus för ElevenLabs

Det här är ett inspelningsunderlag. De 25 P1-filerna är inkopplade i appens ljudspelare. Manuset är inte en kontrollerad transkription av de levererade inspelningarna.

De 13 nya grundlektionerna har ett separat paket med 39 repliker: GRUNDLEKTIONER-MANUS.md, GRUNDLEKTIONER-FILNAMN.txt och rena textfiler i elevenlabs-input/skola/. Alla 39 nya ljudfiler är levererade och inkopplade.
De fem övningarna om hot, räddning och säkra slag har 15 nya manus i TAKTIK-MANUS.md och elevenlabs-input/taktik/. Dessa ljudfiler är ännu inte levererade eller inkopplade; uppgifterna fungerar med text.

## Börja här

Gör först ett röstprov med `start-welcome.mp3`, `lesson-knight-intro.mp3` och `game-player-check.mp3`. När röst och uttal känns rätt, fortsätt med P1. P2 kan göras därefter. Vänta med P3 tills nästa ljudomgång: schackklockan fungerar nu i text, men dess repliker är inte inkopplade. Multiplayer återstår.

Varje textfil i `elevenlabs-input/` innehåller endast orden som ska sägas. Ladda upp eller klistra in innehållet i ElevenLabs och spara ljudet med samma basnamn, men ändelsen `.mp3`. Exempel: `lesson-rook-intro.txt` → `lesson-rook-intro.mp3`.

## Röstregi

- Svenska, varm och lugn vuxen röst. Skriv för elever i årskurs 4: korta meningar, en instruktion i taget och konkreta ord. Förklara nya schackord när de används. Se [språkstödet](SPRAK_OCH_UTTAL.md).
- Naturligt och uppmuntrande, med korta pauser mellan tankarna. Varningar ska låta eftertänksamma, inte alarmerande.
- Samma röst och ungefär samma ljudnivå i alla filer. Ingen musik, ljudeffekter, extra hälsningsfras eller påhittad avslutning.
- Leverera MP3, en replik per fil. Inga inledande eller avslutande långa tystnader och inga avklippta ord.
- Läs endast själva manustexten. Läs inte upp filnamn, prioritet, användning eller inspelningsnoteringar.

## Uttal

Skriv rutnamn med stor bokstav och talet som ord: `A ett`, `B två`, `C tre`, `D fyra`, `E fem`, `F sex`, `G sju`, `H åtta`. Använd exempelvis `F fyra` och `G fem`, inte fonetiska omskrivningar som ”eff fyra” eller ”ge fem”. Användaren har provat detta i ElevenLabs med bra resultat.

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

Tornet går rakt, längs rader och linjer. Det kan gå flera rutor i samma drag om vägen är fri. Flytta tornet från A ett till A sju och ta den svarta bonden.

### lesson-rook-hint.mp3

**Användning:** Lyssna på tornlektionens ledtråd.

Tornet kan gå många rutor uppåt om vägen är fri. Följ linjen från A ett till A sju.

### lesson-rook-success.mp3

**Användning:** Tornlektionen löst.

Precis! Tornet gick rakt upp till A sju och tog bonden. Tornet kan slå en motståndarpjäs på rutan där det landar.

### lesson-bishop-intro.mp3

**Användning:** Lyssna på löparlektionen.

Löparen rör sig diagonalt och stannar alltid på samma färg. Den kan gå flera rutor om vägen är fri. Ta bonden på G fem med löparen.

### lesson-bishop-hint.mp3

**Användning:** Lyssna på löparlektionens ledtråd.

Följ diagonalen från D två. Först E tre, sedan F fyra och till sist G fem.

### lesson-bishop-success.mp3

**Användning:** Löparlektionen löst.

Snyggt! Löparen följde diagonalen hela vägen till G fem och tog bonden. Den stannade på samma färg hela vägen.

### lesson-knight-intro.mp3

**Användning:** Lyssna på springarlektionen.

Springaren går två rutor åt ett håll och en ruta åt sidan, som bokstaven L. Den kan hoppa över andra pjäser. Ta bonden på F fem med springaren.

### lesson-knight-hint.mp3

**Användning:** Lyssna på springarlektionens ledtråd.

Börja på D fyra. Tänk två rutor åt höger och en ruta upp. Var hamnar springaren då?

### lesson-knight-success.mp3

**Användning:** Springarlektionen löst.

Rätt! Springaren hoppade i ett L från D fyra till F fem och tog bonden.

### lesson-castle-intro.mp3

**Användning:** Lyssna på rockadlektionen.

Rockad är ett specialdrag med kungen och ett torn. Ingen av dem får ha flyttat tidigare, och rutorna mellan dem måste vara tomma. Kungen får inte stå i schack, eller passera eller landa på en ruta som motståndaren angriper. Gör kort rockad genom att flytta kungen från E ett till G ett.

### lesson-castle-hint.mp3

**Användning:** Lyssna på rockadlektionens ledtråd.

Flytta kungen två rutor åt höger, mot tornet. Tornet följer automatiskt med.

### lesson-castle-success.mp3

**Användning:** Rockadlektionen löst.

Du gjorde rockad! Kungen står nu på G ett och tornet har flyttat till F ett. Två pjäser flyttades i samma drag.

### challenge-rook-mate-intro.mp3

**Användning:** Lyssna på mattproblemet med torn.

Svarts kung står vid kanten. Nu är det vits tur. Hitta ett torndrag som ger schackmatt direkt. Titta efter vilka rutor den svarta kungen kan fly till.

### challenge-rook-mate-hint.mp3

**Användning:** Lyssna på mattproblemets ledtråd.

Din kung täcker G åtta och G sju. Kan tornet ge schack längs H-linjen?

### challenge-rook-mate-success.mp3

**Användning:** Mattproblemet med torn löst.

Schackmatt! Tornet täcker H-linjen och din kung stänger flyktvägarna. Pjäserna samarbetar.

### challenge-queen-mate-intro.mp3

**Användning:** Lyssna på mattproblemet med dam.

Damen och kungen kan samarbeta. Nu är det vits tur. Hitta ett drag med damen som sätter svart schackmatt.

### challenge-queen-mate-hint.mp3

**Användning:** Lyssna på mattproblemets ledtråd.

Kan du ge schack med damen på en ruta som din egen kung försvarar? Kontrollera också motståndarens flyktvägar.

### challenge-queen-mate-success.mp3

**Användning:** Mattproblemet med dam löst.

Schackmatt! Damen på G sju täcker flyktvägarna och är försvarad av kungen på F sex.

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

Kan motståndaren ta någon av dina pjäser? Kan du flytta den till en säkrare ruta, eller låta en annan pjäs skydda den?

**Notering – läses inte upp:** Ersätter inte den positionsbundna texten. Använd inte som exakt uppläsning av en specifik pjäs och ruta.

### game-hint-engine.mp3

**Användning:** Ett motorförslag har faktiskt laddats på begäran.

Datorn har hittat ett förslag. Titta på det markerade draget. Vad skulle hända om du gjorde det? Du väljer själv.

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

Det blev patt. Spelaren som är på tur kan inte göra något tillåtet drag, men kungen står inte i schack. Då blir det remi, alltså oavgjort.

### game-result-repetition.mp3

**Användning:** Remi genom trefaldig upprepning enligt appens regelmodell.

Det blev remi, alltså oavgjort. Samma ställning på brädet har upprepats tre gånger.

### game-result-insufficient.mp3

**Användning:** Regelmotorn har fastställt otillräckligt material.

Det blev remi, alltså oavgjort. Med de pjäser som finns kvar kan ingen av er sätta schackmatt.

### game-result-fifty-moves.mp3

**Användning:** Remi enligt femtiodragsregeln i appens regelmodell.

Det blev remi, alltså oavgjort. Båda spelarna har gjort femtio drag var utan att flytta en bonde eller ta någon pjäs. Då säger reglerna i spelet att partiet är slut.

### game-result-draw.mp3

**Användning:** Annat fastställt remiavslut.

Partiet blev remi. Det betyder oavgjort. Spela gärna igenom dragen och se vad ni kan lära er av partiet.

### game-result-resigned.mp3

**Användning:** Eleven har bekräftat att ge upp.

Du har avslutat partiet genom att ge upp. Du kan fortfarande gå igenom dragen och upptäcka något att prova nästa gång.

**Notering – läses inte upp:** Spela efter bekräftelsen, inte när dialogen för att ge upp öppnas.

### system-engine-unavailable.mp3

**Användning:** Schackmotorn kunde inte starta eller svara.

Datorn kunde inte göra sitt drag. Prova att trycka på försök igen.

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

## P3 – senare ljudomgång – vänta med inspelning (10 filer)

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

## SKOLA – nya grundlektioner – levererade (39 filer)

### lesson-pawn-forward-intro.mp3

**Användning:** Uppdrag: Bonden går framåt.

En bonde går en ruta rakt fram till en tom ruta. Den kan inte gå bakåt. Här spelar du vit. Flytta bonden från D tre till D fyra.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-pawn-forward-hint.mp3

**Användning:** Ledtråd: Bonden går framåt.

Välj bonden på D tre. Rutan D fyra är precis framför den.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-pawn-forward-success.mp3

**Användning:** Förklaring efter rätt svar: Bonden går framåt.

Rätt! Bonden gick en ruta framåt. Den måste gå till en tom ruta när den går rakt fram.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-pawn-double-intro.mp3

**Användning:** Uppdrag: Bondens första dubbelsteg.

Från sin startruta får bonden välja mellan en och två rutor framåt. Båda rutorna måste vara tomma om den går två steg. Flytta bonden från D två till D fyra.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-pawn-double-hint.mp3

**Användning:** Ledtråd: Bondens första dubbelsteg.

D tre och D fyra är tomma. Bonden står kvar på sin startruta D två.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-pawn-double-success.mp3

**Användning:** Förklaring efter rätt svar: Bondens första dubbelsteg.

Två steg! Bonden får göra dubbelsteget från sin startruta. Den kan inte hoppa över en pjäs.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-pawn-capture-intro.mp3

**Användning:** Uppdrag: Bonden tar snett.

Bonden går rakt fram men tar en motståndarpjäs en ruta snett framåt. Bonden på D fem blockerar vägen rakt fram. Ta i stället bonden på E fem med din bonde på D fyra.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-pawn-capture-hint.mp3

**Användning:** Ledtråd: Bonden tar snett.

E fem ligger en ruta snett framför D fyra. Där står en svart bonde som du får ta.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-pawn-capture-success.mp3

**Användning:** Förklaring efter rätt svar: Bonden tar snett.

Precis! Din bonde tog snett framåt. Den svarta bonden på D fem står kvar: en bonde kan inte ta rakt fram.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-pawn-black-intro.mp3

**Användning:** Uppdrag: Framåt för svart.

Nu är det svarts tur och du spelar svart. Svarta bönder går mot rad 1. Brädet är vänt så att dina pjäser är närmast dig. Flytta bonden från D sex till D fem.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-pawn-black-hint.mp3

**Användning:** Ledtråd: Framåt för svart.

För svart går radnumren nedåt: från rad 6 till rad 5. Välj D sex och sedan D fem.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-pawn-black-success.mp3

**Användning:** Förklaring efter rätt svar: Framåt för svart.

Bra! Den svarta bonden gick framåt mot rad 1. Vita bönder går åt andra hållet, mot rad 8.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-pawn-promotion-intro.mp3

**Användning:** Uppdrag: Bonden blir en ny pjäs.

När bonden når sista raden ska den bytas till en dam, ett torn, en löpare eller en springare i samma färg. Det kallas förvandling. Flytta bonden från A sju till A åtta och välj en ny pjäs.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-pawn-promotion-hint.mp3

**Användning:** Ledtråd: Bonden blir en ny pjäs.

A åtta är sista raden för en vit bonde. Efter flytten får du välja vilken av de fyra pjäserna bonden ska bli.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-pawn-promotion-success.mp3

**Användning:** Förklaring efter rätt svar: Bonden blir en ny pjäs.

Du förvandlade bonden! Alla fyra valen är tillåtna. Du får välja en dam även om din första dam finns kvar på brädet.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-queen-intro.mp3

**Användning:** Uppdrag: Damen går rakt och snett.

Damen kan gå rakt som ett torn och snett som en löpare. Den får gå flera rutor om vägen är fri, men inte hoppa över pjäser. Ta bonden på G fem med damen på D två.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-queen-hint.mp3

**Användning:** Ledtråd: Damen går rakt och snett.

Följ den sneda vägen från D två: E tre, F fyra, G fem.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-queen-success.mp3

**Användning:** Förklaring efter rätt svar: Damen går rakt och snett.

Rätt! Damen tog bonden på G fem. Den kan gå både rakt och snett, men får inte byta riktning mitt i draget.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-king-intro.mp3

**Användning:** Uppdrag: Kungen tar ett säkert steg.

Kungen går en ruta åt valfritt håll, men aldrig till en ruta som motståndaren hotar. Svarts torn hotar rutorna längs D-linjen. Flytta kungen från E ett till den säkra rutan E två. Kungarna får inte stå intill varandra.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-king-hint.mp3

**Användning:** Ledtråd: Kungen tar ett säkert steg.

E två är en ruta framför kungen. D två är hotad av tornet, så dit får kungen inte gå.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-king-success.mp3

**Användning:** Förklaring efter rätt svar: Kungen tar ett säkert steg.

Kungen står säkert på E två! Den måste alltid undvika hotade rutor. I schack tar man aldrig kungen: spelet slutar vid schackmatt.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-check-escape-intro.mp3

**Användning:** Uppdrag: Schack: flytta kungen.

Schack betyder att kungen är hotad. Då måste du skydda den direkt. Svarts torn på E åtta hotar din kung på E ett. Flytta kungen till F ett, där tornet inte når den.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-check-escape-hint.mp3

**Användning:** Ledtråd: Schack: flytta kungen.

Tornet hotar E-linjen. F ett ligger bredvid kungen och utanför den linjen.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-check-escape-success.mp3

**Användning:** Förklaring efter rätt svar: Schack: flytta kungen.

Du kom ur schacken! Ett sätt är att flytta kungen till en säker ruta. Du får inte göra ett drag som lämnar din kung i schack.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-check-capture-intro.mp3

**Användning:** Uppdrag: Schack: ta den hotande pjäsen.

Du kan ibland komma ur schack genom att ta pjäsen som hotar kungen. Svarts torn på E två ger schack. Tornet är inte skyddat. Ta det med kungen på E ett.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-check-capture-hint.mp3

**Användning:** Ledtråd: Schack: ta den hotande pjäsen.

Kungen får ta en pjäs en ruta bort om rutan inte hotas av någon annan motståndarpjäs.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-check-capture-success.mp3

**Användning:** Förklaring efter rätt svar: Schack: ta den hotande pjäsen.

Hotet är borta! Du tog tornet med kungen. Det gick eftersom ingen annan svart pjäs hotade rutan E två.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-check-block-intro.mp3

**Användning:** Uppdrag: Schack: ställ en pjäs emellan.

Ibland kan en annan pjäs skydda kungen genom att ställa sig i vägen. Tornet på E åtta ger schack längs E-linjen. Flytta löparen från C ett till E tre så att den stoppar tornets väg till kungen.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-check-block-hint.mp3

**Användning:** Ledtråd: Schack: ställ en pjäs emellan.

Löparen går snett från C ett via D två till E tre. Då hamnar den mellan tornet och kungen.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-check-block-success.mp3

**Användning:** Förklaring efter rätt svar: Schack: ställ en pjäs emellan.

Löparen skyddar kungen! Mot schack kan du ibland flytta kungen, ta den hotande pjäsen eller ställa något emellan. En springares hopp går inte att stoppa genom att ställa en pjäs i vägen.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-checkmate-intro.mp3

**Användning:** Uppdrag: Vad betyder schackmatt?.

Nu är det svarts tur. Svarts kung på H åtta är i schack. Den kan inte fly, ta damen eller få hjälp av en annan pjäs. Vad betyder det för partiet?

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-checkmate-hint.mp3

**Användning:** Ledtråd: Vad betyder schackmatt?.

Damen ger schack och den vita kungen skyddar damen. Svart har inget lagligt drag som tar bort schacken.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-checkmate-success.mp3

**Användning:** Förklaring efter rätt svar: Vad betyder schackmatt?.

Det är schackmatt och vit vinner! Schackmatt betyder att kungen är i schack och att inget lagligt drag kan rädda den. Kungen står kvar på brädet.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-stalemate-intro.mp3

**Användning:** Uppdrag: Patt: ingen kan vinna.

Nu är det svarts tur. Kungen på H åtta är inte i schack, men svart har inget lagligt drag. Vad händer med partiet?

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-stalemate-hint.mp3

**Användning:** Ledtråd: Patt: ingen kan vinna.

Kungen står säkert på H åtta. Men G åtta, G sju och H sju är hotade, och svart har inga andra pjäser att flytta.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-stalemate-success.mp3

**Användning:** Förklaring efter rätt svar: Patt: ingen kan vinna.

Det är patt! Den som är på drag har inget lagligt drag och kungen är inte i schack. Partiet slutar remi, alltså oavgjort. Ingen vinner.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-en-passant-intro.mp3

**Användning:** Uppdrag: Extra: en passant.

Svart har precis flyttat sin bonde två rutor, från D sju till D fem, bredvid din bonde på E fem. Just nu får du ta den som om den bara gått till D sex. Flytta från E fem till D sex. Det kallas en passant och måste göras direkt i nästa drag.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-en-passant-hint.mp3

**Användning:** Ledtråd: Extra: en passant.

Din bonde landar på den tomma rutan D sex. Den svarta bonden tas bort från D fem.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

### lesson-en-passant-success.mp3

**Användning:** Förklaring efter rätt svar: Extra: en passant.

Du gjorde en passant! Din bonde står på D sex och bonden på D fem är borta. Om du väljer ett annat drag försvinner chansen att ta just den bonden på det här sättet.

**Notering – läses inte upp:** Ljudfilen är levererad och inkopplad. Manuset är inte en verifierad transkription av inspelningen.

## TAKTIK – hot och säkra drag – redo för inspelning (15 filer)

### lesson-spot-threat-intro.mp3

**Användning:** Vem hotar damen?: uppdrag.

Nu är det vits tur. Din dam står på E fem. Vilken svart pjäs kan ta damen om du låter henne stå kvar? Välj ett svar under brädet.

### lesson-spot-threat-hint.mp3

**Användning:** Vem hotar damen?: ledtråd.

Följ springarens hopp från C sex: två rutor åt ett håll och en åt sidan. Kan den nå E fem?

### lesson-spot-threat-success.mp3

**Användning:** Vem hotar damen?: förklaring efter rätt svar.

Springaren på C sex hotar damen! Den kan hoppa till E fem. Titta efter motståndarens hot innan du väljer ditt drag.

### lesson-rescue-rook-intro.mp3

**Användning:** Rädda tornet: uppdrag.

Svarts torn på A åtta hotar ditt torn på A ett. Rädda ditt torn så att svart inte kan ta det direkt efter ditt drag. Du kan flytta undan eller ta pjäsen som hotar. Det finns flera lösningar.

### lesson-rescue-rook-hint.mp3

**Användning:** Rädda tornet: ledtråd.

På A-linjen kan svarts torn fortfarande nå ditt torn. Undersök en annan linje, eller ta tornet på A åtta.

### lesson-rescue-rook-success.mp3

**Användning:** Rädda tornet: förklaring efter rätt svar.

Ditt torn kan inte tas direkt! Du kan rädda en pjäs genom att flytta undan eller ta pjäsen som hotar, om din egen pjäs står säkert efteråt.

### lesson-rescue-queen-intro.mp3

**Användning:** Rädda damen: uppdrag.

Springaren på C sex hotar din dam på E fem. Flytta damen till en ruta där ingen svart pjäs kan ta henne direkt efteråt. Titta efter både springarens hopp och kungens närmaste rutor. Det finns flera lösningar.

### lesson-rescue-queen-hint.mp3

**Användning:** Rädda damen: ledtråd.

Damen kan till exempel flytta rakt nedåt längs E-linjen. Kontrollera om springaren eller kungen kan nå rutan du väljer.

### lesson-rescue-queen-success.mp3

**Användning:** Rädda damen: förklaring efter rätt svar.

Damen kom undan hotet! Ingen svart pjäs kan ta henne direkt på den nya rutan. Efter en flytt behöver du undersöka hoten igen.

### lesson-rescue-knight-intro.mp3

**Användning:** Rädda svarts springare: uppdrag.

Nu spelar du svart. Vits bonde på E fem hotar din springare på F sex. Flytta springaren så att ingen vit pjäs kan ta den direkt efteråt. Se också upp för den vita kungen på F tre. Det finns flera lösningar.

### lesson-rescue-knight-hint.mp3

**Användning:** Rädda svarts springare: ledtråd.

Springaren hoppar i ett L. E fyra och G fyra ligger intill vits kung. Undersök en annan landningsruta.

### lesson-rescue-knight-success.mp3

**Användning:** Rädda svarts springare: förklaring efter rätt svar.

Springaren står säkert efter hoppet! Bonden når den inte längre, och den står inte intill vits kung. Även när du spelar svart behöver du leta efter motståndarens hot.

### lesson-safe-capture-intro.mp3

**Användning:** Ta en pjäs – men se upp: uppdrag.

Din löpare på D tre kan ta bonden på C fyra eller tornet på H sju. Ta den pjäs som löparen kan ta utan att själv kunna tas direkt efteråt. Titta på svarts kung innan du väljer.

### lesson-safe-capture-hint.mp3

**Användning:** Ta en pjäs – men se upp: ledtråd.

Kungen på G åtta skyddar tornet på H sju. Vem skyddar bonden på C fyra?

### lesson-safe-capture-success.mp3

**Användning:** Ta en pjäs – men se upp: förklaring efter rätt svar.

Du tog bonden på C fyra! Ingen svart pjäs kan ta löparen direkt där. Tornet på H sju var skyddat av kungen. Undersök motståndarens svar innan du tar en pjäs.
