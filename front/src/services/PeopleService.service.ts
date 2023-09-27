import { provider } from "../provider/providers";
import { ethers, EventLog } from "ethers";
import contractsInterface from "../contracts/contracts";
import { ipfsGetContent, ipfsGetUrl } from "../components/common/ipfs";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { Actor, Director, People } from "../types/People";

const actorContract = new ethers.Contract( contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi, provider );
const directorContract = new ethers.Contract( contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, provider );
const eventActorMinted = 'ActorMinted';
const eventDirectorMinted = 'DirectorMinted';

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
        contract = actorContract;
        filter = contract.filters[eventActorMinted];
    } else if ( peopleType === PeopleType.Director ) {
        contract = directorContract
        filter = contract.filters[eventDirectorMinted];
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
        const msg = "Erreur lors de la récupération des peoples";
        console.log( msg, err );
        throw msg;
    }
    return peoples;
}

/**
 * récuperation d'un people que ca soit un acteur ou un réalisateur
 * @param contractAddress
 * @param contractAbi
 * @param tokenId
 */
export const fetchOnePeople = async ( contractAddress: string, contractAbi: any, tokenId: number ): Promise<People | undefined> => {
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
            const msg = "Erreur lors de la récupération du people";
            console.log( msg, err );
            throw msg;
        }
        return people;
    }
}

/**
 * Fonction qui ecoute les nouveaux acteurs
 * @param onNewActor
 */
export const listenToNewActor = async ( onNewActor: ( Actor: Actor ) => void ) => {
    await actorContract.on( eventActorMinted, async ( ...args: Array<unknown> ) => {
        const [ tokenId, tokenUri ] = args;
        onNewActor( await getPeopleData( ethers.toNumber( tokenId as number ), tokenUri as string ) )
    } )
}

/**
 * Fonction qui ecoute les nouveaux réalisateurs
 * @param onNewDirector
 */
export const listenToNewDirector = async ( onNewDirector: ( Director: Director ) => void ) => {
    await directorContract.on( eventDirectorMinted, async ( ...args: Array<unknown> ) => {
        const [ tokenId, tokenUri ] = args;
        onNewDirector( await getPeopleData( ethers.toNumber( tokenId as number ), tokenUri as string ) )
    } );
}

/**
 * Stop l'ecoute des nouveaux acteurs
 */
export const stopListenToNewActor = async () => {
    await actorContract.removeAllListeners( eventActorMinted );
}

/**
 * Stop l'écoute des nouveaux réalisateurs
 */
export const stopListenToNewDirector = async () => {
    await directorContract.removeAllListeners( eventDirectorMinted );
}
