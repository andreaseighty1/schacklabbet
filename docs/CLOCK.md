# Schackklocka

Eleven väljer **utan tid**, **15 minuter var** eller **10 minuter var** när ett nytt parti startas. Utan tid är standard första gången. Senaste partiets val återanvänds i nästa partidialog. Ingen extra tid läggs till efter drag. Vit börjar, även när eleven spelar svart.

## Spelbeteende

- Bara den spelare som är på drag använder tid. Ett genomfört lagligt drag växlar klockan.
- Tips, riskvarning, bondeförvandling och andra dialoger pausar inte tiden. Val av nytt parti börjar gälla först när eleven trycker på ”Nu spelar vi”.
- Sidbyte inom appen pausar inte partiet. Datorns pågående sökning fortsätter och en synlig påminnelse leder tillbaka till partiet.
- Ångra byter tillbaka turen men återbetalar ingen förbrukad tid. Tävlingsprofilen har fortsatt ingen ångra-knapp.
- Omladdning eller stängd flik pausar inte tiden. När sidan öppnas igen räknas tiden sedan senaste sparade turbyte av från den som var på drag. En helt stängd eller fryst webbläsare kan inte genomföra nya datordrag under frånvaron.
- Schackmatt, remi, uppgivning och tidsavslut stoppar båda klockorna. Nytt parti återställer båda till vald tid.
- Ingen ny röstfil används för klockan. Befintliga P1-ljud fungerar som tidigare; P3-replikerna för klocka är ännu inte inkopplade.

Klockorna har textvärden och markerad aktiv spelare. Sista 30 sekunderna markeras även med färg. Skärmläsaren kan läsa tiden på begäran; varje tiondelssekund annonseras inte.

## Tid och sparning

`GameClock` sparar återstående millisekunder, aktiv färg och tidsstämpel. Intervall uppdaterar visningen och upptäcker tidsavslut men drar aldrig själva av tid. Förfluten tid beräknas från tidsstämplarna, även när webbläsaren har fördröjt intervallen. Under ett besök används också en monoton tidskälla så att en bakåtställd systemklocka inte ger extra tid. Mellan besök behövs datorns systemtid.

Tidsgränsen kontrolleras även direkt innan ett elevdrag eller ett motorsvar godtas. Vid tidsavslut avbryts sökning och ljud, öppna speldialoger stängs och sena motorsvar ignoreras. Appens hela bräde renderas inte om för varje klocktick.

Sparformatets version 1 behålls med ett valfritt `clock`-fält. Äldre partier öppnas utan klocka. Ett passerat tidsavslut vid återläsning avgörs innan motorn får starta. Redan avslutade partier behåller resultatet. PGN får `TimeControl` i sekunder, `Result` och vid tidsavslut `Termination "time forfeit"`. Tidsvinster räknas i lokala framsteg en gång per parti.

Detta är en lokal träningsklocka. En framtida gemensam topplista behöver serverns validering av både tid och resultat enligt multiplayerplanen.

## Remi vid tidsavslut

Om motståndaren saknar material som kan sätta matt blir det remi i stället för vinst på tid. Kontrollen beaktar båda sidors pjäser: ensam kung, ensam springare mot kung/dam och löpare som alla går på samma rutfärg utan bönder eller springare. Motståndarens pjäser kan ibland göra en mattställning möjlig och ingår därför i kontrollen. Två springare kan exempelvis sätta matt med motståndarens medverkan även om de inte kan tvinga fram matt.

Kontrollen är materialbaserad. Den löser inte alla ställningsspecifika fall med låsta bönder, fästningar eller tvingade dragföljder. Appen ska därför inte beskrivas som en fullständig tävlingsdomare för alla specialfall. Resonemanget om materialets gränser har jämförts med [python-chess dokumentation för otillräckligt mattmaterial](https://python-chess.readthedocs.io/en/stable/_modules/chess.html#Board.has_insufficient_material); ingen ytterligare motor eller kod därifrån distribueras.

## Verifiering

Enhetstester täcker förfluten tid, turbyte, exakt tidsgräns, negativ tid, återställning, ångra utan tidsåterbetalning, bakåtställd systemtid, sparvalidering, återläsning, PGN-resultat och materialfallen ovan. Webbläsarflöden för desktop och mobil täcker klockval, layout, omladdning, dialoger, sidbyte med verklig Stockfish, avbrytning av försenat motorsvar, drag efter tidsgränsen, remi, uppgivning, framsteg och nytt parti. Faktiskt körresultat finns i utvecklingsloggen.
