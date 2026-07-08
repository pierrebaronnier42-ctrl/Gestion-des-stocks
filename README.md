# Gestion de Stock Web — version GitHub Pages + Supabase

Cette version est prévue pour être publiée sur GitHub Pages et synchronisée avec Supabase.

## Contenu

- Tableau de bord
- Inventaire
- Réceptions avec numérisation des bons de livraison et ticket température
- Commandes avec numérisation des bons de commande
- Fin de mois avec export CSV/PDF
- Produits actifs et archivés
- Zones de stockage avec plan de séquençage intégré
- Fournisseurs
- Paramètres avec changement de logo
- Synchronisation Supabase via la table `app_data`

## Configuration Supabase

Le fichier `supabase-config.js` contient déjà :

```js
window.SUPABASE_CONFIG = {
  url: "https://vrhidvzpeyccysmaphze.supabase.co",
  anonKey: "sb_publishable_XeWjiu4ZsrL1370HzLIufA_CAf0--X9"
};
```

## Table à créer dans Supabase

Dans Supabase, aller dans **SQL Editor**, puis exécuter :

```sql
create table if not exists app_data (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table app_data enable row level security;

drop policy if exists "app_data_select" on app_data;
drop policy if exists "app_data_insert" on app_data;
drop policy if exists "app_data_update" on app_data;

create policy "app_data_select"
on app_data for select
to anon
using (true);

create policy "app_data_insert"
on app_data for insert
to anon
with check (true);

create policy "app_data_update"
on app_data for update
to anon
using (true)
with check (true);
```

## Publication avec GitHub Pages

1. Aller dans le dépôt GitHub.
2. Envoyer tous les fichiers à la racine du dépôt.
3. Aller dans **Settings > Pages**.
4. Dans **Build and deployment**, choisir :
   - Source : **Deploy from a branch**
   - Branch : **main**
   - Folder : **/root**
5. Cliquer sur **Save**.
6. Le site sera disponible après quelques minutes à une adresse du type :

```text
https://pierrebaronnier42-ctrl.github.io/Gestion-de-Stock/
```

## Synchronisation

À l’ouverture du site, l’application tente de charger les données depuis Supabase.
À chaque modification, elle sauvegarde aussi localement puis envoie les données vers Supabase.

Dans **Paramètres**, deux boutons sont disponibles :

- **Charger depuis Supabase**
- **Envoyer vers Supabase**

## Sécurité

La clé utilisée est une clé publique `anon/publishable`.
Ne jamais mettre une clé `service_role` dans ce site.


## Si les boutons Supabase ne s'affichent pas

Cette version force le rafraîchissement du cache GitHub Pages. Après l'envoi sur GitHub, recharge la page avec `Ctrl + F5` sur ordinateur ou ferme/réouvre l'onglet sur téléphone. Les boutons visibles dans Paramètres doivent être :

- Charger depuis Supabase
- Envoyer vers Supabase
- Télécharger la sauvegarde JSON
- Exporter toutes les tables CSV

Si tu vois encore l'ancien texte “Les données sont stockées dans le navigateur”, c'est que l'ancien `app.js` est encore servi par le cache du navigateur ou que tous les fichiers du ZIP n'ont pas été remplacés dans GitHub.
