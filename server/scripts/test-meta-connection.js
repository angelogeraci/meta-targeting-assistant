require('dotenv').config({ path: '../../.env' });
const { checkMetaAccessToken } = require('../services/meta');

async function testMetaConnection() {
  console.log('Vérification de la connexion à l\'API Meta...');
  
  // Vérifier si les variables d'environnement sont définies
  if (!process.env.META_ACCESS_TOKEN) {
    console.error('Erreur: META_ACCESS_TOKEN n\'est pas défini dans le fichier .env');
    return;
  }
  
  if (!process.env.META_AD_ACCOUNT_ID) {
    console.error('Erreur: META_AD_ACCOUNT_ID n\'est pas défini dans le fichier .env');
    console.log('Veuillez ajouter votre ID de compte publicitaire Facebook dans le fichier .env');
    return;
  }
  
  try {
    // Vérifier si le token d'accès est valide
    const isTokenValid = await checkMetaAccessToken();
    
    if (isTokenValid) {
      console.log('✅ Le token d\'accès Meta est valide et a les autorisations nécessaires');
    } else {
      console.log('❌ Le token d\'accès Meta n\'est pas valide ou n\'a pas les autorisations nécessaires');
      console.log('\nPour résoudre ce problème:');
      console.log('1. Assurez-vous que votre token d\'accès Meta est valide et n\'a pas expiré');
      console.log('2. Vérifiez que votre application Facebook a les autorisations ads_management ou ads_read');
      console.log('3. Assurez-vous que l\'utilisateur a accordé les autorisations ads_management ou ads_read à l\'application');
      console.log('4. Vérifiez que l\'ID du compte publicitaire (META_AD_ACCOUNT_ID) est correct');
    }
  } catch (error) {
    console.error('Erreur lors du test de connexion à l\'API Meta:', error.message);
  }
}

testMetaConnection(); 