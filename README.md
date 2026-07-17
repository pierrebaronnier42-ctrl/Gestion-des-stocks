Version v1.48 - backups et points de restauration

# Gestion de Stock Web — version GitHub Pages + Supabase

Cette version est prévue pour être publiée sur GitHub Pages et synchronisée avec Supabase.

## Contenu

- Tableau de bord
- Inventaire
- Réceptions avec numérisation des bons de livraison et ticket température
- Commandes avec numérisation des bons de commande
- Fin de mois avec export CSV/PDF
- Produits actifs et archivés avec colonne Séquence liée au N° de tri Fin de mois
- Zones de stockage avec plan de séquençage intégré
- Fournisseurs
- Paramètres avec changement de logo
- Backups / points de restauration pour revenir à une sauvegarde précédente
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


## Version 1.28 — documents multipages

- Suppression des boutons **Données exemple** et **Réinitialiser** de l’en-tête.
- Suppression de la mention **Logiciel web local — prêt à héberger**.
- Les bons de commande et bons de livraison acceptent maintenant plusieurs pages.
- Sur téléphone, tu peux ajouter les pages une par une avec l’appareil photo.
- Depuis la galerie ou un ordinateur, plusieurs fichiers peuvent être sélectionnés en une seule fois.
- Chaque document affiche son nombre de pages et permet de supprimer une page individuellement.
- Le ticket température reste unique par livraison.

## Version 1.29 — ajout manuel et rognage

- Ajout manuel d’un bon de commande manquant à une date passée.
- Ajout manuel d’un BL ou ticket température manquant à une date passée.
- Bouton d’import multi-pages pour sélectionner plusieurs photos/fichiers en une seule fois.
- Conservation du bouton appareil photo pour ajouter une page rapidement.
- Ajout du rognage automatique et du rognage manuel sur les pages image.
- Suppression des icônes du menu de navigation.


## Version v5

- Ajout du scanner multiphoto : ouverture de l'appareil photo une seule fois, prise de plusieurs pages, puis validation du document complet.
- Les bons de commande et bons de livraison peuvent être scannés page par page sans fermer la caméra.
- Le ticket température reste un document unique.
- Cache GitHub Pages mis à jour en v1.30.


## Version v6

- Génération de PDF multipage pour les bons de commande et les bons de livraison numérisés.
- Bouton PDF dans les tableaux et dans la vue détail des documents.
- Rognage manuel corrigé avec aperçu du résultat avant enregistrement.
- Rognage automatique possible sur une page ou toutes les pages d’un document.


## Version v8

- Ajout du bloc « Ajouter un document manquant à une date » directement dans « Documents de livraison numérisés ».
- Permet d’ajouter un BL ou un ticket température sur une date passée depuis la section des documents.
- Mise à jour du cache GitHub Pages en v1.33.

## Version v9

Ajout d'une sous-page **Inventaire > Mise à jour des listes** :
- modifier indépendamment les listes Lundi / Mercredi / Vendredi et Général / Ultra frais / HUB ;
- changer rapidement les numéros d'ordre ;
- ajouter ou retirer un produit d'une liste sans impacter les autres jours ;
- copier-coller un bon de commande pour remplacer ou compléter une liste ;
- création automatique des nouvelles références inconnues ;
- alerte en cas de doublon de numéro d'ordre.


## Mise à jour des listes par photos
Dans Inventaire > Mise à jour des listes, choisir le jour/type puis utiliser « Scanner toutes les pages » ou « Importer plusieurs photos ». La reconnaissance OCR s'effectue dans le navigateur. Vérifier et corriger le résultat avant de remplacer la liste.


## Version 1.36
- Ajout de l’import PDF d’inventaire / bon de commande depuis la sous-page Inventaire > Mise à jour des listes.
- Analyse des références du PDF, mise à jour de l’ordre du bon de commande, détection des nouveaux produits, des références absentes, des changements probables de référence et des changements de conditionnement.
- Les nouveaux produits demandent une zone de stockage et un numéro de séquençage avant application.
- Les références sont utilisées comme clé interne mais ne sont plus affichées dans la liste de saisie d’inventaire.


## Version v12
- Saisie inventaire améliorée : la touche Suivant / Entrée passe directement à la quantité du produit suivant.
- Les champs Note optionnelle sont ignorés pendant l’avancement rapide.
- Cache GitHub Pages mis à jour en v1.37.


## Version 1.38
- Correction tablette : la touche Suivant dans la saisie d'inventaire passe directement à la quantité suivante et ignore la note optionnelle.


## Version v14

- Correction du déplacement manuel dans l'inventaire : après ↑/↓, la page reste centrée sur la ligne modifiée au lieu de remonter en haut.


## Version v15

- Correction mobile/tablette : le changement d'ordre dans l'inventaire conserve la position à l'écran au lieu de remonter en haut.
- Cache GitHub Pages : v1.41.


## Version v1.41

- Ajout de l’export PDF pour les inventaires.
- Ajout des cases Inventaire AVANT livraison / Inventaire APRÈS livraison.
- Le moment de l’inventaire est enregistré et visible dans l’historique/export.

## Version v1.43

- La catégorie produit est maintenant une liste fixe : HUB, Négatif, Positif, Sec.
- Dans Produits, la catégorie, la séquence et la zone principale sont modifiables directement dans la ligne.
- Le bouton Sauvegarder apparaît uniquement sur la ligne modifiée.
- La modification de séquence reste synchronisée avec Fin de mois et conserve l’alerte de doublon validable.
- Cache GitHub Pages mis à jour en v1.43.


## Version v1.45

- Catalogue produits adapté à l'affichage tablette et smartphone.
- Sur tablette, le tableau est compacté pour rentrer à la bonne échelle.
- Sur smartphone, les produits passent en cartes lisibles au lieu d'un grand tableau horizontal.
- Les listes déroulantes Catégorie / Zone principale et la séquence restent modifiables directement dans la ligne.
- Cache GitHub Pages mis à jour en v1.45.


## Version 1.45
- Archivage produit avec option de conservation uniquement dans la Fin de mois du mois en cours.
- Les produits archivés conservés restent visibles dans Fin de mois uniquement pour le mois sélectionné correspondant.
- Boutons dans Produits archivés pour ajouter ou retirer cette conservation temporaire.
- Export CSV/PDF Fin de mois indique les lignes archivées conservées ce mois.

## Version 1.46

- Ajout d'un taux de modification (%) par jour pour les commandes Général et Ultra frais.
- Ajout de la page Rapports après Fin de mois.
- Export PDF hebdomadaire avec les trois jours de livraison, les inventaires, les BC, les BL, les tickets température et les taux de modification.


## Version 1.49

- Remise en place des icônes dans le menu des pages.
- Ajout d’un écran de connexion par identifiant et mot de passe.
- Deux niveaux d’accès : `300 - Responsable` et `400 - Admin`.
- Nouvelle page `Gestion utilisateur` réservée au niveau `400 - Admin`.
- L’Admin peut créer, supprimer des utilisateurs et modifier leurs mots de passe.
- Au premier lancement sans utilisateur, le logiciel demande de créer le premier compte Admin.
