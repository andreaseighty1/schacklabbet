# Källkod för Stockfish.js 19.0.1

Dessa filer följer med varje webbpublicering. Motorn är GPL-3.0 och dess fullständiga licenstext finns i `../engine/COPYING.txt`.

- `stockfish-js-19.0.1-source.tar.gz`: GitHub-källarkivet för taggen `v19.0.1`, taggobjekt `8d9ca57043594a8fa6ae0b73fb685d9105bf51df`. Innehåller C++, Emscripten-stöd, buildskript, AUTHORS och licens.
- `nn-61e7af4bb97d.nnue`: det officiella lite-nätverket som behövs för att bygga motsvarande motor.

SHA-256:

```text
990a305ec413c84cf7ea0baa3726b90b2efa9efed02de02a9895b50ecc6c0607  stockfish-js-19.0.1-source.tar.gz
61e7af4bb97d51eeeb25d322916f86513b5cd3a827ce189c98c6e31946f99e5b  nn-61e7af4bb97d.nnue
```

För ombyggnad: packa upp arkivet, installera Node.js och Emscripten **6.0.9**, och läs arkivets README. Lägg nätverksfilen i den sökväg buildskriptet anger och kör:

```sh
node build.js --single-threaded --lite -f
```

Upstreams byggskript kan också hämta nätverket. Motorns binärer i Schacklabbet är oförändrade från `stockfish@19.0.1`. Ingen ändring av motor eller nätverk har gjorts. Ombyggnad har inte utförts under utvecklingen av Schacklabbet.

Ursprung: <https://github.com/nmrugg/stockfish.js/tree/v19.0.1> och <https://tests.stockfishchess.org/api/nn/nn-61e7af4bb97d.nnue>.
