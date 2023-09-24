import { provider } from "../provider/providers.ts";
import { ethers, EventLog } from "ethers";
import contractsInterface from "../contracts/contracts";
import { ipfsGetContent, ipfsGetUrl } from "../components/common/ipfs.ts";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { Actor, Director, People } from "../types/People.ts";

/**
 * Récuperation des data et creation de l'objet people
 * @param tokenId
 * @param tokenUri
 */
export const getPeopleData = async (tokenId: number, tokenUri: string): Promise<People> => {
    // parse des données récupérées en object
    const metadataString = await ipfsGetContent(tokenUri);
    const data = JSON.parse(uint8ArrayToString(metadataString, 'utf8'));
    return {
        id: tokenId,
        firstname: data.attributes[0].value,
        lastname: data.attributes[1].value,
        picture: ipfsGetUrl(data.attributes[2].value),
        address: data.attributes[3].value
    };
}

/**
 * Fonction de récupération des données des acteurs et réalisateurs par event
 * @param eventType
 * @param contractAddress
 * @param contractAbi
 * @param setLoading
 * @param addToPeopleList
 */
export const fetchPeople = async (eventType: string, contractAddress: string, contractAbi: any): Promise<People[] | undefined> => {
    if (provider) {
        // initialisation du contract
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);
        // création du filtre
        const filter = contract.filters[eventType];
        // récupération des evenements en fonction du filtre
        const events = await contract.queryFilter(filter, 0);
        let listActor: People[] = [];
        try {
            for (const event of events) {
                let tokenUri: string = '';
                // récupération de l'id du token parsé car initialement on le recoit en bigNumber
                const id = ethers.toNumber((event as EventLog).args[0]);
                // récupération du tokenURI, url des metadonnée du token
                tokenUri = await contract.tokenURI(id);

                if (tokenUri) {
                     listActor.push(await getPeopleData(id, tokenUri));
                }
            }
        } catch (err) {
            console.log(err);
            return undefined;
        }
        return listActor;
    }
}

/**
 * Fonction qui ecoute les nouveaux peoples
 * @param eventType
 * @param contractAddress
 * @param contractAbi
 * @param addToPeopleList
 */
export const listenToNewPeople = async (eventType: string, contractAddress: string, contractAbi: any, addToPeopleList: Function) => {
    if (provider) {
        // initialisation du contract
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);

        await contract.on(eventType, async (event: any) => {
            const id = ethers.toNumber(event);
            // récupération du tokenURI, url des metadonnée du token
            const tokenUri = await contract.tokenURI(id);
            if (tokenUri) {
                addToPeopleList(await getPeopleData(id, tokenUri));
            }
        });
    }
}

/**
 * récuperation d'un people que ca soit un acteur ou un réalisateur
 * @param contractAddress
 * @param contractAbi
 * @param tokenId
 */
export const fetchOnePeople = async (contractAddress: string, contractAbi: any, tokenId: number): Promise<People | undefined> => {
    if (provider) {
        let people: People | undefined;
        // initialisation du contract
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);
        try {
            // récupération du tokenURI, url des metadonnée du token
            const tokenUri = await contract.tokenURI(tokenId);
            if (tokenUri) {
                people = await getPeopleData(tokenId, tokenUri)
            }
        } catch (err) {
            console.log(err);
            return undefined;
        }
        return people;
    }
}

enum PeopleType {
    Actor,
    Director
}

/**
 * TODO refacto avec fetchPeople
 * Récupère la liste des acteurs ou réalisateurs mintés
 * @returns liste de people
 */
const fetchAllPeople = async (peopleType: PeopleType): Promise<People[]> => {
    const actors:People[] = [];
    if (provider) {
        let contract, filter;
        // Récupération des acteurs par événement
        if (peopleType === PeopleType.Actor) {
            contract = new ethers.Contract(contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi, provider);
            filter = contract.filters.ActorMinted;
        } else if (peopleType === PeopleType.Director) {
            contract = new ethers.Contract(contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, provider);
            filter = contract.filters.DirectorMinted;
        } else {
            throw "PeopleType non géré"
        }

        const events = await contract?.queryFilter(filter, 0) as EventLog[];

        try {
            for (const event of events) {
                // récupération de l'id du token parsé car initialement on le recoit en bigNumber
                const id = ethers.toNumber((event as EventLog).args[0]);
                // récupération du tokenURI, url des metadonnée du token
                const tokenUri = await contract?.tokenURI(id);

                if (tokenUri) {
                    actors.push(await getPeopleData(id, tokenUri));
                }
            }
        } catch (err) {
            const msg = "Erreur lors de la récupération des acteurs";
            console.log(msg, err);
            throw msg;
        }
    }

    return actors;
}

/**
 * Récupère la liste des acteurs mintés
 * @returns la liste de tous les acteurs
 */
export const fetchActors = async (): Promise<Actor[]> => {
    return await fetchAllPeople(PeopleType.Actor);
}

/**
 * Récupère la liste des réalisateurs mintés
 * @returns la liste de tous les réalisateurs
 */
export const fetchDirectors = async (): Promise<Director[]> => {
    return await fetchAllPeople(PeopleType.Director);
}