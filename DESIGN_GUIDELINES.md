# Visuell identitet

Schacklabbet ska kännas som ett varmt, lugnt spelrum där man får tänka själv. Bakgrunden är ljus, med djup grön primärfärg, salviagrönt, lime, varm sand och diskret lavendel. Inga annonser eller tävlingsrankningar stör uppgiften.

| Användning                 | Färg                     |
| -------------------------- | ------------------------ |
| Primär / mörk spelmiljö    | `#193f37`                |
| Sidbakgrund                | `#f7f8f2`                |
| Kort / paneler             | `#fffef9`                |
| Huvudknapp i hero          | `#d8edac`                |
| Bräde, ljust               | `#e9e6cf`                |
| Bräde, mörkt               | `#7e9a7d`                |
| Fokus / rekommenderat drag | `#d7903a`                |
| Hotmarkering               | `#b75239` + utropstecken |

Systemtypsnittet Segoe UI används i första hand, följt av Arial och sans-serif. Inga externa typsnitt eller bild-CDN:er krävs. Stora rubriker har lätt negativ bokstavsmellanrum, medan små etiketter har ökat mellanrum. Ett kursivt Georgia-inslag ger startsidans huvudbudskap karaktär.

## Tillgångar

Samtliga sex pjäser är egna vektorer, med gemensam bas och tydlig silhuett. Vita pjäser är benvita med mörk kontur, svarta är mörkgröna med ljusare detalj. Springaren har hästprofil, löparen snitt, tornet tinnar och kungen kors. Favicon och logotyp bygger på springaren. Lucide ger konsekventa funktionsikoner. Startsidan illustreras med CSS-bräde och samma pjäser.

Pjäserna har nu en gemensam sockel, diskret materialskuggning och konturer som läses även på små rutor. Gradienternas ID:n är unika per SVG-instans, så flera bräden och illustrationer kan finnas på samma sida utan färgkollisioner. Den uppdaterade faviconen följer springarens silhuett.

Lektionskorten har egna rörelsediagram med ett beskuret bräde, pjäser och guldtonade pilar. De är dekorativa illustrationer; det interaktiva övningsbrädet visar uppgiftens faktiska position. Medaljerna är egna vektorer med band, präglad kant och fyra motiv: korsade svärd, pokal, kompass och mattdetektiv. Låsta medaljer är salviagröna och upplåsta får varm guldton, med text som också anger status.

## Layout

Desktop har fast sidomeny, tunn toppmeny och luftig innehållsyta. Spelläget prioriterar brädet, med mindre panel för status, stöd och drag. Brädstorleken följer tillgänglig skärmhöjd. På mindre skärm flyttas panelen under brädet och menyn blir kompakt eller öppningsbar.

Kort har 12–18 px hörnradie och tunna kanter. Skuggor används främst på spelbrädet och dialoger. Primärknappar är gröna; startsidans primärknapp är lime mot mörk bakgrund. Funktioner som inte är färdiga märks uttryckligen som kommande.

## Tillgänglighet

- Svenska tillgängliga namn för varje ruta, pjäs, lagligt drag och hot.
- Piltangenter och Enter på brädet, roving tabindex och tydliga fokusramar.
- Fokusfälla och Escape i modaler. Status och återkoppling med `role=status` eller `aria-live`.
- Hot kompletteras med utropstecken och text; schack anges också i spelstatus.
- Kort, knappar och ikoner har tillgängliga namn. Dekorativ SVG är dold för hjälpmedel.
- Korta övergångar stängs av via `prefers-reduced-motion`.
- Ljud är av; version 0.1 har inga ljudfiler.

Kontrast, läsbarhet på riktiga elevdatorer och praktiska flöden behöver fortsatt visuell och användarbaserad granskning. Ingen formell WCAG-certifiering påstås.
