# Agenda-editor — Denna's Trading

Twee bewerkbare kaarten voor Instagram, in de huisstijl:

| Pagina | Wat het is |
|---|---|
| `agenda.html` | De volledige agenda — alle beurzen, twee kolommen, jaarbalk waar het jaar wisselt |
| `snapshot.html` | Twee maanden, veel groter gezet — de kaart om te posten als er een beurs aankomt |
| `index.html` | Startpagina met een link naar allebei |

Beide kaarten lezen **dezelfde lijst met beurzen**. Wat je bij de één invult, staat
meteen goed bij de ander — er is dus maar één agenda om bij te houden.

## Formaat: 9:16 of 4:5

Rechtsboven staat een schakelaar. **9:16 (1080 × 1920) is de standaard** — dat is het
story-formaat, en het is het enige formaat waar én het logo groot en centraal kan staan
én de datums groot genoeg zijn om van een afstandje te lezen. **4:5 (1080 × 1350)** is
er voor het gewone feed-bericht; daar is 570 pixels minder hoogte, dus bij een volle
agenda wordt de tekst kleiner. De kolom rechts zegt het als dat gebeurt.

**Hoeveel past er leesbaar op?** De kaart kiest zelf de vorm die de tekst het
grootst zet — één kolom over de volle breedte, of twee kolommen naast elkaar — en
meet daarvoor de echte namen. Bij een drukke agenda geeft de kop bovendien ruimte
terug: het logo en het woord AGENDA krimpen mee zodat de lijst kan blijven ademen.

Wat dat concreet oplevert, gemeten in de browser:

| Wat erop staat | Datum | Naam | Plaats |
|---|---|---|---|
| 4 beurzen in 2 maanden | 60 px | 43 px | 26 px |
| **elke week een beurs (10 in 2 maanden)** | **50 px** | **39 px** | **22 px** |
| 15 beurzen, hele agenda | 47 px | 36 px | 21 px |
| 26 beurzen, hele agenda | 28 px | 22 px | 12 px |

Rond de 26 beurzen is het te klein om nog van een afstandje te lezen. Dat is geen
fout in de kaart — dat is wat er gebeurt als er te veel op één vlak moet. Gebruik dan
de 2-maandenkaart voor wat er echt aankomt, en de volledige agenda als naslag.

---

## Voor de klant — hoe het werkt

De kolom rechts heeft drie tabbladen. Er zit nooit iets meer dan één klik diep.

**BEURZEN** — de lijst. Elke beurs is een kaartje met een nummer, de weekdag en de
datum bovenaan, en velden die zeggen wat erin hoort: *Naam van de beurs*, *Plaats*,
*Datum*, en *T/m* (alleen invullen bij een beurs van twee dagen). De volgorde en de
weekdag komen uit de datum — die typ je dus niet zelf en ze kunnen ook niet meer
tegenstrijdig worden. Met ✕ verwijder je er één, onderaan voeg je er één toe.
Klik een beurs op de kaart en hij opent hier.

**KLEUREN** — elk onderdeel van de kaart heeft zijn eigen kleur: de achtergrond, het
golfpatroon, de cirkel achter het logo, elke kop, elke lijn, de datum, de naam, de
plaats, de weekdag, de voettekst en de QR. Je kunt een kleur kiezen met het blokje of
de hexcode intypen. Met ↺ zet je er één terug op de huisstijl, onderaan alle 26 in
één keer.

> Weet je niet welk onderdeel een regel is? **Ga er met de muis overheen** — dan
> licht op de kaart precies op wat die kleur verft. "Balklijn" zegt niets tot je de
> lijn ziet oplichten.

**TEKST** — de vaste teksten (bovenregel, kop, slotregel, uitleg, Instagram-naam,
regio) en de link achter de QR. Diezelfde teksten kun je ook gewoon op de kaart
aanklikken en typen; wat je overheen gaat met de muis krijgt een streepje.

### Wat er gecontroleerd wordt

Onderaan elk tabblad staat **Controle**. Er wordt niets verboden — er wordt gemeten,
en je krijgt het te zien zodra een keuze de kaart onleesbaar maakt:

- **tekst tegen de achtergrond onder 4,5:1**, met de gemeten verhouding per onderdeel.
  Dat is dezelfde eis die voor het drukwerk geldt.
- **de QR** moet donker-op-licht blijven. Draai je hem om, dan scant hij niet meer;
  dat is geen stijlkeuze maar een code die het niet doet.
- **het logo** is een aangeleverd bestand in donkerblauwe inkt en wordt niet hertint.
  Zet je de kaart donker, dan zegt de controle dat je daar een lichte versie van het
  logo voor nodig hebt.
