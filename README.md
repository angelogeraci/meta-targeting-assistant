# Meta Targeting Assistant

Application qui connecte les APIs de Meta et OpenAI pour générer des suggestions de critères de ciblage publicitaire par pays.

## Objectif

Cette application permet de :
- Sélectionner un pays cible
- Générer automatiquement des critères pertinents par catégorie via OpenAI
- Rechercher des intérêts de ciblage correspondants via l'API Marketing de Meta
- Calculer un score de similarité entre les critères proposés et les suggestions de Meta
- Exporter les résultats en CSV pour une utilisation ultérieure

## Fonctionnalités

- **Sélection de pays** : Choisissez le marché cible pour vos publicités
- **Génération de critères** : Obtenez des suggestions pertinentes via OpenAI par catégorie
- **Recherche d'intérêts Meta** : Connectez-vous à l'API Meta Marketing pour trouver les intérêts correspondants
- **Analyse de similarité** : Évaluez la pertinence des suggestions Meta par rapport aux critères originaux
- **Filtrage et tri** : Organisez les résultats pour identifier les meilleures correspondances
- **Export CSV** : Exportez les résultats pour les utiliser dans votre gestionnaire de publicités

## Captures d'écran

(Captures d'écran à venir)

## Prérequis

- Node.js v16+
- Compte développeur Meta avec accès à l'API Marketing
- Clé API OpenAI

## Installation

### 1. Cloner le repository

```bash
git clone https://github.com/angelogeraci/meta-targeting-assistant.git
cd meta-targeting-assistant
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet basé sur `.env.example` :

```bash
# Port du serveur
PORT=5000

# Configuration OpenAI
OPENAI_API_KEY=votre_cle_api_openai

# Configuration Meta
META_ACCESS_TOKEN=votre_token_acces_meta
META_APP_ID=votre_app_id_meta
META_APP_SECRET=votre_app_secret_meta

# Environnement
NODE_ENV=development
```

### 3. Installer les dépendances

```bash
# Installer les dépendances du serveur
npm install

# Installer les dépendances du client
cd client
npm install
cd ..
```

### 4. Démarrer l'application

```bash
# Démarrer l'application en mode développement (serveur + client)
npm run dev
```

L'application sera disponible à l'adresse : http://localhost:3000

## Structure du projet

```
├── client/               # Application frontend React
│   ├── public/           # Fichiers publics React
│   └── src/              # Code source React
│       ├── components/   # Composants React
│       └── services/     # Services API
├── server/               # Serveur backend Node.js
│   ├── routes/           # Routes API Express
│   └── services/         # Services (OpenAI, Meta API, similarité)
├── .env.example          # Exemple de variables d'environnement
└── package.json          # Configuration npm
```

## Obtenir les clés API requises

### Clé API OpenAI
1. Créez un compte sur [OpenAI](https://openai.com/)
2. Accédez à la section [API Keys](https://platform.openai.com/account/api-keys)
3. Créez une nouvelle clé API

### Configuration de l'API Meta Marketing
1. Créez un compte sur [Meta for Developers](https://developers.facebook.com/)
2. Créez une application dans la catégorie "Business"
3. Ajoutez le produit "Marketing API" à votre application
4. Générez un token d'accès avec les autorisations nécessaires

## Utilisation

1. Sélectionnez un pays dans le menu déroulant
2. Choisissez les catégories pour lesquelles vous souhaitez des suggestions
3. Cliquez sur "Rechercher des suggestions"
4. Attendez que les critères soient générés puis que les suggestions Meta soient récupérées
5. Explorez les résultats dans le tableau, utilisez les filtres et triez selon vos besoins
6. Exportez les résultats en CSV pour les utiliser dans vos campagnes publicitaires

## Licence

MIT

## Contributions

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.
