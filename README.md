# Space Shooter · Orbital Defense

Ett spel för iPad och dator, byggt med HTML, CSS, JavaScript och Canvas utan byggsteg.

**Spela version 3.2.1:** https://ekahago.github.io/space-invaders-ipad/

Tidigare tester (behållna):
- Test 1, nya formationer och hastighet: https://ekahago.github.io/space-invaders-ipad/playtest/
- Test 2, vapenförråd och nya vapen: https://ekahago.github.io/space-invaders-ipad/playtest2/

## Nytt i 3.2.1

- Tydliga, klickbara vapenrutor ovanför spelplanen: aktivt vapen markeras, ammunition visas och låsta vapen är nedtonade. Välj även med tryck på iPad; E/↻ och 1–5 finns kvar.
- Separat varningsljud varje gång ett skepp förloras. Skyddsbubblan har fortsatt ett annat ljud. Ljudet följer knappen Ljudeffekter på/av.

## Tidigare i 3.2.0

- Vågor med klassisk formation, sicksack, två flottor, överlevnad i 25 sekunder samt boss var femte nivå.
- Hastigheten ökar inte vidare efter ungefär nivå 8; variation ersätter allt högre hastighet.
- Vapenförråd med trippelskott, laser, målsökande robotar och energibomber. Vapen och ammunition sparas mellan vågorna; ny spelomgång nollställer förrådet.
- Tryck ↻ på iPad eller E på dator för att byta vapen. Välj direkt med 1–5 på dator.
- PC: större responsiv spelruta, upp till 1200 pixlar bred i stället för 800 när skärmen medger det. Interna spelkoordinater och 4:3-formatet är oförändrade; iPad-layouten bibehålls.

## Styrning

- iPad: vänster/höger och Skjut kan hållas samtidigt; ↻ byter vapen.
- Dator: piltangenter eller A/D, mellanslag för skott, E eller 1–5 för vapen, P/Esc för paus.
- Spelet pausas när fliken tappar fokus.
- Rekord lagras lokalt i webbläsaren. Musik styrs separat i kontrollpanelen.

## Filer och test

- index.html: spelets menyer, HUD och kontroller.
- styles.css: responsiv layout för iPad och PC.
- game.js: vågor, rörelse, kollisioner, arsenal och styrning.
- rendering.js: Canvas-grafik och effekter.
- audio.js: lokalt genererade ljudeffekter och musik.
- version.json: version och releasetid.

Simuleringen använder ett fast steg på 60 uppdateringar per sekund.

Starta med `python3 -m http.server 8000` och öppna http://localhost:8000.
Kör `node tests/game.test.cjs` och `python3 scripts/release.py --check` före publicering.
Automatiserade tester ersätter inte visuella kontroller på PC eller iPad.
