import { ChangeEvent, useEffect, useState } from "react";
import ipfs from "../common/ipfs";
import { Director } from "../../types/People";
import {
    fetchDirectors,
    getDirectorAddress,
    listenToNewDirector,
    stopListenToNewDirector
} from "../../services/PeopleService.service";
import SnackbarAlert from "../common/SnackbarAlert";
import { AlertColor } from "@mui/material";
import { Movie } from "../../types/Movie";
import {
    generateNFTMetadataMovieAndUploadToIpfs,
    getMovieData,
    mintMovie
} from "../../services/MovieService.service";

const MovieGenerator = () => {
    const [ , setLoading ] = useState( false );
    const [ mitting, setMitting ] = useState( false );

    const [ open, setOpen ] = useState( false )
    const [ message, setMessage ] = useState( '' )
    const [ severity, setSeverity ] = useState<AlertColor | undefined>( 'success' )
    const [ directors, setDirectors ] = useState<Director[]>( [] );

    const [ title, setTitle ] = useState( '' );
    const [ description, setDescription ] = useState( '' );
    const [ picture, setPicture ] = useState( '' );
    const [ tokenIdDirector, setTokenIdDirector ] = useState( -1 );
    const [ , setFile ] = useState( null );

    const [ movie, setMovie ] = useState<Movie>();

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

    /**
     * Form events management
     */
    const updateTitle = ( e: ChangeEvent<HTMLInputElement> ) => setTitle( e.target.value );
    const updateDescription = ( e: ChangeEvent<HTMLTextAreaElement> ) => setDescription( e.target.value );
    const updateTokenIdDirector = ( e: ChangeEvent<HTMLSelectElement> ) => setTokenIdDirector( Number( e.target.value ) );

    /**
     * Verification du formulaire avant procédure du mint NFT
     * */
    const onClickAddMovie = async () => {
        // controle des champs
        if ( !title || title.length == 0 ) {
            setMitting( false );
            setMessage( `Invalide title` )
            setSeverity( 'error' )
            setOpen( true )
            return false;
        }
        if ( !description || description.length == 0 ) {
            setMitting( false );
            setMessage( `Invalid description` )
            setSeverity( 'error' )
            setOpen( true )
            return false;
        }
        if ( !picture ) {
            setMitting( false );
            setMessage( `invalid picture` )
            setSeverity( 'error' )
            setOpen( true )
            return false;
        }
        if ( !tokenIdDirector && tokenIdDirector <= 0 ) {
            setMitting( false );
            setMessage( `Invalid token id director` )
            setSeverity( 'error' )
            setOpen( true )
            return false;
        }

        // Creation du film
        const newFilm: Movie = {
            id: -1,
            title,
            description,
            picture,
            director: {
                id: tokenIdDirector,
                firstname: '',
                lastname: '',
                picture: '',
                address: ''
            }
        }

        // Upload de l'image sur ipfs
        const PictureFile = await dataUrlToFile( `data:image/*;${ newFilm.picture }` )
        const ipfsPictureUploadResult = await ipfs.add( PictureFile, { pin: true } ).catch( ( err: Error ) => {
            setMessage( `IPFS: ${ err.message }` )
            setSeverity( 'error' )
            setOpen( true )
            setMitting( false );
        } );

        const directorAddress = await getDirectorAddress(tokenIdDirector);

        // création de l'uri - addresse de l'image uploadé
        if ( ipfsPictureUploadResult ) {
            const pictureUri = `ipfs://${ ipfsPictureUploadResult.cid }`
            let tokenURI;
            try {
                tokenURI = await generateNFTMetadataMovieAndUploadToIpfs( pictureUri, newFilm );
            } catch ( e ) {
                setMessage( `IPFS: ${ e }` )
                setSeverity( 'error' )
                setOpen( true )
                setMitting( false );
            }
            if ( tokenURI ) {
                await createMovie( directorAddress, tokenURI );
            }
            setMitting( false );
        }
    }

    /**
     * Fonction qui appel le smart contract afin de minter le token uri dans la blockchain
     */
    const createMovie = async ( directorAddress: string, tokenURI: string ) => {
        setMitting( true );

        try {
            console.log('minting movie to ' + directorAddress);
            const idToken = await mintMovie( directorAddress, tokenURI, tokenIdDirector );
            await displayMinted( idToken, tokenURI );

            setTitle( '' );
            setDescription( '' );
            setPicture( '' );
            setTokenIdDirector( -1 );

            setTimeout(
                function () {
                    setOpen( false )
                }, 5000 );

            setMessage( 'Minting finished ! :)' )
            setSeverity( 'success' )
            setOpen( true )
            return true;

        } catch ( e ) {
            setMitting( false );
            setMessage( `Un probleme est surveneu pendant le mint : ` + e )
            setSeverity( 'error' )
            setOpen( true )
            setTimeout(
                function () {
                    setOpen( false )
                }, 5000 );
        }
    }

    /**
     * Affiche briévement le film minté
     */
    const displayMinted = async ( idToken: number, tokenURI: string ) => {
        setMovie( await getMovieData( idToken, tokenURI ) );

        setTimeout(
            function () {
                setMovie( undefined );
            }, 5000 );
    }

    /**
     * Choix de la photo
     * @param event
     */
    const selectedPhoto = ( event: ChangeEvent<HTMLInputElement> ) => {
        const filesUploaded = event.currentTarget.files;
        if ( filesUploaded && filesUploaded.length > 0 ) {
            setPictureBase64( filesUploaded[0] );
        }
    };

    /**
     * Set l'url de la photo
     * @param file
     */
    const setPictureBase64 = ( file: any ) => {
        setFile( file );
        let reader = new FileReader();
        reader.readAsDataURL( file );
        reader.onload = function () {
            setPicture( reader.result as string );
        };
        reader.onerror = function ( error ) {
            console.log( 'Error: ', error );
        };
    };

    /**
     * création d'un fichier a partir d'une url base 64
     * @param src
     */
    const dataUrlToFile = async ( src: string ) => {
        return ( fetch( src )
            .then( function ( res ) {
                return res.arrayBuffer();
            } ) )
            .then( function ( buf ) {
                return new File( [ buf ], 'people.jpg', { type: 'image/*' } );
            } )
    };

    return (
        <div>
            <h3>Ajout d'un nouveau film</h3>
            <div>
                <div className="form-ligne">
                    <label>
                        Title :
                        <input name="Title" onChange={ updateTitle } value={ title }/>
                    </label>
                </div>
                <div className="form-ligne form-description">
                    <label>
                        Description :
                    </label>
                    <textarea name="Description" rows={ 5 } cols={ 25 } value={ description }
                              onChange={ updateDescription }/>
                </div>
                <div className="form-ligne">
                    <label>
                        Photo :
                        <div>
                            <img src={ picture } style={ { width: '200px' } }/>
                        </div>
                        <input name="Picture" type="file" onChange={ selectedPhoto }/>
                    </label>
                </div>
                <div className="form-ligne">
                    <label>Réalisateur :
                        <select name="type" onChange={ updateTokenIdDirector }>
                            <option>Sélectionner un réalisateur</option>
                            { directors && directors.length > 0 && directors.map( ( director: Director ) => (
                                <option key={ director.id }
                                        value={ director.id }>{ director.firstname } { director.lastname }</option>
                            ) )
                            }
                        </select>
                    </label>
                </div>
            </div>

            <button onClick={ onClickAddMovie } disabled={ mitting }> Ajout d'un nouveau film</button>

            <div>
                <SnackbarAlert open={ open } setOpen={ setOpen } message={ message } severity={ severity }/>
            </div>
            <div style={ { margin: 'auto', width: 200 } }>
                { movie &&
                    <div>
                        <h3>Apercu :</h3>
                        <img src={ movie.picture } alt={ movie.title } style={ { height: '200px' } }/>
                        <p>{ movie.title }</p>
                    </div>
                }
            </div>
        </div>
    )
}
export default MovieGenerator;
