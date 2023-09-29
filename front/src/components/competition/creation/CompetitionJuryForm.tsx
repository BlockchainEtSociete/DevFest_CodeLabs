import { AlertColor } from "@mui/material";
import { useEffect, useState } from "react";
import { fetchAllJuries, listenToNewJury, stopListenToNewJury } from "../../../services/JuryService.service";
import { Jury } from "../../../types/Jury";
import { addJurysToCompetition } from "../../../services/CompetitionService.service";

export interface CompetitionJuryFormProps {
    competitionId: number,
    setOpen: ( open: boolean ) => void,
    setMessage: ( message: string ) => void,
    setSeverity: ( severity: AlertColor | undefined ) => void,
    setIsLoading: ( open: boolean ) => void,
    isLoading: boolean,
    onJuriesAdded: () => void
}

export const CompetitionJuryForm = ( { competitionId, setOpen, setMessage, setSeverity, setIsLoading, isLoading, onJuriesAdded: onJuriesAddedToCompetition }: CompetitionJuryFormProps ) => {
    const [ selectedIdsJury, setSelectedIdsJury ] = useState<number[]>( [] );
    const [ jurys, setJurys ] = useState<Jury[]>( [] );

    useEffect( () => {
        ( async () => {
            await stopListenToNewJury()
            await listenToNewJury( ( jury ) => setJurys( [ ...jurys, jury ] ) );
        } )();
    }, [ jurys ] );

    useEffect( () => {

        ( async () => {
            setIsLoading( true )
            try {
                setJurys( await fetchAllJuries() );
            } catch ( e ) {
                console.log( "Erreur lors de la récupération des jurys", e );
            } finally {
                setIsLoading( false )
            }
            setIsLoading( false )
        } )();
    }, [] )


    const updateSelectedJurysCompetition = ( e: React.ChangeEvent<HTMLInputElement> ) => {
        if ( e.target.checked && !selectedIdsJury.includes( parseInt( e.target.value ) ) ) {
            setSelectedIdsJury( [ ...selectedIdsJury, parseInt( e.target.value ) ] );
        } else if ( !e.target.checked && selectedIdsJury.includes( parseInt( e.target.value ) ) ) {
            setSelectedIdsJury( selectedIdsJury.filter( ( id: number ) => id !== parseInt( e.target.value ) ) );
        }
    }

    /**
     * Action d'ajout des jurys à la compétition
     */
    const onAddJuriesToCompetition = async () => {
        if ( selectedIdsJury.length === 0 ) {
            setMessage( `Au moins 1 jury doit être sélectionné` )
            setSeverity( 'error' )
            setOpen( true )
            return false;
        }

        try {
            setIsLoading( true )
            await addJurysToCompetition( competitionId, selectedIdsJury );

            onJuriesAddedToCompetition()
            setMessage( "Minting success" )
            setSeverity( "success" )
            setOpen( true )
            setTimeout(
                function () {
                    setOpen( false )
                }, 5000 );
        } catch ( e ) {
            const msg = "Erreur lors de l'ajout d'un jury";
            console.log( msg, e );
            setMessage( msg )
            setSeverity( "error" )
            setOpen( true )
        } finally {
            setIsLoading( false )
        }
    }

    return (
        <div className="form-ligne">
            <h5>Les Jurys : </h5>
            <div style={ { display: 'flex', justifyContent: 'center', flexDirection: 'column' } }>
                {
                    jurys.map( ( jury: Jury ) => (
                        <label key={ jury.id }> { jury.lastname } { jury.firstname } :
                            <input name="jury" type="checkbox" onChange={ updateSelectedJurysCompetition }
                                   value={ jury.id }/>
                        </label> )
                    )
                }
            </div>
            <div>
                <button onClick={ onAddJuriesToCompetition } disabled={ isLoading }>Ajout des Jurys de la compétition</button>
            </div>
        </div>
    )
}
