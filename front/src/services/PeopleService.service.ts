import { provider } from "../provider/providers.ts";
import { ethers, EventLog } from "ethers";
import { ipfsGetContent, ipfsGetUrl } from "../components/common/ipfs.ts";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";

/**
 * Récuperation des data et creation de l'objet people
 * @param tokenId
 * @param tokenUri
 */
export const getPeopleData = async (tokenId: number, tokenUri: string) => {
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
export const fetchPeople = async (eventType: string, contractAddress: string, contractAbi: any, addToPeopleList: Function) => {
    if (provider) {
        // initialisation du contract
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);
        // création du filtre
        const filter = contract.filters[eventType];
        // récupération des evenements en fonction du filtre
        const events = await contract.queryFilter(filter, 0);
        try {
            for (const event of events) {
                let tokenUri: string = '';
                // récupération de l'id du token parsé car initialement on le recoit en bigNumber
                const id = ethers.toNumber((event as EventLog).args[0]);
                // récupération du tokenURI, url des metadonnée du token
                tokenUri = await contract.tokenURI(id);

                if (tokenUri) {
                    await addToPeopleList(await getPeopleData(id, tokenUri));
                }
            }
        } catch (err) {
            console.log(err);
            return false;
        }
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
            let tokenUri: string = '';
            const id = ethers.toNumber(event.args[0]);
            // récupération du tokenURI, url des metadonnée du token
            tokenUri = await contract.tokenURI(id);

            if (tokenUri) {
                await addToPeopleList(await getPeopleData(id, tokenUri));
            }
        });

    }
}

/**
 * récuperation d'un people que ca soit un acteur ou un réalisateur
 * @param contractAddress
 * @param contractAbi
 * @param tokenId
 * @param setLoading
 */
export const fetchOnePeople = async (contractAddress: string, contractAbi: any, tokenId: number) => {
    if (provider) {
        let people;
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
        }
        return people;
    }
}
