import PeopleCard from "../components/peoples/PeopleCard";
import { useEffect, useState } from "react";
import { fetchActors, listenToNewActor, stopListenToNewActor } from "../services/PeopleService.service";
import { Actor as ActorType } from "../types/People";
import { CircularProgress } from "@mui/material";

const Actor = () => {
    const [ actors, setActors ] = useState<ActorType[]>( [] );
    const [ isLoading, setLoading ] = useState<boolean>( false );

    useEffect( () => {
        ( async () => {
            await stopListenToNewActor();
            await listenToNewActor( ( actor ) => setActors( [ ...actors, actor ] ) );
        } )();
    }, [ actors ] )

    useEffect( () => {
        ( async () => {
            setLoading( true )
            try {
                setActors( await fetchActors() );
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
            <h2>Les Acteurs en compétition du devfest 2023</h2>
            <section style={ { display: 'flex', justifyContent: 'center', flexWrap: 'wrap' } }>
                { !isLoading && actors && actors.length > 0 && actors.map( ( actor: ActorType ) => (
                    <PeopleCard
                        key={ actor.id }
                        firstname={ actor.firstname }
                        lastname={ actor.lastname }
                        picture={ actor.picture }
                    />
                ) ) }
            </section>
        </div>
    )
}
export default Actor;
