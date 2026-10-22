# Mindre elevdatorer

Layouten utgår från webbläsarfönstrets tillgängliga CSS-pixlar. Skärmens märkta upplösning kan vara större än utrymmet i fönstret på grund av systemskalning, webbläsarens zoom och verktygsrader.

- Vid högst 1100 px bredd fälls sidomenyn undan. En menyknapp öppnar hela navigationen med utskrivna namn. Stängknapp, Escape och bakgrundsklick stänger. Fokus hålls i menyn och återgår till öppningsknappen; byte till stor skärm stänger menyn.
- På små laptopfönster ligger bräde och instruktioner bredvid varandra när bredden räcker. Bredden på brädet tar hänsyn till höjden. Träningspass reserverar extra plats för uppdragsraden.
- Vid liten höjd minskas tomrum och dekorativa rubrikrader. Text, klockor och kontroller är kvar. Dialoger har begränsad höjd och kan rullas inuti.
- Vid mycket korta eller smala fönster används lodrät rullning så att brädet fortfarande går att trycka på. Hela sidan behöver inte rymmas samtidigt. Innehåll ska inte kapas eller kräva sidledsrullning.
- Pekskärmens knappar behåller minst 44 px höjd. Brädets rutor följer det kvadratiska brädets storlek; de krymps inte till små vanliga ikonknappar för att få hela sidan att passa.

`e2e/compact.spec.ts` körs som desktop-Chromium med pekskärm och datorns webbläsarläge (`isMobile: false`). Måtten avser webbläsarfönstrets CSS-yta. Storlekar: 1024×768, 1024×600, 960×600, 800×600, 800×500 och 640×480. Proven täcker namngiven meny, fokus/Escape/bakgrund/resize, samtliga huvudsidor, instruktioner och lösning med tryck, träningspass, tidsatt soloparti med verklig motor, korta dialoger och ett tidsatt kompisparti via testfixturen. Tidigare testprojekt för dator, mobil och pekskärm behålls. Slutresultat dokumenteras i utvecklingsloggen.

Prova även på de faktiska elevdatorerna med skolans vanliga zoom och systemskalning. Dessa tekniska prov ersätter inte elevernas bedömning av läsbarhet och träffsäkerhet.
