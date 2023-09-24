import {ipfsGetContent, ipfsGetUrl } from "../components/common/ipfs";
import {toString as uint8ArrayToString} from "uint8arrays/to-string";
import {provider} from "../provider/providers";
import contractsInterface from "../contracts/contracts";
import {ethers, EventLog} from "ethers";
import { Jury } from "../types/Jury";

/**
 * Récuperation des données Jury dans IPFS
 * @param tokenId
 * @param tokenUri
 */
export const getJuryData = async (tokenId: number, tokenUri: string): Promise<Jury> => {
    const metadataString = await ipfsGetContent(tokenUri);
    const data = JSON.parse(uint8ArrayToString(metadataString, 'utf8'));

    return {
        id: tokenId,
        Firstname: data.attributes[0].value,
        Lastname: data.attributes[1].value,
        Picture: ipfsGetUrl(data.image),
        Address: data.attributes[3].value
    };
}

/**
 * Fonction de récupération des données des jurys
 * @param eventType
 * @param contractAddress
 * @param contractAbi
 * @param setLoading
 * @param addToJurys
 */
export const fetchJury = async (eventType: string, contractAddress: string, contractAbi: any, addToJurys: Function) => {
    if (provider) {
        // initialisation du contract
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);
        // création du filtre
        const filter = contract.filters[eventType];
        // récupération des evenements en fonction du filtre
        const events = await contract.queryFilter(filter, 0);

        try {
            for (const event of events) {
                const id = ethers.toNumber((event as EventLog).args[1]);
                const tokenUri: string = (event as EventLog).args[2];

                if(tokenUri) {
                    await addToJurys(await getJuryData(id, tokenUri));
                }
            }
        } catch (err) {
            console.log(err);
            return false;
        }
    }
}

/**
 * Fonction qui ecoute les nouveaux jurys
 * @param eventType
 * @param contractAddress
 * @param contractAbi
 * @param onNewJury
 */
export const listenToNewJury = async (onNewJury: (Jury:Jury) => void) => {

    if (provider) {
        // initialisation du contract
        const contract = new ethers.Contract(contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, provider);

        // TODO gestion stop écoute évènement
        contract.on("JuryMinted", async (event: EventLog) => {
            const tokenUri: string = event.args[2];
            const id = ethers.toNumber(event.args[1]);
            onNewJury(await getJuryData(id, tokenUri));
        });
    }
}


/**
 * TODO refacto avec fetchJury
 * 
 */
export const fetchAllJuries = async (): Promise<Jury[]> => {
    const juries:Jury[] = [];
    if (provider) {
        const contract = new ethers.Contract(contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, provider);
        const filter = contract.filters.JuryMinted;
        const events = await contract.queryFilter(filter, 0) as EventLog[];

        try {
            for (const event of events) {
                const id = ethers.toNumber((event as EventLog).args[1]);
                const tokenUri: string = (event as EventLog).args[2];
                
                juries.push(await getJuryData(id, tokenUri));
            }
        } catch (err) {
            const message = "Erreur de lors récupération des jurys";
            console.log(message, err);
            throw message;
        }
    }

    return juries;
}