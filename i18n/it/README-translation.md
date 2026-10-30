# Traduzione italiana — note per la revisione

Questa è una **bozza** della traduzione italiana del percorso di ingresso della documentazione.
Va rivista da un madrelingua prima del lancio.

## Cosa è tradotto

- `code.json`: home page, etichette dei componenti (Provalo dal vivo su Hub, Per sviluppatori,
  Requisiti:, tabella dei formati, visualizzatore interattivo) e testi del tema Docusaurus
  (ricerca, barra laterale, 404, ecc.).
- `docusaurus-theme-classic/navbar.json` e `footer.json`.
- `docusaurus-plugin-content-docs/current.json`: tutte le etichette delle categorie della barra
  laterale.
- Le 6 pagine di **Per iniziare** (`current/get-started/`) e la pagina indice della **Guida di
  Hub** (`current/hub-guide/index.mdx`).

Tutte le altre pagine si aprono in inglese (fallback di Docusaurus). I link delle pagine tradotte
puntano agli stessi percorsi dell'originale; i testi dei link sono in italiano anche quando la
pagina di destinazione è ancora in inglese.

## Regole di stile

- Forma "tu", imperativo nei passaggi ("Apri", "Fai clic su", "Trascina"), frasi brevi.
- Pubblico: geometri, agronomi, ispettori; niente gergo informatico se non serve.
- **Le etichette dell'interfaccia di Hub restano in inglese e in grassetto** (**Share/Embed**,
  **Upload**, **Files**, **Settings**…), perché Hub è solo in inglese. La prima volta che
  compaiono in una pagina hanno spesso una traduzione tra parentesi, per esempio
  **Settings** (Impostazioni).
- Nomi dei tipi di elemento (GeoImage, PointCloud, GaussianSplat…) in inglese: sono gli
  identificativi mostrati da Hub.
- Screenshot e video restano in inglese (condivisi da tutte le lingue).

## Glossario

| Inglese | Italiano | Note |
|---|---|---|
| dataset | dataset (m., invariabile: il dataset, i dataset) | |
| organization | organizzazione | personal organization → organizzazione personale |
| entry | elemento | prima occorrenza: "elemento (in Hub: *entry*)" |
| entry type | tipo di elemento | |
| build (nome e verbo) | **build** (invariato, femminile: "la build", "le build") | scelta del proprietario: resta in inglese come in Hub. "Hub esegue la build di…", "la build è completa". |
| processing | elaborazione | categoria "Elaborazione"; "file in elaborazione" |
| task | attività | prima occorrenza: "attività (in Hub: *task*)"; la scheda resta **Tasks** |
| visibility | visibilità | |
| Private / Unlisted / Public | **Private** (privato) / **Unlisted** (non in elenco) / **Public** (pubblico) | etichette UI in inglese, aggettivi in italiano nel testo e nei titoli dei link |
| upload | caricamento / caricare | |
| survey | rilievo | |
| surveyor | geometra / topografo | |
| orthophoto | ortofoto (f., invariabile) | |
| elevation model | modello di elevazione | |
| point cloud | nuvola di punti | |
| 3D model / textured model | modello 3D / modello texturizzato | "texturizzato" da verificare |
| Gaussian splat | splat gaussiano (pl. splat gaussiani) | |
| viewer | visualizzatore | Map viewer → Visualizzatore mappa |
| file browser | Esplora file | |
| share link | link di condivisione | etichetta UI **Share link** |
| embed | incorporare / mappa incorporata | |
| measurements | misure | |
| elevation profile | profilo altimetrico | |
| contour lines | curve di livello | |
| plant health | salute delle piante | |
| stockpile | cumulo | |
| colormap | scala di colori | |
| tagline | tagline (breve descrizione) | etichetta UI |
| slug | slug | |
| properties | proprietà | |
| self-hosting | Self-hosting | lasciato in inglese: pubblico tecnico, termine diffuso |
| Developers | Sviluppatori | |
| Get started | Per iniziare | |
| Hub guide | Guida di Hub | |
| Requires: | Requisiti: | |
| Try it live on Hub | Provalo dal vivo su Hub | |
| For developers | Per sviluppatori | |

## Da rivedere

- *build* resta in inglese (decisione del proprietario, 2026-10-30).
- **Self-hosting** non tradotto nel menu: valutare "Installazione sul tuo server".
- "Provalo dal vivo su Hub": alternativa "Prova subito su Hub".
- Le traduzioni tra parentesi delle etichette di Hub sono indicative (Hub non ha una versione
  italiana ufficiale): verificare che non creino confusione.
- In "Crea un account e il primo dataset" l'esempio `Quarry survey 2026` è diventato
  `Rilievo cava 2026` (e lo slug `rilievo-cava-2026`); lo screenshot mostra l'esempio inglese.
- Titoli dei link verso pagine non ancora tradotte: sono già in italiano e andranno allineati ai
  titoli definitivi quando quelle pagine saranno tradotte.
- Testi del tema Docusaurus (`theme.*` in `code.json`): rivisti rispetto alla traduzione di
  default, che aveva errori ("Briciole di pane", "Collassa", "Linguaggio").
- Frasi aggiunte rispetto all'originale inglese: in Concetti chiave una nota sull'interfaccia di
  Hub in inglese; nell'indice della Guida di Hub una nota sulle pagine non ancora tradotte.

## Link tra le pagine

Nelle pagine tradotte i link verso altre pagine usano il percorso dalla radice dei contenuti
(`/hub-guide/processing/builds.mdx`, `/reference/formats.mdx`), non `../`. Docusaurus risolve un
link `./` o `../` solo nella cartella del file: da `i18n/it/…` non trova le pagine non tradotte, e
da `docs/…` non trova le pagine tradotte, e la build si interrompe. Un percorso dalla radice viene
cercato prima nella cartella italiana e poi in `docs/`. I link `./pagina.mdx` tra pagine tradotte
della stessa cartella funzionano.
