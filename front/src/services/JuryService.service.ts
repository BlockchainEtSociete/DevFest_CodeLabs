import {ipfsGetContent, ipfsGetUrl } from "../components/common/ipfs";
import {toString as uint8ArrayToString} from "uint8arrays/to-string";
import {provider} from "../provider/providers";
import contractsInterface from "../contracts/contracts";
import {ethers, EventLog} from "ethers";
import { Jury } from "../types/Jury";

const juryContract = new ethers.Contract(contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, provider);

/**
 * Evenements émits par le contrat Competition
 */
const JuryContractEvents = {
    NEW_JURY : "JuryMinted"
}

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
        firstname: data.attributes[0].value,
        lastname: data.attributes[1].value,
        picture: ipfsGetUrl(data.image),
        Address: data.attributes[3].value
    };
}


/**
 * Récupération de la liste de tous les jurys
 * @returns tableau de Jurys
 */
export const fetchAllJuries = async (): Promise<Jury[]> => {
    const juries:Jury[] = [];

    const filter = juryContract.filters[JuryContractEvents.NEW_JURY];
    const events = await juryContract.queryFilter(filter, 0) as EventLog[];

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

    return juries;
}

/**
 * Ecoute les nouveaux jurys
 * @param eventType
 * @param contractAddress
 * @param contractAbi
 * @param onNewJury
 */
export const listenToNewJury = async (onNewJury: (Jury:Jury) => void) => {
    await juryContract.on(JuryContractEvents.NEW_JURY, async (...args: Array<unknown>) => {
        const [_, tokenId, tokenUri] = args;
        onNewJury(await getJuryData(ethers.toNumber(tokenId as number), tokenUri as string));
    });
}

/**
 * Stoppe l'ecoute les nouveaux jurys
 */
export const stopListenToNewJury = async () => {
    await juryContract.removeAllListeners(JuryContractEvents.NEW_JURY);
}