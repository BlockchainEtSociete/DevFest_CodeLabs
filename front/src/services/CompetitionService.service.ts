import { provider } from "../provider/providers";
import { Contract, ContractTransactionReceipt, ContractTransactionResponse, ethers, EventLog } from "ethers";
import contractsInterface from "../contracts/contracts";
import { ipfsGetContent, ipfsGetUrl } from "../components/common/ipfs";
import ipfs from "../components/common/ipfs";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import {
    fetchActors,
    fetchDirectors,
    fetchOneActor,
    fetchOneDirector,
    listenToNewActor,
    listenToNewDirector,
    stopListenToNewActor,
    stopListenToNewDirector
} from "./PeopleService.service";
import { fetchMovies, fetchOneMovie, listenToNewMovie, stopListenToNewMovie } from "./MovieService.service";
import {
    Competition,
    Nominee,
    TypeCompetitions,
    VotingCompetitionStatus,
    CompetitionAndVotingStatus
} from "../types/Competition";
import { AwardMetadata } from "../types/Metadata";
import { dataUrlToFile } from "./IpfsService.service";

/**
 * Evenements émits par le contrat Competition
 */
const CompetitionContractEvents = {
    NEW_COMPETITION: "CompetitionSessionRegistered"
}

/**
 * Récuperation de toutes les données d'une compétition
 * @param competitionId
 * @param contract
 */
export const getCompetitionData = async ( competitionId: number, contract: Contract ): Promise<Competition> => {
    // Récupération de la compétition
    const competition: Competition = await contract.getCompetition( competitionId );
    const nominees: Nominee[] = [];
    const typeCompetitions = ethers.toNumber( competition.typeCompetitions );

    if ( competition.nominees.length > 0 ) {
        if ( typeCompetitions === TypeCompetitions.Actor ) {
            //actor
            for ( const nominee of competition.nominees ) {
                const actor = await fetchOneActor( ethers.toNumber( nominee.tokenId ) );

                if ( actor ) {
                    const { id: tokenId, firstname, lastname, picture } = actor;
                    const title = `${ firstname } ${ lastname }`;
                    const pictureUrl = picture || '';

                    nominees.push( {
                        id: -1,
                        tokenId,
                        voteCount: ethers.toNumber( nominee.voteCount || 0 ),
                        pictureUrl,
                        title
                    } );
                }
            }
        } else if ( typeCompetitions === TypeCompetitions.Director ) {
            //director
            for ( const nominee of competition.nominees ) {
                const director = await fetchOneDirector( ethers.toNumber( nominee.tokenId ) );

                if ( director ) {
                    const { id: tokenId, firstname, lastname, picture } = director;
                    const title = `${ firstname } ${ lastname }`;
                    const pictureUrl = picture || '';

                    nominees.push( {
                        id: -1,
                        tokenId,
                        voteCount: ethers.toNumber( nominee.voteCount || 0 ),
                        pictureUrl,
                        title
                    } );
                }
            }
        } else {
            //movie
            for ( const nominee of competition.nominees ) {
                const movie = await fetchOneMovie( ethers.toNumber( nominee.tokenId ) );

                if ( movie ) {
                    const { id: tokenId, title, picture } = movie;
                    const pictureUrl = picture || '';

                    nominees.push( {
                        id: -1,
                        tokenId,
                        voteCount: ethers.toNumber( nominee.voteCount || 0 ),
                        pictureUrl,
                        title
                    } );
                }
            }
        }
    }

    // parse des données récupérées en object
    const { tokenURI } = competition;
    const metadataString = await ipfsGetContent( tokenURI )
    const data = JSON.parse( uint8ArrayToString( metadataString, 'utf8' ) )

    return {
        id: competitionId,
        tokenURI,
        status: VotingCompetitionStatus.Unknown,
        title: competition.title,
        nameAward: data.attributes[0].value,
        pictureUrl: ipfsGetUrl( data.attributes[1].value ),
        typeCompetitions,
        startTime: ethers.toNumber( competition.startTime ),
        endTime: ethers.toNumber( competition.endTime ),
        nominees,
        winnerCompetition: ethers.toNumber( competition.winnerCompetition ),
    };
}

