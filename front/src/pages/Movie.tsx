import CardFilm from "../components/movies/CardFilm";
import {useEffect, useState} from "react";
import contractsInterface from "../contracts/contracts";
import {fetchMovie, listenToNewMovie} from "../services/MovieService.service";

const Movie = () => {
    const [movies, setMovies]: any = useState({});
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        const addToMovieList = async (movie: any) => {
            if(!movies[movie.id]){
                movies[movie.id] = movie;
                setMovies(movies);
            }
        }

        (async () => {
            setLoading(true)
            await  fetchMovie("MovieMinted", contractsInterface.contracts.Movies.address, contractsInterface.contracts.Movies.abi, addToMovieList);
            await listenToNewMovie("MovieMinted", contractsInterface.contracts.Movies.address, contractsInterface.contracts.Movies.abi, addToMovieList);
            setLoading(false)
        })();
    }, [movies,setMovies]);

    return (
        <article>
            <h2>Les Films en compétition du devfest 2023</h2>
            <section>
                {!isLoading && movies && Object.keys(movies).length > 0 && Object.keys(movies).map((film: any) => (
                    <CardFilm
                        key={movies[film].id}
                        Title={movies[film].Title}
                        Description={movies[film].Description}
                        Picture={movies[film].Picture}
                        Director={movies[film].Director}
                    />
                ))}
            </section>
        </article>
    )
}

export default Movie;
