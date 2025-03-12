/**
 * Instructions pour obtenir un token d'accès Meta avec les autorisations nécessaires
 * 
 * Ce script n'exécute pas de code, mais fournit des instructions détaillées pour obtenir
 * un token d'accès Meta valide avec les autorisations ads_management ou ads_read.
 */

console.log(`
=======================================================================
  INSTRUCTIONS POUR OBTENIR UN TOKEN D'ACCÈS META AVEC LES AUTORISATIONS NÉCESSAIRES
=======================================================================

Pour résoudre les erreurs "Ad account owner has NOT grant ads_management or ads_read permission",
vous devez obtenir un token d'accès avec les autorisations appropriées. Voici comment faire:

1. Accédez au Meta for Developers (https://developers.facebook.com/)

2. Créez ou utilisez une application existante:
   - Si vous n'avez pas d'application, créez-en une nouvelle
   - Choisissez "Business" comme type d'application

3. Configurez les autorisations de l'application:
   - Dans le tableau de bord de l'application, allez dans "App Settings" > "Advanced"
   - Sous "Permissions", ajoutez les autorisations suivantes:
     * ads_management (pour un accès complet)
     * ads_read (pour un accès en lecture seule)

4. Obtenez un token d'accès utilisateur:
   - Allez dans "Tools" > "Graph API Explorer"
   - Sélectionnez votre application dans le menu déroulant
   - Cliquez sur "Generate Access Token"
   - Assurez-vous de sélectionner les autorisations "ads_management" ou "ads_read"
   - Cliquez sur "Generate Access Token" et suivez les instructions

5. Obtenez un token d'accès de longue durée (optionnel mais recommandé):
   - Les tokens d'accès utilisateur expirent après quelques heures
   - Pour obtenir un token de longue durée (60 jours), utilisez l'endpoint:
     https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN

6. Obtenez l'ID de votre compte publicitaire:
   - Allez sur Facebook Business Manager (https://business.facebook.com/)
   - Accédez à "Gestionnaire de publicités"
   - L'ID de votre compte publicitaire est affiché dans l'URL sous la forme "act_XXXXXXXXXX"
   - Copiez cet ID (avec ou sans le préfixe "act_")

7. Mettez à jour votre fichier .env:
   - Remplacez la valeur de META_ACCESS_TOKEN par votre nouveau token
   - Ajoutez votre ID de compte publicitaire à META_AD_ACCOUNT_ID

8. Testez la connexion:
   - Exécutez le script de test: node server/scripts/test-meta-connection.js

REMARQUE: Les tokens d'accès de longue durée expirent après 60 jours. Vous devrez
renouveler votre token avant son expiration.
`); 