/**
 * function permettant de récuperer la liste des compétitions
 * @param eventType
 * @param contractAddress
 * @param contractAbi
 * @param setCompetitions
 */
export const fetchCompetitions = async (): Promise<Competition[]> => {
    const competitions: Competition[] = [];
    if ( provider ) {
        const competitionsContract = new ethers.Contract( contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, provider );
        const filter = competitionsContract.filters[CompetitionContractEvents.NEW_COMPETITION];
        const events = await competitionsContract.queryFilter( filter, 0 );

        for ( const event of events ) {
            const competitionId = ethers.toNumber( ( event as EventLog ).args[0] );
            const competition = await getCompetitionData( competitionId, competitionsContract );

            if ( competition ) {
                competitions.push( competition );
            } else {
                console.log( `Pas de compétition trouvée pour [${ competitionId }]` );
            }
        }
    }
    return competitions;
}

/**
 * Fonction qui ecoute les nouvelles compétitions
 * @param newCompetitionCallback callback appelé lorsqu'une nouvelle compétition est créée
 */
export const listenToNewCompetition = async ( newCompetitionCallback: ( competition: Competition ) => void ) => {
    const contract = new ethers.Contract( contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, provider );

    contract.on( CompetitionContractEvents.NEW_COMPETITION, async ( event: number ) => {
        const competitionId = ethers.toNumber( event );
        newCompetitionCallback( await getCompetitionData( competitionId, contract ) );
    } );
}

/**
 * Fonction stoppe l'écoute des nouvelles compétitions
 */
export const stopListenToNewCompetition = () => {
    const contract = new ethers.Contract( contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, provider );
    contract.removeAllListeners( CompetitionContractEvents.NEW_COMPETITION );
}

/**
 * Récupération des compétitions d'un jury
 * @param juryId id technique du jury dans le contrat
 * @param status status des compétitions à récupérer
 * @param setLoading setter loading state
 * @param setCompetitions setter competitions state
 */
export const fetchCompetitionsOfOneJury = async ( juryId: number, status: VotingCompetitionStatus ) => {
    if ( provider ) {
        const signer = await provider?.getSigner();
        const contractCompetition = new ethers.Contract( contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer );

        const filter = contractCompetition.filters.JuryAddedToCompetition( null, juryId );
        const eventsOfJury: EventLog[] = await contractCompetition.queryFilter( filter, 0 ) as EventLog[];

        const competitions: Competition[] = []

        for ( const eventJury of eventsOfJury ) {
            const [ competitionId ] = eventJury.args

            try {
                const {
                    competition,
                    votingStatus
                }: CompetitionAndVotingStatus = await contractCompetition.getUnvotedCompetitionOfJury( competitionId )

                if ( ethers.toNumber( votingStatus ) === status ) {
                    const metadataString = JSON.parse( uint8ArrayToString( await ipfsGetContent( competition.tokenURI ), 'utf8' ) )
                    const pictureUrl = ipfsGetUrl( metadataString.attributes[1].value )

                    competitions.push( {
                        id: ethers.toNumber( competitionId ),
                        tokenURI: competition.tokenURI,
                        title: competition.title,
                        pictureUrl,
                        typeCompetitions: ethers.toNumber( competition.typeCompetitions ),
                        status: ethers.toNumber( votingStatus ),
                        startTime: ethers.toNumber( competition.startTime ),
                        endTime: ethers.toNumber( competition.endTime ),
                        nominees: competition.nominees,
                        winnerCompetition: ethers.toNumber( competition.winnerCompetition ),
                        nameAward: ""
                    } );
                } else {
                    console.log( `La compétition ${ competitionId } n'est pas ouverte` )
                }
            } catch ( err ) {
                console.log( `Erreur lors de la récupération de la compétition ${ competitionId } : `, err.reason )
            }
        }
        return competitions;
    }
}

/**
 * Rajoute les infos des nominés sur la compétition
 * @param competition compétition
 * @param setLoading setter loading state
 */
