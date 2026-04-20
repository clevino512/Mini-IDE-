# Mini IDE

**Un mini environnement de développement (IDE) desktop** pour écrire et exécuter du code en Python, JavaScript et C.

Développé avec **Electron**, **React**, **TypeScript**, **Tailwind CSS v4** et **MongoDB**.

---

## 🎯 Objectif du projet

Créer une application desktop légère et moderne permettant aux développeurs débutants ou intermédiaires d’éditer, sauvegarder et **exécuter directement** leur code dans un seul outil, sans avoir à alterner entre plusieurs logiciels.

L’application intègre un éditeur de code avancé (Monaco), un terminal d’exécution et une persistance des fichiers récents via MongoDB.

---

## ✨ Fonctionnalités principales

- Éditeur de code puissant basé sur **Monaco Editor** (même moteur que VS Code)
- Support de **3 langages** : Python, JavaScript et C
- Exécution du code avec timeout de sécurité (10 secondes)
- Terminal intégré avec affichage coloré et horodatage
- Gestion des fichiers (Créer, Ouvrir, Sauvegarder)
- Historique des fichiers récents stocké dans MongoDB
- Interface moderne sombre inspirée de VS Code
- Raccourcis clavier (Ctrl+S, Ctrl+Enter, etc.)
- Layout redimensionnable (éditeur ↔ terminal)
- Support complet **TypeScript** avec mode strict

---

## 🛠️ Technologies utilisées

- **Electron** 28 — Framework desktop
- **React** 18 + **TypeScript** 5
- **Vite** — Outil de build ultra-rapide
- **Tailwind CSS v4** — Styling
- **Monaco Editor** — Éditeur de code
- **MongoDB + Mongoose** — Base de données
- **Node.js** — Exécution JavaScript et backend

---

## 📁 Structure du projet

```
mini-ide/
├── src/
│   ├── main/               # Processus principal Electron
│   ├── renderer/           # Interface React
│   │   ├── components/
│   │   ├── App.tsx
│   │   └── index.css
│   └── types/
├── backend/                # Serveur Express (optionnel)
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Installation et démarrage

### 1. Prérequis
- Node.js 18 ou supérieur
- MongoDB (local ou Docker)
- Node.js installés et dans le PATH (pour l’exécution du code)

### 2. Installation

```bash
# Cloner ou accéder au dossier du projet
cd mini-ide

# Installer les dépendances
npm install
```

### 3. Lancer MongoDB (recommandé avec Docker)

```bash
docker run -d -p 27017:27017 --name mini-ide-mongo mongo:latest
```

### 4. Lancer l’application en développement

```bash
npm run dev
```

L’application Electron se lancera automatiquement avec rechargement à chaud.

---

## 🎮 Utilisation

1. Cliquez sur **Nouveau** pour créer un fichier (Python, C ou JavaScript)
2. Écrivez votre code dans l’éditeur
3. Appuyez sur **Ctrl + Entrée** ou cliquez sur le bouton **▶ Exécuter**
4. Le résultat s’affiche dans le terminal intégré
5. Utilisez **Ctrl + S** pour sauvegarder le fichier

---

## 📊 Résultats obtenus

- Interface fluide et moderne avec animations
- Exécution fiable des 3 langages avec gestion des erreurs
- Persistance des fichiers récents via MongoDB
- Code propre, typé et bien structuré
- Application prête pour être packagée en exécutable

---

## 📋 Méthodologie suivie

- Analyse des besoins et choix des technologies
- Conception de l’architecture (Electron + React + IPC)
- Développement itératif (UI → fonctionnalités → exécution → persistance)
- Tests manuels sur différents langages
- Documentation complète (README, Architecture, Summary)

## Elements de réalisation de projet
figjam: UserFlow principal du projet 
Figma: Sert pour le design graphique  (https://www.figma.com/design/NFHER8VION0iIKJVQq9fsv/Mni-IDE?node-id=19-47&t=9q6DQH4OyL2wViCN-1)
Draw.io: utilisé pour la modèle de la base des donées  backend/docs/Mini_IDE_Database_Model.drawio.svg

---

## 👤 Auteur

- **Nom** : [RABENANTENAINA Clévin]
- **Année** : 2026

---

**Projet réalisé dans le cadre du cours de la préparation de la fin d'étude**

