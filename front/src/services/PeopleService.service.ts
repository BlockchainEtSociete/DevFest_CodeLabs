import { provider } from "../provider/providers";
import { ethers, EventLog, InterfaceAbi } from "ethers";
import contractsInterface from "../contracts/contracts";
import ipfs, { ipfsGetContent, ipfsGetUrl } from "../components/common/ipfs";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { Actor, Director, People } from "../types/People";
import { PeopleMetadata } from "../types/Metadata";
import { decodeError } from "../utils/error";

const ACTOR_CONTRACT = new ethers.Contract( contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi, provider );
const DIRECTOR_CONTRACT = new ethers.Contract( contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, provider );
const EVENT_ACTOR_MINTED = 'ActorMinted';
const EVENT_DIRECTOR_MINTED = 'DirectorMinted';

enum PeopleType {
    Actor,
    Director
}

/**
 * Récupère la liste des acteurs mintés
 * @returns la liste de tous les acteurs
 */
export const fetchActors = async (): Promise<Actor[]> => {
    return await fetchPeoples( PeopleType.Actor );
}

/**
 * Récupère la liste des réalisateurs mintés
 * @returns la liste de tous les réalisateurs
 */
export const fetchDirectors = async (): Promise<Director[]> => {
    return await fetchPeoples( PeopleType.Director );
}

/**
 * Récuperation des data et creation de l'objet people
 * @param tokenId
 * @param tokenUri
 */
export const getPeopleData = async ( tokenId: number, tokenUri: string ): Promise<People> => {
    // parse des données récupérées en object
    const metadataString = await ipfsGetContent( tokenUri );
    const data = JSON.parse( uint8ArrayToString( metadataString, 'utf8' ) );
    return {
        id: tokenId,
        firstname: data.attributes[0].value,
        lastname: data.attributes[1].value,
        picture: ipfsGetUrl( data.attributes[2].value ),
        address: data.attributes[3].value
    };
}

export const getDirectorAddress = async ( tokenId: number ): Promise<string> => {
    let contract = DIRECTOR_CONTRACT;
    let directorAddress;
    try {
        // vérification que la transaction c'est bien passé
        directorAddress = await contract.ownerOf(tokenId);
    } catch ( e ) {
        const error = JSON.parse( JSON.stringify( e ) );
        console.log( "Transaction", error );
        throw `Transaction : ${ error.reason }`;
    }

    if ( directorAddress ) {

        return directorAddress
    } else {
        console.log( "director address", directorAddress )
        throw "Une erreur c'est produit durant la transaction"
    }
};

/**
 * Fonction de récupération des données des acteurs et réalisateurs minté par event
 * @param peopleType
 * @returns liste de people
 */
export const fetchPeoples = async ( peopleType: PeopleType ): Promise<People[]> => {
    let filter, contract;

    // initialisation du contract
    // création du filtre en fonction du type
    if ( peopleType === PeopleType.Actor ) {
        contract = ACTOR_CONTRACT;
        filter = contract.filters[EVENT_ACTOR_MINTED];
    } else if ( peopleType === PeopleType.Director ) {
        contract = DIRECTOR_CONTRACT
        filter = contract.filters[EVENT_DIRECTOR_MINTED];
    } else {
        throw "PeopleType non géré"
    }

    // récupération des evenements en fonction du filtre
    const events = await contract?.queryFilter( filter, 0 ) as EventLog[];
    const peoples: People[] = [];

    try {
        for ( const event of events ) {
            // récupération de l'id du token parsé car initialement on le recoit en bigNumber
            const id = ethers.toNumber( event.args[0] );
            // récupération du tokenURI, url des metadonnée du token
            const tokenUri = event.args[1];

            peoples.push( await getPeopleData( id, tokenUri ) );
        }
    } catch ( err ) {
        const message = "Erreur lors de la récupération des peoples";
        console.log( message, err );
        throw message;
    }
    return peoples;
}

/**
 * récuperation d'un people que ca soit un acteur ou un réalisateur
 * @param contractAddress
 * @param contractAbi
 * @param tokenId
 */
const fetchOnePeople = async ( contractAddress: string, contractAbi: InterfaceAbi, tokenId: number ): Promise<People | undefined> => {
    if ( provider ) {
        // initialisation du contract
        const contract = new ethers.Contract( contractAddress, contractAbi, provider );
        let people: People | undefined;
        try {
            // récupération du tokenURI, url des metadonnée du token
            const tokenUri = await contract.tokenURI( tokenId );
            if ( tokenUri ) {
                people = await getPeopleData( tokenId, tokenUri )
            }
        } catch ( err ) {
            const message = "Erreur lors de la récupération du people";
            console.log( message, err );
            throw message;
        }
        return people;
    }
}

