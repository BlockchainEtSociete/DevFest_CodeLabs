import { provider } from "../provider/providers";
import { ContractTransactionResponse, ethers, EventLog } from "ethers";
import contractsInterface from "../contracts/contracts";
import { fetchOneActor, fetchOneDirector } from "./PeopleService.service";
import { fetchOneMovie } from "./MovieService.service";
import { TypeCompetitions, WinnerOfCompetition } from "../types/Competition";

/**
 * Désignation du gagnant et envoie de la récompense
 * @param competitionId
 * @param setMessage
 * @param setSeverity
 */
export const designateWinner = async ( competitionId: number ): Promise<WinnerOfCompetition | undefined> => {
    if ( provider ) {
        // TODO récupérer le signer à partir de l'objet provider (cf. import ci dessus)

        // création de l'appel du mint
        const contract = new ethers.Contract( contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer );

        try {
            // TODO appeler la fonction designateWinner du contrat Compétition (variable ci dessus)
            // TODO attendre la fin de la transaction et récupérer le résultat

            if ( receipt && receipt.status == 1 ) {

                const winnerDesignated = ( receipt.logs as EventLog[] ).find( ( log ) => log.fragment && log.fragment.name === "WinnerDesignated" )

                if ( !winnerDesignated ) {
                    console.log( "receipt", receipt, transaction )
                    throw "Evenement de gagnant désigné attendu"
                }

                const tokenIdNominee = ethers.toNumber( winnerDesignated.args[1] );
                const typeCompetition: TypeCompetitions = ethers.toNumber( winnerDesignated.args[3] );
                return await getWinner( tokenIdNominee, typeCompetition );
            } else {
                console.log( "Le gagant n'a pas pu être désigné", receipt, transaction )
                throw "Le gagant n'a pas pu etre désigné"
            }
        } catch ( e ) {
            console.log( "Erreur lors de la désigation du gagnant", e )
        }
    }
    return;
}

/**
 * Récuperation du gagant de la compétiton
 * @param competitionId id de cla compétition
 * @param typeCompetition type de la compétition (enum TypeCompetitions)
 * @returns le gagnant et un bouléen indiquant s'il y a eu au moins un vote sur la compétition
 */
export const fetchWinner = async ( competitionId: number, typeCompetition: TypeCompetitions ): Promise<{
    winner?: WinnerOfCompetition,
    atLeastOneVote: boolean
}> => {
    if ( provider ) {
        try {
            const contract = new ethers.Contract( contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, provider );

            const filterVoteEvents = contract.filters.VotedOnCompetition( competitionId, null, null );
            const voteEvents = await contract.queryFilter( filterVoteEvents, 0 );
            if ( !voteEvents || voteEvents.length === 0 ) {
                // Aucun vote sur la compétition
                return { winner: undefined, atLeastOneVote: false }
            }

            const filter = contract.filters.WinnerDesignated( competitionId, null, null, null );
            const events = await contract.queryFilter( filter, 0 );
            let tokenIdNominee, winner;
            for ( const event of events ) {
                if ( competitionId === ethers.toNumber( ( event as EventLog ).args[0] ) ) {
                    tokenIdNominee = ethers.toNumber( ( event as EventLog ).args[1] );
                    winner = await getWinner( tokenIdNominee, typeCompetition );
                    break;
                }
            }

            return { winner, atLeastOneVote: true }
        } catch ( e ) {
            console.log( "Erreur lors de la récupération du gagnant", e );
        }
    }
    return { winner: undefined, atLeastOneVote: false }
}

const getWinner = async ( tokenIdNominee: number, typeCompetition: TypeCompetitions ): Promise<WinnerOfCompetition | undefined> => {
    let winner: WinnerOfCompetition | undefined;

    if ( typeCompetition === TypeCompetitions.Actor ) {
        const actor = await fetchOneActor( tokenIdNominee );
        if ( actor ) {
            const { firstname, lastname } = actor;
            const title = `${ firstname } ${ lastname }`;
            winner = { title };
        }
    } else if ( typeCompetition === TypeCompetitions.Director ) {
        //director
        const director = await fetchOneDirector( tokenIdNominee );
        if ( director ) {
            const { firstname, lastname } = director;
            const title = `${ firstname } ${ lastname }`;
            winner = { title };
        }
    } else {
        //movie
        const movie = await fetchOneMovie( tokenIdNominee );
        if ( movie ) {
            const { title } = movie;
            winner = { title };
        }
    }

    return winner;
}
