import PeopleCard from "../components/peoples/PeopleCard";
import { useEffect, useState } from "react";
import { fetchDirectors, listenToNewDirector, stopListenToNewDirector } from "../services/PeopleService.service";
import { Director as DirectorType } from "../types/People";
import { CircularProgress } from "@mui/material";

const Director = () => {
    const [ directors, setDirectors ] = useState<DirectorType[]>( [] );
    const [ isLoading, setLoading ] = useState<boolean>( false );

    useEffect( () => {
        ( async () => {
            await stopListenToNewDirector();
            await listenToNewDirector( ( director ) => setDirectors( [ ...directors, director ] ) );
        } )();
    }, [ directors ] )

    useEffect( () => {
        ( async () => {
            setLoading( true )
            try {
                setDirectors( await fetchDirectors() );
            } catch ( e ) {
                console.log( "Erreur lors de la récupération des acteurs", e );
            } finally {
                setLoading( false )
            }
            setLoading( false )
        } )();
    }, [] );

    return (
        <div>
            { isLoading && <CircularProgress/> }
            <h2>Les Réalisateurs en compétition du devfest 2023</h2>
            <section style={ { display: 'flex', justifyContent: 'center', flexWrap: 'wrap' } }>
                { !isLoading && directors && directors.length > 0 && directors.map( ( director: DirectorType ) => (
                    <PeopleCard
                        key={ director.id }
                        firstname={ director.firstname }
                        lastname={ director.lastname }
                        picture={ director.picture }
                    />
                ) ) }
            </section>
        </div>
    )
}
export default Director;
