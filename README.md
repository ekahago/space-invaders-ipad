# Space Shooter · Orbital Defense

Ett spel för iPad och dator, byggt med HTML, CSS, JavaScript och Canvas. Inga paket eller byggsteg behövs.

Spela: https://ekahago.github.io/space-invaders-ipad/

## Styrning

- iPad: håll inne vänster/höger och Skjut samtidigt.
- Dator: piltangenter eller A/D, mellanslag för skott, P/Esc för paus.
- Spelet pausas när fliken tappar fokus.
- Ljudeffekter startas med spelet. Musik väljs separat i kontrollpanelen.
- Rekord lagras lokalt i webbläsaren. Om lagring är blockerad fungerar spelet ändå.

## Version 3: fiender, bonusar och bossar

- Spejare rör sig snabbare i formationen. Bepansrade skepp tål två träffar. Dykare lämnar formationen och kan kollidera med spelaren.
- En bonus släpps efter var åttonde besegrad vanlig fiende. Bonusarna roterar mellan trippelskott (12 sekunder), skyddsbubbla (en träff eller 15 sekunder) och laser (7 sekunder).
- Bonuskapslar fångas med skeppet. Laser går igenom barriärerna. Trippelskott ersätter tillfälligt grundvapnets skottmönster.
- Moderskepp på våg 5, 10, 15 och så vidare. De börjar med riktade skott och byter till spridningsskott vid halvt liv. Bossens liv ökar för varje bossvåg.
- Avklarad våg ger poängbonus: 500 × våg om inga liv förlorades, annars 200 × våg. En kort paus före nästa våg ger tid att fånga kvarvarande kapslar.
- Färgtemat byts efter varje boss. Resultatskärmen visar poäng, rekord, nådd våg, fiender, bossar och bonusar.
- Bonusarnas tid räknas endast när spelet körs. Omstart återställer hela spelomgången och bevarar rekordet.

## Filer

- index.html: menyer, kontroller och poängtavla.
- styles.css: layout för iPad och dator.
- game.js: spellogik, kollisioner, styrning och rekord.
- rendering.js: skepp, fiender, stjärnor och partiklar.
- audio.js: lokalt genererade ljudeffekter och fyra musikloopar.

Spelet använder ett fast simulationssteg på 60 uppdateringar per sekund, oberoende av skärmens bildfrekvens. Animationer anpassas till inställningen för minskad rörelse.

## Utveckling och kontroll

Starta en lokal webbserver från projektmappen:

```sh
python3 -m http.server 8000
```

Öppna http://localhost:8000.

Kör regressionstester med Node.js:

```sh
node tests/game.test.cjs
```

Testerna kör spellogik och ljudhändelser med simulerade DOM- och Web Audio-objekt. De verifierar inte hur grafik eller ljud upplevs på en fysisk enhet.

