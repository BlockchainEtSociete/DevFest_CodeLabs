# Blockchain & Société CodeLabs

## Table des matières
- [Projet](#blockchain--société-codelabs)
  - [Table des matières](#table-des-matières)
  - [Présentation](#presentation)
  - [Structure](#structure)
  - [Installation](#installation)
    - [Outils](#outils)
    - [Front](#front)
    - [Blockchain](#blockchain)
    - [Wallets API](#wallets-api)

<a name="presentation"></a>
## Présentation
Ce projet à été créer dans le but d'une démonstration d'un cas d'usage de la blockchain,
dans le cadre d'un atelier codeLabs du DevFest Nantes 2023.

Le projet à pour but de récompenser en NFT les gagnants des compétitions à l'issue d'un vote, 
pour chaque compétition une liste de jury sont selectionné, un jury est unique et est identifié 
par un SBT.

### Synopsis
Le Festival du Cinéma du DevFest a une renommée internationale et récompense les meilleures œuvres cinématographiques de la communauté des développeurs.
Les organisateurs du festival ont émis le souhait de moderniser le processus de récompense en utilisant la technologie des NFT. Votre mission,
si vous l'acceptez, est de réaliser cette application en permettant aux organisateurs de sélectionner les films nominés,
de définir les membres du jury, d'organiser des votes par le jury et de remettre les prix aux lauréats.

<a name="structure"></a>
## Structure
```
front (Front UI)
|
+-- public (static files)
|
+-- src (React sources)

blockchain (Smart Contract)
|
+-- contracts (Solidity source file of the smart contract)
|
+-- deploy (Deployment script)
|
+-- test (Unit tests)
```

<a name="installation"></a>
## Installation
Cloner le projet :
```bash 
$ git clone https://github.com/BlockchainEtSociete/DevFest_CodeLabs.git
```

<a name="outils"></a>
### Outils
- [Node.js 18](https://nodejs.org/fr/download)
- [Ganache](https://trufflesuite.com/ganache/)
```json
Aller sur l'engrenage puis server !
Configuration :
  - Hostname : 127.0.0.1
  - Port: 7545
  - Network id : 5777

cliquez sur le bouton : SAVE AND RESTART
```
- [Metamask](https://metamask.io/)
```json
Importer un portefeuille existant :
  - Copier le mnemonic de ganache et coller dans la 1ere case de la phrase de récupération.
Créer un réseau local : 
  - Cliquez sur le bouton "Ajouter un réseau"
  - "Ajouter manuellement un réseau"
    - Nom du réseau : Ganache Local
    - Nouvelle URL de RPC : http://localhost:7545
    - ID de chaîne : 1337
    - Symbole de la devise : ETH
```
- [IPFS Desktop](https://docs.ipfs.tech/install/ipfs-desktop/)
une petite config sera peu être nécéssaire :
```json
{
  "API": {
    "HTTPHeaders": {
      "Access-Control-Allow-Credentials": [
        "true"
      ],
      "Access-Control-Allow-Methods": [
        "PUT",
        "POST"
      ],
      "Access-Control-Allow-Origin": [
        "*",
        "https://webui.ipfs.io",
        "http://webui.ipfs.io.ipns.localhost:8081"
      ]
    }
  },
  "Addresses": {
    "API": "/ip4/0.0.0.0/tcp/5001",
    "Announce": [],
    "AppendAnnounce": [],
    "Gateway": "/ip4/0.0.0.0/tcp/8081",
    "NoAnnounce": [],
    "Swarm": [
      "/ip4/0.0.0.0/tcp/4001",
      "/ip6/::/tcp/4001",
      "/ip4/0.0.0.0/udp/4001/quic",
      "/ip4/0.0.0.0/udp/4001/quic-v1",
      "/ip4/0.0.0.0/udp/4001/quic-v1/webtransport",
      "/ip6/::/udp/4001/quic",
      "/ip6/::/udp/4001/quic-v1",
      "/ip6/::/udp/4001/quic-v1/webtransport"
    ]
  }
}
```

<a name="front"></a>
### Front
#### Démarrage
Modifier le fichier .env.dist par .env avec vos configurations ou par défaut :
```bash
VITE_IPFS_API_SCHEME="http"
VITE_IPFS_API_HOST="localhost"
VITE_IPFS_API_PORT="5001"
VITE_IPFS_GATEWAY_SCHEME="http"
VITE_IPFS_GATEWAY_HOST="localhost"
VITE_IPFS_GATEWAY_PORT="8081"
```
###### Installation des packages
```bash 
$ cd front
$ npm install
```
###### lancement de l'application :
```bash 
$ npm run dev
```

<a name="blockchain"></a>
### Blockchain

Modifier le fichier .env.dist par .env avec vos configurations :
```bash
MNEMONIC="YOUR_MNEMONIC_GANACHE"
```

#### Démarrage

###### Compilation des smart contrats
```bash
$ cd blockchain
$ npm install
$ npm run build
```

###### Deploiement des smart contrats sur Ganache
```bash
$ npm run deploy:ganache
```

#### Résolution de problèmes

Si vous rencontrez des problèmes à la compilation ou au déploiement, vous pouvez utiliser les commandes suivantes:

###### Nettoyage des artéfacts et du cache de build
```bash
$ npm run clean
```

###### Deploy et reset smart contrat with Ganache (si besoin)
```bash
$ npm run deploy:ganache:reset
```

###### Execution des tests
```bash
$ npm run test
```

-----

<span style="color:red">Fin de la procédure d'installation !</span>

-----

<a name="wallets-api"></a>
### Wallets API

API de récupération des wallets pour la fin du Codelab (si ont a le temps)

#### Installation / lancement
```bash
$ cd wallets-api
$ nvm use
$ npm install
$ node src/index.js
```

#### Fonctionnement
- API Rest qui se lance sur `http://<ip>:3000` (ip peut être `localhost`)
  - avec un seul endpoint : `/wallets/:code`
  - par défaut il n'y a pas de wallets push sur Git, il faut donc :
    - créer un fichier `wallets.json` à la racine de ce dossier
    - la structure js des wallet est dans `wallets_example.json`