- **plaats nog niet bekend?** Laat `‹STAD›` staan. Dat drukt rood af en blijft gemeld,
  zodat er nooit een verzonnen plaatsnaam op de kaart komt.

Kleuren en teksten gelden voor **beide kaarten** en gaan mee in *Opslaan* en
*Deel link*.

### Waar je werk blijft staan

In de browser van de computer waar je op werkt — er is geen inlog en geen server.
Dat betekent:

- **Opslaan** geeft je een bestand (`dennas-agenda.json`) dat je kunt bewaren of mailen.
- **Openen** leest zo'n bestand weer in.
- **Deel link** kopieert een link met de hele agenda erin. Wie die opent, ziet jouw
  versie — handig om even mee te kijken of om op een andere computer verder te werken.
- **Herstel** zet alles terug naar de oorspronkelijke agenda.

Werk je op een andere computer of wis je je browsergegevens, dan is de laatste versie
weg tenzij je hem hebt opgeslagen of de link hebt bewaard.

---

## Voor de ontwikkelaar

Statische site: geen build, geen backend, geen dependencies die tijdens het bekijken
van buitenaf geladen worden. De QR-encoder en de PNG-schrijver staan lokaal in
`js/vendor/`, de fonts in `fonts/`. Dat is bewust — een kaart die op een beurs
gemaakt wordt moet het ook doen op een matige verbinding, en er lekt zo niets naar
een CDN.

```
site/
  index.html  agenda.html  snapshot.html
  css/system.css     de huisstijl (palet, type, dieptevlakken) — port van src/system.css
  css/editor.css     alleen het gereedschap; komt nooit in een export
  js/brand.js        motieven, logo-lockup, QR — port van src/motifs.mjs + logo.mjs + qr.mjs
  js/store.js        de beurzen, datumafleiding, opslag, import/export
  js/card.js         alles wat getekend wordt: formaten, kop, regel, balk, voet
  js/editor.js       schalen, typen, exporteren
  js/panel.js        de kolom rechts
  js/agenda.js       kaart 1 — alleen de kolomindeling
  js/snapshot.js     kaart 2 — alleen het maandvenster
```

Alle tekstgroottes in `card.js` zijn een **fractie van de regelhoogte**, niet een vast
getal met een schaalfactor erover. Daardoor kan een regel nooit groter worden dan de
ruimte die hij heeft — en betekent "grotere letters" hetzelfde als "minder beurzen op
één kaart", wat ook echt de afweging is.

Geen enkele kleur staat hard in `card.js`. `Card.useTheme(state)` wordt één keer aan
het begin van een tekening aangeroepen; daarna leest alles uit `T`. Een nieuw
kleurbaar onderdeel toevoegen is dus: een sleutel in `store.js` erbij, `T.<sleutel>`
gebruiken waar je hem tekent, en een regel in `GROUPS` in `panel.js`.

### Deployen naar Vercel

Twee manieren, allebei zonder build:

1. **Alleen deze map.** `cd site && vercel` — of in Vercel de *Root Directory* op
   `site` zetten. Niets verder in te stellen.
2. **De hele repo.** De `vercel.json` in de root wijst `outputDirectory` naar `site`,
   dus `vercel` vanaf de root werkt ook.

`cleanUrls` staat aan, dus `/agenda` en `/snapshot` werken naast `/agenda.html`.

### Wat gecontroleerd is

- Export komt er exact op het gekozen formaat uit (1080 × 1920 of 1080 × 1350),
  ongeacht de vensterbreedte.
- De QR in de geëxporteerde PNG is **gedecodeerd** en levert de ingestelde link op —
  ook nadat de link is aangepast. Bij 29 modules (de standaardlink) is dat de
  grofste en dus best scanbare variant; houd de link kort.
- 6, 15 en 26 beurzen, in beide formaten: bij elk aantal past alles binnen de
  voetregel. De regelhoogte en de tekstgrootte bewegen mee, zodat lijnen nooit door
  tekst lopen.
- Een weekend dat over de maandgrens loopt (31.10–01.11) valt niet uit de
  2-maandenkaart.
- Niets uit het gereedschap komt in de export, ook niet als de muis op een veld staat.
- Kleuren: alle 26 onderdelen komen door in beide kaarten en in de export; *Herstel
  huisstijlkleuren* levert exact de originele waarden terug; en een omgekeerde QR,
  te lage tekstcontrast en een donkere achtergrond onder het logo worden alle drie
  gemeld met de gemeten verhouding erbij. Een donker thema is uitgeprobeerd en de QR
  daaruit is gedecodeerd.
