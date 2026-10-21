# Ditt nybörjarpass

Öppna passet från startsidans ”Tre små schackuppdrag” eller menyns ”Ditt nybörjarpass”. Adressen använder `#session`. Passet består av tre befintliga, verifierade uppgifter i fast ordning:

1. Tornet från A1 till A7, med slag av bonden.
2. Kungen från E1 till F1 för att komma ur schack.
3. Tornet från A1 till H1 för schackmatt med stöd av kungen.

Ungefär tio minuter är en uppskattning för att läsa, lyssna, prova och fundera. Passet har ingen nedräkning och bedömer inte snabbhet. Eleven får använda rutnamn, möjliga drag, ledtrådar och befintliga röstinstruktioner. Ingen poäng dras av för hjälp. Punkter visar vanliga drag och ringar visar slag, även en passant på en tom målruta i den separata lektionen.

Varje uppgift måste lösas under det aktuella passet. Att tornlektionen redan är klar i Schackskolan hoppar inte över den. Ett felaktigt försök ger inte ett avklarat pass-steg. Efter tre korrekta drag visas vad eleven har övat på och en frivillig muntlig reflektionsfråga. Återkopplingen beskriver genomförda övningar; den är ingen bedömning av generell spelstyrka.

## Paus, återställning och historik

Pausknappen går tillbaka till startsidan. Eleven kan också byta sida eller stänga fliken. Passets aktuella uppgift och de redan genomförda lösningarna sparas lokalt. Om uppgiften lösts före pausen men eleven ännu inte gått vidare visas det lösta brädet och förklaringen vid återupptagning. Ingen lösning eller ljudfil spelas upp automatiskt efter omladdning.

Ett färdigt pass registreras bara en gång. Eleven kan starta ett nytt försök med ”Öva passet igen”; det behåller historiken men kräver tre nya lösningar. Upp till 20 avslut sparas, och de fem senaste visas under Mina framsteg med datum. Antalet anger sparade avslut, inte ett obegränsat totalantal. Pågående vanliga partier, schackklockor, vinster och tidigare framsteg skrivs inte över av passet. En redan startad match på tid fortsätter enligt klockans vanliga regler.

Data ligger separat i `schacklabbet.training.v1`, med en aktuell körning och dess avslutade historik. Valideringen kontrollerar version, datum, uppgiftsordning, verkliga lösningar och unika avslut. Skadad passdata ger en begriplig varning medan övriga framsteg fortfarande kan läsas. Lagringen fungerar på samma villkor som övrig lokal sparning: den följer inte med till andra datorer och rensas om webbplatsens data tas bort.

## Kontroller

Enhetstester verifierar uppgifternas lagliga lösningar, stegordning, avvisade fel/stale svar, återläsning av lösta steg, engångsregistrering, nya försök, gallring till 20 avslut och skadad data. Webbläsartester för desktop/mobil omfattar ett helt pass, hjälprutor, ledtråd, paus före Nästa, omladdning, slutåterkoppling, historik och bevarat parti och tidigare framsteg. Körresultat och publicering finns i utvecklingsloggen. Pedagogiskt användartest med elever återstår.
