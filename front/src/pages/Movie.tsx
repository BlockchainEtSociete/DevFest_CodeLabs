import CardFilm from "../components/movies/CardFilm";
import { useEffect, useState } from "react";
import { fetchMovies, listenToNewMovie, stopListenToNewMovie } from "../services/MovieService.service";
import { Movie as MovieType } from "../types/Movie";
import { CircularProgress } from "@mui/material";

const Movie = () => {
    const [ movies, setMovies ] = useState<MovieType[]>( [] );
    const [ isLoading, setLoading ] = useState( false );

    useEffect( () => {
        ( async () => {
            await stopListenToNewMovie();
            await listenToNewMovie( ( movie ) => setMovies( [ ...movies, movie ] ) );
        } )();
    }, [ movies ] )

    useEffect( () => {
        ( async () => {
            setLoading( true )
            try {
                setMovies( await fetchMovies() );
            } catch ( e ) {
                console.log( "Erreur lors de la récupération des films", e );
            } finally {
                setLoading( false )
            }
            setLoading( false )
        } )();
    }, [] );

    return (
        <div>
            { isLoading && <CircularProgress/> }
            <h2>Les Films en compétition du devfest 2023</h2>
            <section>
                { !isLoading && movies && movies.length > 0 && movies.map( ( film: MovieType ) => (
                    <CardFilm
                        key={ film.id }
                        title={ film.title }
                        description={ film.description }
                        picture={ film.picture }
                        director={ film.director }
                    />
                ) ) }
            </section>
        </div>
    )
}
export default Movie;

