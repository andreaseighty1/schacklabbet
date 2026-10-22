/** User-supplied 43-move game, used to calibrate the lower opponent levels. */
export const easyFeedbackMoves = `
g2g3 e7e6 f1g2 c7c5 b1c3 d7d5 c3b1 g7g6
b2b3 g8f6 c1b2 d8e7 g1h3 b8c6 h3g5 f8h6
g5h3 e8g8 e1g1 f8e8 a2a4 c8d7 a1a3 a8b8
d2d3 b8c8 f2f4 c8d8 a4a5 d7c8 a3a4 b7b5
a4a3 b5b4 a3a2 e6e5 f4e5 h6e3 g1h1 c6e5
b2e5 e7e5 a2a4 c8d7 d1e1 e5e7 f1f3 f6g4
a5a6 d7a4 b3a4 e3h6 e2e3 g4e3 h3f2 h6g5
h2h3 d8d6 b1d2 d6e6 h3h4 e3f5 h4g5 e6e1
h1h2 f5e3 g2h3 e3c2 d2b3 e7g5 b3c5 g5c1
h3d7 e8e3 f3f6 e3e5 f6c6 e1h1 f2h1 e5e2
h2h3 c1h1 h3g4 h1h5 g4f4 e2f2
`
  .trim()
  .split(/\s+/);
