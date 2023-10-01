import { provider } from "../provider/providers";
import { ethers, EventLog } from "ethers";
import ipfs, { ipfsGetContent, ipfsGetUrl } from "../components/common/ipfs";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import contractsInterface from "../contracts/contracts";
import { Movie } from "../types/Movie";
import { MovieMetadata } from "../types/Metadata";
import { decodeError } from "../utils/error";

const MOVIE_CONTRACT = new ethers.Contract( contractsInterface.contracts.Movies.address, contractsInterface.contracts.Movies.abi, provider );
const EVENT_MOVIE_MINTED = 'MovieMinted';
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
    const filter = MOVIE_CONTRACT.filters[EVENT_MOVIE_MINTED];
    // récupération des evenements en fonction du filtre
    const events = await MOVIE_CONTRACT.queryFilter( filter, 0 ) as EventLog[];
    const movies: Movie[] = [];

    try {
        for ( const event of events ) {
            // récupération de l'id du token parsé car initialement on le recoit en bigNumber
            const id = ethers.toNumber( ( event as EventLog ).args[0] );
            // récupération du tokenURI, url des metadonnée du token
            const tokenUri = ( event as EventLog ).args[1];
            if ( tokenUri ) {
                movies.push( await getMovieData( id, tokenUri ) );
            }
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
        const tokenUri = await MOVIE_CONTRACT.tokenURI( tokenId );
        if ( tokenUri ) {
            movie = await getMovieData( tokenId, tokenUri );
        }
    } catch ( err ) {
        const message = "Erreur lors de la récupération du film";
        console.log( message, err );
        throw message;
    }
    return movie;
}

/**
 * Fonction qui ecoute les nouveaux films
 * @param onNewMovie
 */
export const listenToNewMovie = async ( onNewMovie: ( Movie: Movie ) => void ) => {
    await MOVIE_CONTRACT.on( EVENT_MOVIE_MINTED, async ( ...args: Array<unknown> ) => {
        const [ tokenId, tokenUri ] = args;
        onNewMovie( await getMovieData( ethers.toNumber( tokenId as number ), tokenUri as string ) )
    } );
}

/**
 * Stop l'écoute des nouveaux films
 */
export const stopListenToNewMovie = async () => {
    await MOVIE_CONTRACT.removeAllListeners( EVENT_MOVIE_MINTED );
}

/**
 * Génération des meta données du nft avec enregistrement sur ipfs
 * @param pictureUri
 * @param newFilm
 */
export const generateNFTMetadataMovieAndUploadToIpfs = async ( pictureUri: string, newFilm: Movie ) => {
    const NFTMetaData: MovieMetadata = {
        "description": "Movie generated NFT metadata",
        "external_url": "",
        "image": pictureUri,
        "name": "Movie DevFest",
        "attributes": [
            {
                "trait_type": "Title",
                "value": newFilm.title
            },
            {
                "trait_type": "Description",
                "value": newFilm.description
            },
            {
                "trait_type": "Picture",
                "value": pictureUri
            },
            {
                "trait_type": "TokenIdDirector",
                "value": newFilm.director.id
            }
        ]
    }

    const metadataString = JSON.stringify( NFTMetaData );

    try {
        // enregistrement des meta donné sur ipfs
        const ipfsResponse = await ipfs.add( metadataString, { pin: true } );
        // création de l'addresse des meta donnée
        return 'ipfs://' + ipfsResponse.cid;
    } catch ( e ) {
        throw `Erreur lors de l'écriture des méta données de la compétition sur IPFS`;
    }
}

/**
 * Fonction qui va appeler le smart contract pour minter le film
 * @param directorAddress
 * @param tokenUri
 * @param tokenIdDirector
 */
export const mintMovie = async ( directorAddress: string, tokenUri: string, tokenIdDirector: number ) => {
    const signer = await provider?.getSigner();

    // création de l'appel du mint
    const contract = new ethers.Contract( contractsInterface.contracts.Movies.address, contractsInterface.contracts.Movies.abi, signer );

    let receipt;
    try {
        const transaction = await contract.mint( directorAddress, tokenUri, tokenIdDirector );
        receipt = await transaction.wait();
    } catch ( e ) {
        const { error } = decodeError(e);
        console.log( "Transaction", error );
        throw `${ error }`;
    }

    if ( receipt && receipt.status == 1 ) {
        const movieMinted = ( receipt.logs as EventLog[] ).find( ( log ) => log.fragment && log.fragment.name === EVENT_MOVIE_MINTED );

        if ( !movieMinted ) {
            console.log( "receipt", receipt )
            throw "Evenement de création attendu"
        }

        return ethers.toNumber( movieMinted.args[0] );
    } else {
        console.log( "receipt", receipt )
        throw "Une erreur c'est produit durant la transaction"
    }
}
