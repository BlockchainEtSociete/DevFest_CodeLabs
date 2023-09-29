import { useEffect, useState } from "react";
import { fetchAllJuries, listenToNewJury, stopListenToNewJury } from "../services/JuryService.service";
import { Jury as JuryType } from "../types/Jury";
import { CircularProgress } from "@mui/material";

const Jury = () => {
    const [ jurys, setJurys ] = useState<JuryType[]>( [] );
    const [ isLoading, setLoading ] = useState( false );

    useEffect( () => {
        ( async () => {
            await stopListenToNewJury()
            await listenToNewJury( ( jury ) => setJurys( [ ...jurys, jury ] ) );
        } )();
    }, [ jurys ] );

    useEffect( () => {

        ( async () => {
            setLoading( true )
            try {
                setJurys( await fetchAllJuries() );
            } catch ( e ) {
                console.log( "Erreur lors de la récupération des jurys", e );
            } finally {
                setLoading( false )
            }
            setLoading( false )
        } )();
    }, [] )

    return (
        <div>
            { isLoading && <CircularProgress/> }
            <h2>Les Jurys des compétitions du devfest 2023</h2>
            <section style={ { display: 'flex', justifyContent: 'center', flexWrap: 'wrap' } }>
                { jurys.map( ( jury ) => (
                    <div key={ jury.id } style={ { width: '500px', height: '300px' } }>
                        <img src={ jury.picture } title={ jury.firstname + ' ' + jury.lastname }
                             alt={ jury.firstname + ' ' + jury.lastname } style={ { width: '400px', height: 'auto' } }/>
                    </div>
                ) ) }
            </section>
        </div>
    )
}
export default Jury;
