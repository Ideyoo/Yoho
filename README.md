# nota.

Petits outils gratuits : calcul de moyenne, pourcentage, salaire brut / net, générateur de pseudo.

| Page | Dossier |
|---|---|
| Accueil | `index.html` |
| Moyenne (trimestre, brevet, bac) | `moyenne/` |
| Pourcentage | `pourcentage/` |
| Salaire brut / net | `salaire/` |
| Générateur de pseudo | `pseudo/` |
| Confidentialité | `confidentialite/` |

Fichiers communs : `assets/nota.css` (style), `assets/scene.js` (particules 3D), `assets/ads.js` (publicité).

## Mettre en ligne

Settings → Pages → Branch : `master`, dossier `/ (root)` → Save.
Le site est alors sur https://ideyoo.github.io/Yoho/

## Activer la publicité

1. Crée un compte sur https://adsense.google.com (18 ans minimum).
2. Une fois le site accepté, colle ton identifiant `ca-pub-…` dans `assets/ads.js`.
3. Mets la même info dans `ads.txt` (et enlève le `#`).
4. Dans AdSense, active le message de consentement aux cookies (« Confidentialité et messages »), obligatoire en Europe.
5. Remplace `[ton adresse e-mail]` dans `confidentialite/index.html`.