export const fetchOneActor = ( actorTokenId: number ): Promise<Actor | undefined> => {
    return fetchOnePeople( contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi, actorTokenId );
}

export const fetchOneDirector = ( directorIdNominee: number ): Promise<Director | undefined> => {
    return fetchOnePeople( contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, directorIdNominee );
}

/**
 * Fonction qui ecoute les nouveaux acteurs
 * @param onNewActor
 */
export const listenToNewActor = async ( onNewActor: ( Actor: Actor ) => void ) => {
    await ACTOR_CONTRACT.on( EVENT_ACTOR_MINTED, async ( ...args: Array<unknown> ) => {
        const [ tokenId, tokenUri ] = args;
        onNewActor( await getPeopleData( ethers.toNumber( tokenId as number ), tokenUri as string ) )
    } )
}

/**
 * Fonction qui ecoute les nouveaux réalisateurs
 * @param onNewDirector
 */
export const listenToNewDirector = async ( onNewDirector: ( Director: Director ) => void ) => {
    await DIRECTOR_CONTRACT.on( EVENT_DIRECTOR_MINTED, async ( ...args: Array<unknown> ) => {
        const [ tokenId, tokenUri ] = args;
        onNewDirector( await getPeopleData( ethers.toNumber( tokenId as number ), tokenUri as string ) )
    } );
}

/**
 * Stop l'ecoute des nouveaux acteurs
 */
export const stopListenToNewActor = async () => {
    await ACTOR_CONTRACT.removeAllListeners( EVENT_ACTOR_MINTED );
}

/**
 * Stop l'écoute des nouveaux réalisateurs
 */
export const stopListenToNewDirector = async () => {
    await DIRECTOR_CONTRACT.removeAllListeners( EVENT_DIRECTOR_MINTED );
}

/**
 * Génération des meta données du nft avec enregistrement sur ipfs
 * @param PictureUri
 * @param newActorInfo
 */
export const generateNFTMetadataPeopleAndUploadToIpfs = async ( pictureUri: string, newPeople: People ): Promise<string> => {
    const NFTMetaData: PeopleMetadata = {
        "description": "People generated NFT metadata",
        "external_url": "",
        "image": pictureUri,
        "name": "People DevFest",
        "attributes": [
            {
                "trait_type": "Firstname",
                "value": newPeople.firstname
            },
            {
                "trait_type": "Lastname",
                "value": newPeople.lastname
            },
            {
                "trait_type": "Picture",
                "value": pictureUri
            },
            {
                "trait_type": "Address",
                "value": newPeople.address
            }
        ]
    }

    const metadataString = JSON.stringify( NFTMetaData );

    try {
        // enregistrement des meta donné sur ipfs
        const ipfsResponse = await ipfs.add( metadataString, { pin: true } );
        // création de l'addresse des meta donnée
        return 'ipfs://' + ipfsResponse.cid;
    } catch ( e ) {
        throw `Erreur lors de l'écriture des méta données de la compétition sur IPFS`;
    }
}

/**
 * Fonction qui va appeler le smart contract pour minter le people
 * @param tokenUri
 * @param typePeople
 */
export const mintPeople = async ( recipient: string, tokenUri: string, typePeople: number ): Promise<number> => {
    const signer = await provider?.getSigner();
    let contract;

    // création de l'appel du mint
    if ( typePeople == 1 ) {
        contract = new ethers.Contract( contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi, signer );
    } else {
        contract = new ethers.Contract( contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, signer );
    }

    let receipt;
    try {
        // vérification que la transaction c'est bien passé
        const transaction = await contract.mint( recipient, tokenUri );
        receipt = await transaction.wait();
    } catch ( e ) {
        const  { error }  = decodeError(e);
        console.log( "Transaction", error );
        throw `${ error }`;
    }

    if ( receipt && receipt.status == 1 ) {
        const peopleMinted = ( receipt.logs as EventLog[] ).find( ( log ) => log.fragment && log.fragment.name === EVENT_DIRECTOR_MINTED || log.fragment.name === EVENT_ACTOR_MINTED );

        if ( !peopleMinted ) {
            console.log( "receipt", receipt )
            throw "Evenement de création attendu"
        }

        return ethers.toNumber( peopleMinted.args[0] );
    } else {
        console.log( "receipt", receipt )
        throw "Une erreur c'est produit durant la transaction"
    }
}
