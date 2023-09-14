import { provider } from "../provider/providers";
import { ContractTransactionReceipt, ethers, EventLog } from "ethers";
import contractsInterface from "../contracts/contracts";
import { ipfsGetContent, ipfsGetUrl } from "../components/common/ipfs";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { fetchOnePeople } from "./PeopleService.service";
import { fetchOneMovie } from "./MovieService.service";
import { Competition, Nominee, TypeCompetitions, VotingCompetitionStatus, CompetitionAndVotingStatus } from "../types/Competition";

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
                    const people = await fetchOnePeople(contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi, ethers.toNumber(nominee.tokenId));

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
                !idsJurys.includes(ethers.toNumber((event as EventLog).args[1])) ? idsJurys.push(ethers.toNumber((event as EventLog).args[1])) : '';
            }

            setIdsCompetition(idsCompetition);
            setIdsJurys(idsJurys);
        } catch (err) {
            console.log(err);
            return false;
        }
    }
}

/**
 * Récupération des compétitions d'un jury
 * @param juryId id technique du jury dans le contrat
 * @param status status des compétitions à récupérer
 * @param setLoading setter loading state
 * @param setCompetitions setter competitions state
 */
export async function fetchCompetitionsOfOneJury(juryId: number, status: VotingCompetitionStatus, setLoading: (loading: boolean) => void, setCompetitions: (competitions: Competition[]) => void) {
    setLoading(true);
    try {
        const signer = await provider?.getSigner()
        const competitionsContract = new ethers.Contract(contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer);

        const filter = competitionsContract.filters.JuryAddedToCompetition(null, juryId);
        const eventsOfJury: EventLog[] = await competitionsContract.queryFilter(filter, 0) as EventLog[];

        const competitions: Competition[] = []
        for (const eventJury of eventsOfJury) {
            const [ competitionId ] = eventJury.args
            try {
                const { competition, votingStatus }: CompetitionAndVotingStatus = await competitionsContract.getUnvotedCompetitionOfJury(competitionId)

                if (ethers.toNumber(votingStatus) === status) {
                    const metadataString = JSON.parse(uint8ArrayToString(await ipfsGetContent(competition.tokenURI), 'utf8'))
                    const title = metadataString.attributes[0].value
                    const pictureUrl = ipfsGetUrl(metadataString.attributes[1].value)

                    competitions.push({
                        id: ethers.toNumber(competitionId),
                        tokenURI: competition.tokenURI,
                        title,
                        pictureUrl,
                        typeCompetitions: ethers.toNumber(competition.typeCompetitions),
                        status: ethers.toNumber(votingStatus),
                        startTime: ethers.toNumber(competition.startTime),
                        endTime: ethers.toNumber(competition.endTime),
                        nominees: competition.nominees,
                        winnerCompetition: ethers.toNumber(competition.winnerCompetition),
                    });
                } else {
                    console.log(`La compétition ${competitionId} n'est pas encore ouverte`)
                }
            } catch (err) {
                console.log(`Erreur lors de la récupération de la compétition ${competitionId}`, err)
            }
        }

        setCompetitions(competitions)
    } catch (e) {
        console.log("Erreur lors de la récupération des compétitions", e);
    } finally {
        setLoading(false)
    }
}

/**
 * Rajoute les infos des nominés sur la compétition
 * @param competition compétition
 * @param setLoading setter loading state
 */
export async function fetchNomineesOfCompetition(competition: Competition, setLoading: (loading: boolean) => void): Promise<Nominee[]> {
    const nominees: Nominee[] = []
    setLoading(true)

    const signer = await provider?.getSigner()
    const competitionsContract = new ethers.Contract(contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer);

    const filter = competitionsContract.filters.NomineeCompetitionsRegistered(competition.id, null, null);
    const eventsOfNominees: EventLog[] = await competitionsContract.queryFilter(filter, 0) as EventLog[];
    
    try {
        if (competition.typeCompetitions === TypeCompetitions.Actor) {
            for (const nomineeEvent of eventsOfNominees) {
                const nomineeId = ethers.toNumber(nomineeEvent.args[1])
                const nomineeTokenId = ethers.toNumber(nomineeEvent.args[2])

                const actor = await fetchOnePeople(contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi, ethers.toNumber(nomineeTokenId));
                const title = `${actor?.Firstname} ${actor?.Lastname}`;
                const pictureUrl = actor?.Picture || '';
                nominees.push({ tokenId: nomineeTokenId, title, pictureUrl, id: nomineeId });
            }
        } else if (competition.typeCompetitions === TypeCompetitions.Director) {
            for (const nomineeEvent of eventsOfNominees) {
                const nomineeId = ethers.toNumber(nomineeEvent.args[1])
                const nomineeTokenId = ethers.toNumber(nomineeEvent.args[2])

                const director = await fetchOnePeople(contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, ethers.toNumber(nomineeTokenId));
                const title = `${director?.Firstname} ${director?.Lastname}`;
                const pictureUrl = director?.Picture || '';
                nominees.push({ tokenId: nomineeTokenId, title, pictureUrl, id: nomineeId });
            }
        } else {
            // Movie
            for (const nomineeEvent of eventsOfNominees) {
                const nomineeId = ethers.toNumber(nomineeEvent.args[1])
                const nomineeTokenId = ethers.toNumber(nomineeEvent.args[2])

                const movie = await fetchOneMovie(contractsInterface.contracts.Movies.address, contractsInterface.contracts.Movies.abi, ethers.toNumber(nomineeTokenId));
                const title = movie?.Title;
                const pictureUrl = movie?.Picture || '';
                nominees.push({ tokenId: nomineeTokenId, title, pictureUrl, id: nomineeId });
            }
        }
    } catch (e) {
        console.log("Erreur lors de la récupération des nominés", e)
    } finally {
        setLoading(false)
    }
    return nominees;
}

/**
 * Vote pour un nominé sur une compétition
 * @param competition compétition
 * @param nominee nominé
 * @param setLoading setter loading state
 * @returns vrai si le vote s'est bien passé
 */
export async function voteOnCompetition(competition: Competition, nominee: Nominee, setLoading: (loading: boolean) => void): Promise<boolean> {
    setLoading(true)
    try {
        const signer = await provider?.getSigner()
        const competitionsContract = new ethers.Contract(contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer);
        const receipt:ContractTransactionReceipt = await (await competitionsContract.voteOnCompetition(competition.id, nominee.id)).wait()

        if (receipt.status == 1) {
            return true
        }
        return false
    } catch (e) {
        console.log("Erreur lors du vote sur une compétition", e)
        return false
    } finally {
        setLoading(false)
    }
}
