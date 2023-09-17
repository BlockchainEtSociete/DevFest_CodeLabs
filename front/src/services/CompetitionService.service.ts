import {provider} from "../provider/providers";
import {ethers, EventLog} from "ethers";
import contractsInterface from "../contracts/contracts";
import {ipfsGetContent, ipfsGetUrl } from "../components/common/ipfs";
import {toString as uint8ArrayToString} from "uint8arrays/to-string";
import {fetchOnePeople} from "./PeopleService.service";
import {fetchOneMovie} from "./MovieService.service";

/**
 * Récuperation des data et creation de l'objet movie
 * @param tokenId
 * @param contract
 */
export const getCompetitionData = async (tokenId: number, contract: any) => {
    // récupération de la compétition
    const competition = await contract.getCompetition(tokenId);

    const tokenUri = competition.tokenURI;

    // parse des listes
    const nominees = competition.nominees ? [...competition.nominees] : [];
    if (tokenUri) {
        let listNominees: any[] = [];

        if (nominees.length > 0) {
            if (ethers.toNumber(competition.typeCompetitions) == 0) {
                //actor
                for (const nominee of nominees) {
                   const people =  await fetchOnePeople(contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi, ethers.toNumber(nominee.tokenId));

                   listNominees.push({
                        nominee: people,
                        voteCount: ethers.toNumber(nominee.voteCount)
                    })
                }
            } else if (ethers.toNumber(competition.typeCompetitions) == 1) {
                //director
                for (const nominee of nominees) {
                    const people = await fetchOnePeople(contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, ethers.toNumber(nominee.tokenId))
                    listNominees.push({
                        nominee: people,
                        voteCount: ethers.toNumber(nominee.voteCount)
                    })
                }
            } else {
                //movie
                for (const nominee of nominees) {
                    const movie = await fetchOneMovie(contractsInterface.contracts.Movies.address, contractsInterface.contracts.Movies.abi, ethers.toNumber(nominee.tokenId));
                    listNominees.push({
                        nominee: movie,
                        voteCount: ethers.toNumber(nominee.voteCount)
                    })
                }
            }
        }

        // parse des données récupérées en object
        const metadataString = await ipfsGetContent(tokenUri)
        const data = JSON.parse(uint8ArrayToString(metadataString, 'utf8'))

        return {
            id: tokenId,
            title: data.attributes[0].value,
            Picture: ipfsGetUrl(data.attributes[1].value),
            typeCompetition: ethers.toNumber(competition.typeCompetitions),
            startDate: ethers.toNumber(competition.startTime),
            endDate: ethers.toNumber(competition.endTime),
            nominees: listNominees
        };
    }
}

/**
 * function permettant de récuperer la liste des compétitions
 * @param eventType
 * @param contractAddress
 * @param contractAbi
 * @param setCompetitions
 */
export const fetchCompetitions = async (eventType: string, contractAddress: string, contractAbi: any, addToCompetitions: Function) => {
    if (provider) {
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);
        // création du filtre
        const filter = contract.filters[eventType];
        const events = await contract.queryFilter(filter, 0);

        try {
            for (const event of events) {
                // récupération de l'id du token parsé car initialement on le recoit en bigNumber
                const id = ethers.toNumber((event as EventLog).args[0]);

                await addToCompetitions(await getCompetitionData(id, contract));
            }
        } catch (err) {
            console.log(err);
            return false;
        }
    }
}

/**
 * Récupération d'une competitions et du nombre de vote
 * @param contractAddress
 * @param contractAbi
 * @param tokenId
 */
export const fetchOneCompetition = async (contractAddress: string, contractAbi: any, tokenId: number) => {
    if (provider) {
        let movie;
        // initialisation du contract
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);

        try {
            movie = await getCompetitionData(tokenId, contract)
        } catch (err) {
            console.log(err);
            return false;
        }
        return movie;
    }

}

/**
 * Fonction qui ecoute les nouvelles compétitions
 * @param eventType
 * @param contractAddress
 * @param contractAbi
 * @param addToCompetitions
 */
export const listenToNewCompetition = async (eventType: string, contractAddress: string, contractAbi: any, addToCompetitions: Function) => {
    if (provider) {       // initialisation du contract
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);

        await contract.on(eventType, async (event: any) => {
            const id = ethers.toNumber(event.args[0]);

            await addToCompetitions(await getCompetitionData(id, contract));
        });
    }
}

/**
 * Function qui retourne les listes d'ids en fonction des paramettre du filtre
 * @param competitionId
 * @param juryId
 * @param contractAddress
 * @param contractAbi
 * @param setIdsCompetition
 * @param setIdsJurys
 */
export const fetchIdsByFilter = async (competitionId: number | null, juryId: number | null, contractAddress: string, contractAbi: any, setIdsCompetition: Function, setIdsJurys: Function) => {
    if (provider) {
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);
        const filter = contract.filters.JuryAddedToCompetition(competitionId, juryId);

        try {
            const events = await contract.queryFilter(filter, 0);
            const idsCompetition: any[] = []
            const idsJurys: any[] = [];

            for (const event of events) {
                !idsCompetition.includes(ethers.toNumber((event as EventLog).args[0])) ? idsCompetition.push(ethers.toNumber((event as EventLog).args[0])) : '';
                !idsJurys.includes(ethers.toNumber((event as EventLog).args[1])) ? idsJurys.push( ethers.toNumber((event as EventLog).args[1])) : '';
            }

            setIdsCompetition(idsCompetition);
            setIdsJurys(idsJurys);
        } catch (err) {
            console.log(err);
            return false;
        }
    }
}
