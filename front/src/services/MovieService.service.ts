import { provider } from "../provider/providers.ts";
import { ethers, EventLog } from "ethers";
import { ipfsGetContent, ipfsGetUrl } from "../components/common/ipfs.ts";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import contractsInterface from "../contracts/contracts.ts";
import { Movie } from "../types/Movie.ts";

/**
 * Récuperation des data et creation de l'objet movie
 * @param tokenId
 * @param tokenUri
 */
export const getMovieData = async (tokenId: number, tokenUri: string): Promise<Movie> => {
    // parse des données récupérées en object
    const metadataString = await ipfsGetContent(tokenUri);
    const data = JSON.parse(uint8ArrayToString(metadataString, 'utf8'));

    // récuperation du réalisateur
    const contractDirector = new ethers.Contract(contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, provider);
    const tokenUriDirector = await contractDirector.tokenURI(data.attributes[3].value);
    const metaDataStringDirector = await ipfsGetContent(tokenUriDirector);
    const dataDirector = JSON.parse(uint8ArrayToString(metaDataStringDirector, 'utf8'));

    return {
        id: tokenId,
        title: data.attributes[0].value,
        description: data.attributes[1].value,
        picture: ipfsGetUrl(data.attributes[2].value),
        director: {
            id: data.attributes[3].value,
            firstname: dataDirector.attributes[0].value,
            lastname: dataDirector.attributes[1].value,
            picture: dataDirector.attributes[2].value,
            address: dataDirector.attributes[3].value
        }
    }
}

/**
 * récuperation de tout les films
 * @param eventType
 * @param contractAddress
 * @param contractAbi
 * @param setLoading
 * @param addToMovieList
 */
export const fetchMovie = async (eventType: string, contractAddress: string, contractAbi: any, addToMovieList: Function) => {
    if (provider) {
        // initialisation du contract
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);
        // création du filtre
        const filter = contract.filters[eventType];
        // récupération des evenements en fonction du filtre
        const events = await contract.queryFilter(filter, 0);
        const movies: any = [];
        try {
            for (const event of events) {
                let tokenUri: string = '';
                // récupération de l'id du token parsé car initialement on le recoit en bigNumber
                const id = ethers.toNumber((event as EventLog).args[0]);
                // récupération du tokenURI, url des metadonnée du token
                tokenUri = await contract.tokenURI(id);

                if (tokenUri) {
                    await addToMovieList(await getMovieData(id, tokenUri));
                }
            }
        } catch (err) {
            console.log(err);
            return false;
        }
        return movies;
    }
}

/**
 * Récuperation d'un film avec sont réalisateur
 * @param contractAddress
 * @param contractAbi
 * @param tokenId
 */
export async function fetchOneMovie(contractAddress: string, contractAbi: any, tokenId: number) {
    if (provider) {
        let movie;
        // initialisation du contract
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);

        try {
            // récupération du tokenURI, url des metadonnée du token
            const tokenUri = await contract.tokenURI(tokenId);
            if (tokenUri) {
                movie = await getMovieData(tokenId, tokenUri);
            }
        } catch (err) {
            console.log(err);
            return null;
        }
        return movie;
    }
}

/**
 * Fonction qui ecoute les nouveaux films
 * @param eventType
 * @param contractAddress
 * @param contractAbi
 * @param addToMovieList
 */
export const listenToNewMovie = async (eventType: string, contractAddress: string, contractAbi: any, addToMovieList: Function) => {
    if (provider) {
        // initialisation du contract
        const contract = new ethers.Contract(contractAddress, contractAbi, provider);

        await contract.on(eventType, async (event: any) => {
            let tokenUri: string = '';
            // récupération de l'id du token parsé car initialement on le recoit en bigNumber
            const id = ethers.toNumber((event as EventLog).args[0]);
            // récupération du tokenURI, url des metadonnée du token
            tokenUri = await contract.tokenURI(id);
            if (tokenUri) {
                await addToMovieList(await getMovieData(id, tokenUri));
            }
        });
    }
}

/**
 * TODO refacto avec fetchMovie
 * Récupère la liste des acteurs pi d mintés
 * @returns la liste de tous les acteurs
 */
export const fetchAllMovies = async (): Promise<Movie[]> => {
    const movies:Movie[] = [];
    if (provider) {
        // Récupération des films par événement
        const contract = new ethers.Contract(contractsInterface.contracts.Movies.address, contractsInterface.contracts.Movies.abi, provider);
        const filter = contract.filters.MovieMinted;
        const events = await contract.queryFilter(filter, 0) as EventLog[];

        try {
            for (const event of events) {
                // récupération de l'id du token parsé car initialement on le recoit en bigNumber
                const id = ethers.toNumber((event as EventLog).args[0]);
                // récupération du tokenURI, url des metadonnée du token
                const tokenUri = await contract.tokenURI(id);

                if (tokenUri) {
                    movies.push(await getMovieData(id, tokenUri));
                }
            }
        } catch (err) {
            console.log(err);
        }
    }
    return movies;
}