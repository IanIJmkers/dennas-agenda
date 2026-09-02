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

**Hoeveel past er leesbaar op?** Tot ongeveer acht beurzen loopt de lijst over de volle
breedte en is de tekst op zijn grootst. Daarboven splitst hij in twee kolommen en wordt
elke extra beurs door alle regels betaald. Rond de twintig is de tekst te klein om nog
van een afstandje te lezen — dat is geen fout in de kaart, dat is wat er gebeurt als er
te veel op één vlak moet. Gebruik dan de 2-maandenkaart voor wat er echt aankomt en de
volledige agenda als overzicht.

---

## Voor de klant — hoe het werkt

**Tekst aanpassen** → klik op de kaart zelf. Koppen, plaatsnamen, de regel onderaan:
alles waar je overheen gaat met de muis krijgt een streepje en is te typen.

**Beurzen toevoegen of wijzigen** → in de kolom rechts. Vul naam, plaats en datum in.
De **weekdag en de volgorde komen uit de datum** — die hoef je niet zelf te typen en
ze kunnen dus ook niet meer botsen met elkaar. Een einddatum vul je alleen in bij een
beurs van twee dagen; dan wordt het vanzelf `26–27.09` en `ZA–ZO`.

**Plaats nog niet bekend?** Laat `‹STAD›` staan. Dat drukt rood af en de kolom rechts
blijft het melden, zodat er nooit een verzonnen plaatsnaam op de kaart komt.

**Klaar** → *PNG downloaden*. Dat bestand is precies 1080 × 1920 (of 1080 × 1350 op
4:5) en kan zo op Instagram. *PDF / print* geeft dezelfde kaart als pdf.

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
# dennas-agenda
