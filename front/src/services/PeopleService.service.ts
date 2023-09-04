import {provider} from "../provider/providers.ts";
import {ethers, EventLog} from "ethers";
import {ipfsGetContent} from "../components/common/ipfs.ts";
import {toString as uint8ArrayToString} from "uint8arrays/to-string";

export const getPeopleData = async (tokenId: number, tokenUri: string) => {
    // parse des données récupérées en object
    const metadataString = await ipfsGetContent(tokenUri);
    const data = JSON.parse(uint8ArrayToString(metadataString, 'utf8'));

    return {
        id: tokenId,
        Firstname: data.attributes[0].value,
        Lastname: data.attributes[1].value,
        Picture: data.attributes[2].value.replace('ipfs://', 'https://ipfs.io/ipfs/'),
        Address: data.attributes[3].value
    };
}

/**
 * Fonction de récupération des données des acteurs et réalisateurs
 * */
export const fetchPeople = async (eventType: string, contractAddress: string, contractAbi: any, setLoading: Function, addToPeopleList: Function) => {
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
                let tokenUri: string = '';
                // récupération de l'id du token parsé car initialement on le recoit en bigNumber
                const id = ethers.toNumber((event as EventLog).args[0]);
                // récupération du tokenURI, url des metadonnée du token
                tokenUri = await contract.tokenURI(id);

                if(tokenUri) {
                    addToPeopleList(await getPeopleData(tokenUri));
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

export const listenToNewPeople = async (eventType: string, contractAddress: string, contractAbi: any, addToPeopleList: Function) => {
    if (provider) {
        // initialisation du contract
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);

        contract.on(eventType, async (tokenId: any) => {
            let tokenUri: string = '';
            const id = ethers.toNumber(tokenId);
            // récupération du tokenURI, url des metadonnée du token
            tokenUri = await contract.tokenURI(id);

            if (tokenUri) {
                addToPeopleList(await getPeopleData(tokenUri));
            }
        });
    }
}

