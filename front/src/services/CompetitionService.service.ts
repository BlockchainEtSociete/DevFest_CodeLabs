import {provider} from "../provider/providers";
import {ethers, EventLog} from "ethers";
import contractsInterface from "../contracts/contracts";
import {ipfsGetContent} from "../components/common/ipfs";
import {toString as uint8ArrayToString} from "uint8arrays/to-string";
import {fetchOnePeople, fetchPeople} from "./PeopleService.service";
import {fetchOneMovie} from "./MovieService.service";

/**
 * function permettant de récuperer la liste des compétitions
 * @param eventType
 * @param contractAddress
 * @param contractAbi
 * @param setLoading
 * @param setCompetitions
 */
export async function fetchCompetitions(eventType: string, contractAddress: string, contractAbi: any, setLoading: Function, setCompetitions: Function){
    setLoading(true);
    if(provider){
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);
        // création du filtre
        const filter = contract.filters[eventType];
        const events = await contract.queryFilter(filter, 0);

        const competitions: (boolean | { id: any; title: any; Picture: any; typeCompetition: number; startDate: any; endDate: any; options: { option: boolean | { id: number; Firstname: any; Lastname: any; Picture: any; Address: any; } | { id: number; Title: any; Description: any; Picture: any; Director: { Firstname: any; Lastname: any; }; } | undefined; voteCount: number; }[]; jurys: number[]; } | undefined)[] = [];

        for(const event of events) {
            // récupération de l'id du token parsé car initialement on le recoit en bigNumber
            const id = ethers.toNumber((event as EventLog).args[0]);

            await fetchOneCompetition(contractAddress, contractAbi, id, setLoading)
                .then((competition) => {
                    competitions.push(competition);
                })
        }
        setCompetitions(competitions);
    }
}

/**
 * Récupération d'une competitions et du nombre de vote
 * @param contractAddress
 * @param contractAbi
 * @param tokenId
 * @param setLoading
 */
export async function fetchOneCompetition(contractAddress: string, contractAbi: any, tokenId: number, setLoading: Function){
    setLoading(true);
    if(provider){
        let movie;
        let tokenUri: string = '';

        // initialisation du contract
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);

        try{
            // récupération de la compétition
            const competition = await contract.getCompetition(tokenId);

            tokenUri = competition.tokenURI;

            // parse des listes
            const jurys = [...competition.jurys]
            const options = [...competition.options]
            let listOptions: {
                option: boolean | { id: number; Firstname: any; Lastname: any; Picture: any; Address: any; } | {
                    id: number; Title: any; Description: any; Picture: any;
                    Director: { Firstname: any; Lastname: any; };
                } | undefined; voteCount: number;
            }[] = [];
            let listIdJurys = [];

            if(ethers.toNumber(competition.typeCompetitions) == 1){
                //actor
                for(const option of options){
                    fetchOnePeople(contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi, ethers.toNumber(option.tokenId), setLoading)
                        .then((people) => {
                            listOptions.push({
                                option: people,
                                voteCount: ethers.toNumber(option.voteCount)
                            })
                        });
                }
            } else if(ethers.toNumber(competition.typeCompetitions) == 2){
                //director
                for(const option of options){
                    fetchOnePeople(contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, ethers.toNumber(option.tokenId), setLoading)
                        .then((people) => {
                            listOptions.push({
                                option: people,
                                voteCount: ethers.toNumber(option.voteCount)
                            })
                        });
                }
            }else{
                //movie
                for(const option of options){
                    fetchOneMovie(contractsInterface.contracts.Movies.address, contractsInterface.contracts.Movies.abi, ethers.toNumber(option.tokenId), setLoading)
                        .then((film) => {
                            listOptions.push({
                                option: film,
                                voteCount: ethers.toNumber(option.voteCount)
                            })
                        });
                }
            }

            // jury a finir de récuperer
            for(const j of jurys){
                listIdJurys.push(ethers.toNumber(j));
            }

            if( tokenUri) {
                // parse des données récupérées en object
                const metadataString = await ipfsGetContent(tokenUri)
                const data = JSON.parse(uint8ArrayToString(metadataString, 'utf8'))

                movie = {
                    id: tokenId,
                    title: data.attributes[0].value,
                    Picture: data.attributes[1].value.replace('ipfs://', 'https://ipfs.io/ipfs/'),
                    typeCompetition: ethers.toNumber(competition.typeCompetitions),
                    startDate: ethers.toNumber(competition.startTime),
                    endDate: ethers.toNumber(competition.endTime),
                    options: listOptions,
                    jurys: listIdJurys
                }
            }
        }catch (err) {
            console.log(err);
            setLoading(false);
            return false;
        }
        setLoading(false);
        return movie;
    }

}
