# RELIER — Site GitHub Pages V5 autonome

Cette version V5 est conçue pour remplacer définitivement l’ancien site et l’ancien espace documentaire Google.

## Principes de la V5

- site statique prêt pour GitHub Pages ;
- 25 conférences structurées ;
- 115 documents et supports archivés directement dans `documents/` ;
- aucun lien requis vers l’anciens services Google ;
- accès aux documents depuis les pages de conférence, le catalogue `documents/index.html`, la page Ressources et la navigation principale ;
- consultation dans le navigateur et téléchargement direct des fichiers ;
- aucune action d’import depuis un stockage externe.

## Publication

1. Décompresser le ZIP à la racine du dépôt GitHub.
2. Commit / push de l’ensemble des fichiers, y compris `documents/`.
3. Dans **Settings → Pages**, publier depuis la branche principale et la racine du dépôt.
4. Le fichier `.nojekyll` est déjà inclus.

## Contrôle avant suppression des anciennes sources

La V5 inclut un contrôle automatique lors de sa génération : les 115 fichiers du manifeste doivent exister localement, aucun lien vers les domaines de l’ancien site ou de l’ancien espace documentaire ne doit subsister, et les liens internes du site sont vérifiés.
