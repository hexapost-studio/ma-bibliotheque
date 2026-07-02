# Ma Bibliothèque 📚

Bibliothèque personnelle **en ligne** : visualise les livres que tu possèdes et ceux que tu souhaites, explore les ouvrages de référence par domaine, suis les tendances, garde un œil sur les prix, et découvre **ce qui est consultable gratuitement** — et dans quels formats (EPUB, Kindle, PDF, audio, lecture en ligne…).

Le projet part d'une maquette de mur de livres et d'un export de liste de souhaits Amazon, transformés en application web réelle et déployable.

## Fonctionnalités

- **3 vues de bibliothèque** — Mur (vignettes), Étagères (regroupées par domaine, façon bibliothèque physique), Liste (détaillée). Recherche plein texte, filtres par statut et par domaine.
- **Souhaits & possession** — chaque livre a un statut : *À acheter*, *En cours*, *Lu*, *Possédé*. Les souhaits apparaissent grisés sur le mur. Note personnelle sur 5 étoiles.
- **Références par domaine** (page *Tendances*) — les ouvrages incontournables classés par champ de connaissance (Philosophie, Développement personnel, Business & Finance, Science, Histoire, Psychologie, Fiction, SF, Spiritualité, Informatique…).
- **Tendances du moment** — sélection d'incontournables à lire en priorité.
- **Suivi des prix** (page *Suivi des prix*) — historique de prix par livre (sparkline), plus bas observé, meilleures baisses, et **alertes de prix** personnalisables (prix cible). Tu peux **relever un prix réel** depuis la fiche d'un livre (« Relever le prix du jour ») : l'historique se construit avec de vraies valeurs datées et déclenche tes alertes.
- **Sauvegarde** (page *Importer*) — exporte toute ta bibliothèque en JSON et restaure-la sur un autre appareil (aucune donnée n'étant côté serveur, c'est ta sauvegarde).
- **Consultation gratuite & formats** — pour chaque livre, l'app interroge en direct des sources ouvertes et affiche les versions libres disponibles :
  - **Project Gutenberg** (via Gutendex) — EPUB, Kindle/MOBI, HTML, TXT pour le domaine public.
  - **Open Library / Internet Archive** — lecture en ligne ou emprunt gratuit.
  - **LibriVox** — livres audio libres.
  - Sinon : liens d'achat (Amazon, Fnac), Audible et résumé YouTube.
- **Import universel** (page *Importer*) — colle une liste depuis **n'importe quelle source** : liste de souhaits Amazon (« Titre by Auteur »), Google Livres, export **Goodreads** (CSV), ou une liste tapée à la main. Un **ISBN seul suffit** : le titre et l'auteur sont retrouvés automatiquement via Open Library. Ajout manuel également disponible. → l'app n'est pas figée sur un catalogue, elle s'adapte à la bibliothèque de chacun.

## Confidentialité

- **Aucune donnée personnelle** dans le dépôt (public) : ni compte, ni e-mail, ni identifiant de liste de souhaits.
- **Tout est stocké en local** dans le navigateur (`localStorage`) : livres importés, statuts, notes, alertes. Rien n'est envoyé à un serveur applicatif.
- Les seuls appels réseau sont des lectures d'API **publiques et anonymes** (Open Library, Gutendex, LibriVox) pour enrichir métadonnées, couvertures et disponibilité.
- Le catalogue de départ est un **exemple** générique, entièrement remplaçable par ta propre liste.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** (styles majoritairement inline pour l'esthétique « bibliothèque »)
- Couvertures : **Open Library Covers API** (par ISBN)
- Persistance locale : **localStorage** (statuts, notes, alertes) — aucune base de données, aucun secret. Une synchro multi-appareils (Supabase) est possible en évolution.
- Enrichissement dispo gratuite : route serveur `GET /api/availability` (Gutendex, Open Library, LibriVox), mise en cache 24 h.
- Enrichissement import : route serveur `GET /api/lookup` (Open Library, par ISBN ou titre).
- Tests : **Vitest** (`npm test`) sur le parseur d'import (`src/lib/import.ts`).

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

### Prix réels

Deux niveaux :
1. **Manuel (dispo)** — relève le prix constaté depuis la fiche d'un livre ; il est daté, stocké en local et alimente le graphe + les alertes.
2. **Automatique (évolution)** — un rafraîchissement automatique nécessiterait un stockage serveur (les données sont aujourd'hui 100 % locales) et une source de prix ; il n'existe pas d'API de prix gratuite et fiable sans clé (Google Books est plafonné et la plupart des titres sont `NOT_FOR_SALE`). À brancher avec une base (Supabase) + un job planifié le jour où une synchro multi-appareils est ajoutée.

## Origine

- Maquette d'origine : mur/étagères de livres (runtime « x-dc »).
- Liste de souhaits Amazon (export *printview*) → concept d'import de wishlist et livre *A Concise Encyclopedia of the Original Literature of Esperanto* inclus dans le catalogue.

---

*Bibliothèque personnelle — open source.*
