import { provider } from "../provider/providers";
import { ethers, EventLog } from "ethers";
import { ipfsGetContent, ipfsGetUrl } from "../components/common/ipfs";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import contractsInterface from "../contracts/contracts";
import { Movie } from "../types/Movie";

const movieContract = new ethers.Contract( contractsInterface.contracts.Movies.address, contractsInterface.contracts.Movies.abi, provider );
const eventMovieMinted = 'MovieMinted';
/**
 * Récuperation des data et creation de l'objet movie
 * @param tokenId
 * @param tokenUri
 */
export const getMovieData = async ( tokenId: number, tokenUri: string ): Promise<Movie> => {
    // parse des données récupérées en object
    const metadataString = await ipfsGetContent( tokenUri );
    const data = JSON.parse( uint8ArrayToString( metadataString, 'utf8' ) );

    // récuperation du réalisateur
    const contractDirector = new ethers.Contract( contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, provider );
    const tokenUriDirector = await contractDirector.tokenURI( data.attributes[3].value );
    const metaDataStringDirector = await ipfsGetContent( tokenUriDirector );
    const dataDirector = JSON.parse( uint8ArrayToString( metaDataStringDirector, 'utf8' ) );

    return {
        id: tokenId,
        title: data.attributes[0].value,
        description: data.attributes[1].value,
        picture: ipfsGetUrl( data.attributes[2].value ),
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
 */
export const fetchMovies = async (): Promise<Movie[]> => {
    // création du filtre
    const filter = movieContract.filters[eventMovieMinted];
    // récupération des evenements en fonction du filtre
    const events = await movieContract.queryFilter( filter, 0 ) as EventLog[];
    const movies: Movie[] = [];
    try {
        for ( const event of events ) {
            // récupération de l'id du token parsé car initialement on le recoit en bigNumber
            const id = ethers.toNumber( ( event as EventLog ).args[0] );
            // récupération du tokenURI, url des metadonnée du token
            const tokenUri = ( event as EventLog ).args[1];

            movies.push( await getMovieData( id, tokenUri ) );
        }
    } catch ( err ) {
        const message = "Erreur de lors récupération des films";
        console.log( message, err );
        throw message;
    }
    return movies;
}

/**
 * Récuperation d'un film avec sont réalisateur
 * @param tokenId
 */
export const fetchOneMovie = async ( tokenId: number ): Promise<Movie | undefined> => {
    let movie: Movie | undefined;
    try {
        // récupération du tokenURI, url des metadonnée du token
        const tokenUri = await movieContract.tokenURI( tokenId );
        if ( tokenUri ) {
            movie = await getMovieData( tokenId, tokenUri );
        }
    } catch ( err ) {
        const msg = "Erreur lors de la récupération du film";
        console.log( msg, err );
        throw msg;
    }
    return movie;
}

/**
 * Fonction qui ecoute les nouveaux films
 * @param onNewMovie
 */
export const listenToNewMovie = async ( onNewMovie: ( Movie: Movie ) => void ) => {
    await movieContract.on( eventMovieMinted, async ( ...args: Array<unknown> ) => {
        const [ tokenId, tokenUri ] = args;
        onNewMovie( await getMovieData( ethers.toNumber( tokenId as number ), tokenUri as string ) )
    } );
}

/**
 * Stop l'écoute des nouveaux films
 */
export const stopListenToNewMovie = async () => {
    await movieContract.removeAllListeners( eventMovieMinted );
}
