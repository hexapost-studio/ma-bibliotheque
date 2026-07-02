# Ma Bibliothèque 📚

Bibliothèque personnelle **en ligne** : visualise les livres que tu possèdes et ceux que tu souhaites, explore les ouvrages de référence par domaine, suis les tendances, garde un œil sur les prix, et découvre **ce qui est consultable gratuitement** — et dans quels formats (EPUB, Kindle, PDF, audio, lecture en ligne…).

Le projet part d'une maquette de mur de livres et d'un export de liste de souhaits Amazon, transformés en application web réelle et déployable.

## Fonctionnalités

- **3 vues de bibliothèque** — Mur (vignettes), Étagères (regroupées par domaine, façon bibliothèque physique), Liste (détaillée). Recherche plein texte, filtres par statut et par domaine.
- **Souhaits & possession** — chaque livre a un statut : *À acheter*, *En cours*, *Lu*, *Possédé*. Les souhaits apparaissent grisés sur le mur. Note personnelle sur 5 étoiles.
- **Références par domaine** (page *Tendances*) — les ouvrages incontournables classés par champ de connaissance (Philosophie, Développement personnel, Business & Finance, Science, Histoire, Psychologie, Fiction, SF, Spiritualité, Informatique…).
- **Tendances du moment** — sélection d'incontournables à lire en priorité.
- **Suivi des prix** (page *Suivi des prix*) — historique de prix par livre (sparkline), plus bas observé, meilleures baisses, et **alertes de prix** personnalisables (prix cible).
- **Consultation gratuite & formats** — pour chaque livre, l'app interroge en direct des sources ouvertes et affiche les versions libres disponibles :
  - **Project Gutenberg** (via Gutendex) — EPUB, Kindle/MOBI, HTML, TXT pour le domaine public.
  - **Open Library / Internet Archive** — lecture en ligne ou emprunt gratuit.
  - **LibriVox** — livres audio libres.
  - Sinon : liens d'achat (Amazon, Fnac), Audible et résumé YouTube.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** (styles majoritairement inline pour l'esthétique « bibliothèque »)
- Couvertures : **Open Library Covers API** (par ISBN)
- Persistance locale : **localStorage** (statuts, notes, alertes) — aucune base de données, aucun secret. Une synchro multi-appareils (Supabase) est possible en évolution.
- Enrichissement dispo gratuite : route serveur `GET /api/availability` (Gutendex, Open Library, LibriVox), mise en cache 24 h.

## Démarrer en local

```bash
npm install
npm run dev
# http://localhost:3000
```

Build de production :

```bash
npm run build && npm run start
```

## Déploiement

Prêt pour **Vercel** (repo public, zéro variable d'environnement requise) :

1. Importer le dépôt sur [vercel.com/new](https://vercel.com/new).
2. Déployer — aucune configuration nécessaire.

La route `/api/availability` s'exécute côté serveur (fonction Vercel) et met en cache les réponses des API publiques.

## Données

Le catalogue de référence (`src/data/books.ts`) est généré par `scripts/gen_books.py` : ~38 titres répartis en 11 domaines, avec ISBN réels (pour les couvertures et la recherche de disponibilité) et un historique de prix déterministe.

### Prix réels (évolution)

L'historique de prix est initialisé au catalogue. Pour rafraîchir des prix réels et déclencher les alertes, brancher un job planifié (Vercel Cron / GitHub Action) qui met à jour `priceHistory` — l'architecture est prête pour ça.

## Origine

- Maquette d'origine : mur/étagères de livres (runtime « x-dc »).
- Liste de souhaits Amazon (export *printview*) → concept d'import de wishlist et livre *A Concise Encyclopedia of the Original Literature of Esperanto* inclus dans le catalogue.

---

*Bibliothèque personnelle — open source.*
