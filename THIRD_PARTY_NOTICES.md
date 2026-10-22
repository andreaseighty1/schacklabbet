# Tredjepartsmaterial

## Stockfish.js 19.0.1

Stockfish.js © 2026 Chess.com, LLC. Baserat på Stockfish av T. Romstad, M. Costalba, J. Kiiski, G. Linscott och övriga bidragsgivare. Lite-nätverk av Chris Bao (sscg13).

- Motorlicens: **GNU GPL version 3**.
- Ursprung: <https://github.com/nmrugg/stockfish.js/tree/v19.0.1>.
- Oförändrade binärer: npm-paketet `stockfish@19.0.1`, låst i `package-lock.json`.
- Distribuerade filer: `engine/stockfish-19-lite-single.js` och `.wasm` samt `engine/COPYING.txt` och `engine/SOURCE.txt`.
- Motsvarande källkod, buildskript och upstream-meddelanden: `licenses/stockfish-js-19.0.1-source.tar.gz`.
- Nätverksfil för ombyggnad: `licenses/nn-61e7af4bb97d.nnue`, även från <https://tests.stockfishchess.org/api/nn/nn-61e7af4bb97d.nnue>.

Källkod och nätverk distribueras på samma webbplats som motorn, utan inloggning och utan extra kostnad. UI:ns hjälpdialog länkar dit. Förändras motorversionen måste både källarkiv, nätverk, licenstext och kontrollsummor uppdateras. Se `public/licenses/README.md` för ombyggnad.

## Övriga bibliotek

- React och React DOM: Meta Platforms, MIT.
- chess.js: Jeff Hlywa och bidragsgivare, BSD-2-Clause.
- Lucide: Lucide-bidragsgivare, ISC.
- Supabase JavaScript-klient: Supabase och bidragsgivare, MIT.
- Licenstexter för Supabase-klienten och dess Iceberg-beroende distribueras i `public/licenses/supabase-MIT.txt` och `public/licenses/iceberg-js-LICENSE.txt`.
- PGlite: Electric DB Limited, Apache-2.0; används bara för databasprov under utveckling/CI, distribueras inte i webbspelet.
- Vite, Vitest, TypeScript, Playwright, ESLint och Prettier används som utvecklingsverktyg enligt respektive upstream-licens.

Den kompletta npm-beroendelistan med exakta versioner finns i `package-lock.json`. Motorfilerna ändras inte och behåller sina ursprungliga upphovsrättsmeddelanden.