export async function fetchNomineesOfCompetition( competition: Competition, setLoading: ( loading: boolean ) => void ): Promise<Nominee[]> {
    const nominees: Nominee[] = []
    setLoading( true )

    const signer = await provider?.getSigner()
    const competitionsContract = new ethers.Contract( contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer );

    const filter = competitionsContract.filters.NomineeCompetitionsRegistered( competition.id, null, null );
    const eventsOfNominees: EventLog[] = await competitionsContract.queryFilter( filter, 0 ) as EventLog[];

    try {
        if ( competition.typeCompetitions === TypeCompetitions.Actor ) {
            for ( const nomineeEvent of eventsOfNominees ) {
                const nomineeId = ethers.toNumber( nomineeEvent.args[1] )
                const nomineeTokenId = ethers.toNumber( nomineeEvent.args[2] )

                const actor = await fetchOneActor( ethers.toNumber( nomineeTokenId ) );
                const title = `${ actor?.firstname } ${ actor?.lastname }`;
                const pictureUrl = actor?.picture || '';
                nominees.push( { tokenId: nomineeTokenId, title, pictureUrl, id: nomineeId } );
            }
        } else if ( competition.typeCompetitions === TypeCompetitions.Director ) {
            for ( const nomineeEvent of eventsOfNominees ) {
                const nomineeId = ethers.toNumber( nomineeEvent.args[1] )
                const nomineeTokenId = ethers.toNumber( nomineeEvent.args[2] )

                const director = await fetchOneDirector( ethers.toNumber( nomineeTokenId ) );
                const title = `${ director?.firstname } ${ director?.lastname }`;
                const pictureUrl = director?.picture || '';
                nominees.push( { tokenId: nomineeTokenId, title, pictureUrl, id: nomineeId } );
            }
        } else {
            // Movie
            for ( const nomineeEvent of eventsOfNominees ) {
                const nomineeId = ethers.toNumber( nomineeEvent.args[1] )
                const nomineeTokenId = ethers.toNumber( nomineeEvent.args[2] )

                const movie = await fetchOneMovie( ethers.toNumber( nomineeTokenId ) );
                const title = movie?.title;
                const pictureUrl = movie?.picture || '';
                nominees.push( { tokenId: nomineeTokenId, title, pictureUrl, id: nomineeId } );
            }
        }
    } catch ( e ) {
        console.log( "Erreur lors de la récupération des nominés", e )
    } finally {
        setLoading( false )
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
export async function voteOnCompetition( competition: Competition, nominee: Nominee, setLoading: ( loading: boolean ) => void ): Promise<boolean> {
    setLoading( true )
    try {
        const signer = await provider?.getSigner()
        const competitionsContract = new ethers.Contract( contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer );
        const receipt: ContractTransactionReceipt = await ( await competitionsContract.voteOnCompetition( competition.id, nominee.id ) ).wait()

        if ( receipt.status == 1 ) {
            return true
        }
        return false
    } catch ( e ) {
        console.log( "Erreur lors du vote sur une compétition", e )
        return false
    } finally {
        setLoading( false )
    }
}

/**
 * Création d'une compétition
 * @param title titre de la compétition
 * @param typeCompetition type de la compétition
 * @param startDate date de début de la compétition
 * @param endDate date de fin de la compétition
 * @param nameAward nom de la récompense de la compétition
 * @param picture image de la compétition
 * @returns
 */
export async function createCompetition( title: string, typeCompetition: TypeCompetitions, startDate: number, endDate: number, nameAward: string, picture: string ): Promise<number> {
    // Upload de l'image sur ipfs
    const pictureFile = await dataUrlToFile( `data:image/*;${ picture }`, 'competition.jpg' )
    const ipfsPictureUploadResult = await ipfs.add( pictureFile, { pin: true } );

    // Création de l'uri - addresse de l'image uploadé
    let tokenURI;
    if ( ipfsPictureUploadResult ) {
        tokenURI = await generateNFTMetadataAndUploadToIpfs( `ipfs://${ ipfsPictureUploadResult.cid }`, nameAward );
    } else {
        throw "Aucune image uploadée sur IPFS"
    }

    return await callAddCompetitionContract( title, typeCompetition, startDate, endDate, tokenURI );
}

/**
 * Génération des meta données avec enregistrement sur IPFS du trophé du gagant
 * @param pictureUri metadate uri vers l'image sur IPFS
 * @param name metadate name
 */
const generateNFTMetadataAndUploadToIpfs = async ( pictureUri: string, name: string ) => {
    const nftMetaData: AwardMetadata = {
        "description": "Movie generated NFT metadata",
        "external_url": "",
        "image": pictureUri,
        "name": "Movie DevFest",
        "attributes": [
            {
                "trait_type": "Name",
                "value": name
            },
            {
                "trait_type": "Picture",
                "value": pictureUri
            }
        ]
    }
    const metadataString = JSON.stringify( nftMetaData );

    const ipfsResponse = await ipfs.add( metadataString, { pin: true } );
    if ( ipfsResponse ) {
        return 'ipfs://' + ipfsResponse.cid;
    } else {
        throw "Erreur lors de l'écriture des méta données de la compétition sur IPFS"
    }
}


/**
 * Fonction qui appel le smart contract afin de créer la compétition
 * @param tokenURI token IPFS
 */
const callAddCompetitionContract = async ( title: string, typeCompetition: TypeCompetitions, startDate: number, endDate: number, tokenURI: string ): Promise<number> => {
    const signer = await provider?.getSigner();
    const contract = new ethers.Contract( contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer );

    // création de la compétition
    const transaction: ContractTransactionResponse = await contract.addCompetition( title, tokenURI, typeCompetition, startDate, endDate );

    // vérification que la transaction c'est bien passé
    const receipt = await transaction.wait();

    if ( receipt && receipt.status == 1 ) {

        const competitionSessionRegistered = ( receipt.logs as EventLog[] ).find( ( log ) => log.fragment && log.fragment.name === CompetitionContractEvents.NEW_COMPETITION )

        if ( !competitionSessionRegistered ) {
            console.log( "receipt", receipt )
            throw "Evenement de création attendu"
        }

        const competitionId = ethers.toNumber( competitionSessionRegistered.args[0] );
        return competitionId;

    } else {
        console.log( "receipt", receipt )
        throw "Receipt status incorrect"
    }
}

/**
 * Permet de récupérer le nom d'une compétition et l'image de sa récompense
 * @param competitionId
 * @returns
 */
export const getCompetitionImageAndAwardName = async ( competitionId: number ): Promise<{
    image: Uint8Array,
    awardName: string
}> => {
    const contract = new ethers.Contract( contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, provider );
    const competition: Competition = await contract.getCompetition( competitionId );

    if ( competition ) {
        const metadataString = await ipfsGetContent( competition.tokenURI )

        const metadata = JSON.parse( uint8ArrayToString( metadataString, 'utf8' ) )
        const awardName = metadata.attributes[0].value
        const image = await ipfsGetContent( metadata.attributes[1].value )

        return {
            image,
            awardName
        }
    } else {
        throw `La compétition ${ competitionId } n'existe pas`;
    }
}

/**
 * Rajoute les infos des nominés éligibles à l'ajout sur une compétition
 * @param typeCompetition type de compétition
 */
export const fetchEligibleNomineesByTypeCompetition = async ( typeCompetition: TypeCompetitions ): Promise<Nominee[]> => {
    const nominees: Nominee[] = []

    try {
        if ( typeCompetition === TypeCompetitions.Actor ) {
            const actors = await fetchActors();
            for ( const { id, firstname: Firstname, lastname: Lastname, picture: Picture } of actors ) {
                const title = `${ Firstname } ${ Lastname }`;
                const pictureUrl = Picture || '';

                nominees.push( { tokenId: id, title, pictureUrl, id: -1 } );
            }
        } else if ( typeCompetition === TypeCompetitions.Director ) {
            const directors = await fetchDirectors();
            for ( const { id, firstname: Firstname, lastname: Lastname, picture: Picture } of directors ) {
                const title = `${ Firstname } ${ Lastname }`;
                const pictureUrl = Picture || '';

                nominees.push( { tokenId: id, title, pictureUrl, id: -1 } );
            }
        } else {
            // Movie
            const movies = await fetchMovies()
            for ( const { id, title, picture: Picture } of movies ) {
                const pictureUrl = Picture || '';

                nominees.push( { tokenId: id, title, pictureUrl, id: -1 } );
            }
        }
    } catch ( e ) {
        const msg = "Erreur lors de la récupération des nominés";
        console.log( "Erreur lors de la récupération des nominés", e )
        throw msg
    }
    return nominees;
}

/**
 * Ecoute les événements nouvel acteur/directeur/film
 * @param typeCompetition permet de déterminer acteur/directeur/film
 * @param onNewNominee fonction de callback appelée avec acteur/directeur/film converti en nominé
 * @returns
 */
export const listenToNewPeopleAndMovieByTypeCompetition = async ( typeCompetition: TypeCompetitions, onNewNominee: ( nominee: Nominee ) => void ) => {
    if ( typeCompetition === TypeCompetitions.Actor ) {
        return listenToNewActor( ( { id, firstname: Firstname, lastname: Lastname, picture: Picture } ) => {
            const title = `${ Firstname } ${ Lastname }`;
            const pictureUrl = Picture || '';

            onNewNominee( { tokenId: id, title, pictureUrl, id: -1 } );
        } );
    } else if ( typeCompetition === TypeCompetitions.Director ) {
        return listenToNewDirector( ( { id, firstname: Firstname, lastname: Lastname, picture: Picture } ) => {
            const title = `${ Firstname } ${ Lastname }`;
            const pictureUrl = Picture || '';

            onNewNominee( { tokenId: id, title, pictureUrl, id: -1 } );
        } );
    } else {
        return listenToNewMovie( ( { id, title, picture: Picture } ) => {
            const pictureUrl = Picture || '';

            onNewNominee( { tokenId: id, title, pictureUrl, id: -1 } );
        } );
    }

}

/**
 * Arrête l'écoute
 * @param typeCompetition
 * @returns
 */
export const stopListenToNewPeopleAndMovieByTypeCompetition = async ( typeCompetition: TypeCompetitions ) => {
    if ( typeCompetition === TypeCompetitions.Actor ) {
        return stopListenToNewActor();
    } else if ( typeCompetition === TypeCompetitions.Director ) {
        return stopListenToNewDirector();
    } else {
        return stopListenToNewMovie();
    }
}

/**
 * Permet d'ajouter les nominés à une compétitions
 * @param competitionId id de la compétition
 * @param nomineesTokenIds token id des nominés
 * @returns
 */
export const addNomineesToCompetition = async ( competitionId: number, nomineesTokenIds: number[] ): Promise<undefined> => {
    const signer = await provider?.getSigner();
    const competitionsContract = new ethers.Contract( contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer );

    for ( const nomineeTokenId of nomineesTokenIds ) {
        try {
            const receipt: ContractTransactionReceipt = await ( await competitionsContract.addNomineeCompetition( competitionId, nomineeTokenId ) ).wait();
            if ( receipt.status !== 1 ) {
                throw `Mauvais status de transaction [${ receipt.status }]`
            }
        } catch ( e ) {
            const msg = `Erreur lors de la l'ajout du nominé [${ nomineeTokenId }] à la compétition [${ competitionId }]`;
            console.log( msg, e );
            throw msg;
        }
    }

    return;
}


/**
 * Permet d'ajouter les nominés à une compétitions
 * @param competitionId id de la compétition
 * @param jurysTokenIds token id des nominés
 * @returns
 */
export const addJurysToCompetition = async ( competitionId: number, jurysTokenIds: number[] ): Promise<undefined> => {
    const signer = await provider?.getSigner();
    const competitionsContract = new ethers.Contract( contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer );

    for ( const juryTokenId of jurysTokenIds ) {
        try {
            const receipt: ContractTransactionReceipt = await ( await competitionsContract.addJuryToCompetition( competitionId, juryTokenId ) ).wait();
            if ( receipt.status !== 1 ) {
                throw `Mauvais status de transaction [${ receipt.status }]`
            }
        } catch ( e ) {
            const msg = `Erreur lors de la l'ajout du jury [${ juryTokenId }] à la compétition [${ competitionId }]`;
            console.log( msg, e );
            throw msg;
        }
    }

    return;
}
