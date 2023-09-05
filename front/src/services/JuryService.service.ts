import {ipfsGetContent} from "../components/common/ipfs.ts";
import {toString as uint8ArrayToString} from "uint8arrays/to-string";
import {provider} from "../provider/providers.ts";
import {ethers, EventLog} from "ethers";

/**
 * Récuperation des data et creation de l'objet jury
 * @param tokenId
 * @param tokenUri
 */
export const getJuryData = async (tokenId: number, tokenUri: string) => {
    // parse des données récupérées en object
    const metadataString = await ipfsGetContent(tokenUri);
    const data = JSON.parse(uint8ArrayToString(metadataString, 'utf8'));

    return {
        id: tokenId,
        Firstname: data.attributes[0].value,
        Lastname: data.attributes[1].value,
        Picture: data.image.replace('ipfs://', 'https://ipfs.io/ipfs/'),
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
export const fetchJury = async (eventType: string, contractAddress: string, contractAbi: any, setLoading: Function, addToJurys: Function) => {
    setLoading(true);
    if (provider) {
        // initialisation du contract
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);
        // création du filtre
        const filter = contract.filters[eventType];
        // récupération des evenements en fonction du filtre
        const events = await contract.queryFilter(filter, 0);

        try{
            for (const event of events) {
                const id = ethers.toNumber((event as EventLog).args[1]);
                const tokenUri: string = (event as EventLog).args[2];

                if(tokenUri) {
                    await addToJurys(await getJuryData(id, tokenUri));
                }
            }
        } catch (err) {
            console.log(err);
            setLoading(false);
            return false;
        }
        setLoading(false);
    }
}

/**
 * Fonction qui ecoute les nouveaux jurys
 * @param eventType
 * @param contractAddress
 * @param contractAbi
 * @param addToJurys
 */
export const listenToNewJury = async (eventType: string, contractAddress: string, contractAbi: any, addToJurys: Function) => {
    if (provider) {
        // initialisation du contract
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);

        await contract.emit(eventType, async (event: any) => {
            const tokenUri: string = event.args[2];
            const id = ethers.toNumber(event.args[1]);
            console.log(event);

            if (tokenUri) {
                await addToJurys(await getJuryData(id, tokenUri));
            }
        });

    }
}
