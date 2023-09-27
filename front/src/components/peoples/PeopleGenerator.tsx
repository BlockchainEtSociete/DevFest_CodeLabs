import { ChangeEvent, useState } from "react";
import { ethers } from "ethers";
import "../../styles/formBlock.css";
import ipfs from "../common/ipfs";
import PeopleDisplay from "./PeopleDisplay";
import { AlertColor } from "@mui/material";
import SnackbarAlert from "../common/SnackbarAlert";
import { generateNFTMetadataAndUploadToIpfs, mintPeople } from "../../services/PeopleService.service";
import { People } from "../../types/People";

const PeopleGenerator = () => {
    const [ mitting, setMitting ] = useState( false );
    const [ open, setOpen ] = useState( false )
    const [ message, setMessage ] = useState( '' )
    const [ severity, setSeverity ] = useState<AlertColor | undefined>( 'success' )

    const [ type, setType ]: any = useState( 1 );
    const [ lastname, setLastname ] = useState( '' );
    const [ firstname, setFirstname ] = useState( '' );
    const [ picture, setPicture ] = useState( '' );
    const [ , setFile ] = useState( null );
    const [ address, setAddress ] = useState( '' );
    const [ tokenUri, setTokenUri ] = useState( '' );

    const updateFirstname = ( e: React.ChangeEvent<HTMLInputElement> ) => setFirstname( e.target.value )
    const updateLastname = ( e: React.ChangeEvent<HTMLInputElement> ) => setLastname( e.target.value )
    const updateAddress = ( e: React.ChangeEvent<HTMLInputElement> ) => setAddress( e.target.value )
    const updateType = ( e: React.ChangeEvent<HTMLSelectElement> ) => setType( e.target.value )

    /**
     * Verification du formulaire avant procédure du mint NFT
     * */
    const onClickAddPeople = async () => {
        // Controle des champs
        if ( !firstname || firstname.length === 0 ) {
            setMitting( false );
            setMessage( `Prénom non renseigné` )
            setSeverity( 'error' )
            setOpen( true )
            return false
        }
        if ( !lastname || lastname.length === 0 ) {
            setMitting( false );
            setMessage( `Nom non rensigné` )
            setSeverity( 'error' )
            setOpen( true )
            return false;
        }
        if ( !picture ) {
            setMitting( false );
            setMessage( `Image non selectionné` )
            setSeverity( 'error' )
            setOpen( true )
            return false;
        }
        if ( !address || address.length === 0 || !ethers.isAddress( address ) ) {
            setMitting( false );
            setMessage( `L'address du wallet est incorrect` )
            setSeverity( 'error' )
            setOpen( true )
            return false;
        }

        // Création de people
        const newPeopleInfo: People = {
            id: -1,
            firstname,
            lastname,
            picture,
            address
        }

        // Upload de l'image sur ipfs
        const PictureFile = await dataUrlToFile( `data:image/*;${ newPeopleInfo.picture }` )
        const ipfsPictureUploadResult = await ipfs.add( PictureFile, { pin: true } ).catch( ( err: Error ) => {
            setMessage( `IPFS: ${ err.message }` )
            setSeverity( 'error' )
            setOpen( true )
            setMitting( false );
        } );

        // création de l'uri - addresse de l'image uploadé
        if ( ipfsPictureUploadResult ) {
            const PictureUri = `ipfs://${ ipfsPictureUploadResult.cid }`
            let tokenUri;
            try {
                tokenUri = await generateNFTMetadataAndUploadToIpfs( PictureUri, newPeopleInfo );
            } catch ( e ) {
                setMessage( `IPFS: ${ e }` )
                setSeverity( 'error' )
                setOpen( true )
                setMitting( false );
            }
            if ( tokenUri ) {
                await createPeople( tokenUri );
            }
            setMitting( false );
        }
    }

    /**
     * fonction qui set l'id du token une fois le mint reussi
     * @param tokenURI
     */
    async function createPeople( tokenURI: string ) {
        setMitting( true );

        try {
            await mintPeople( tokenURI, type );
            setTokenUri( tokenURI );

            setFirstname( '' );
            setLastname( '' );
            setPicture( '' );
            setAddress( '' );
            setType( 1 );
            setFile( null );
            setMessage( `Minting in success` )
            setSeverity( 'success' )
            setOpen( true )
            setTimeout(
                function () {
                    setOpen( false )
                }, 5000 );

        } catch ( e ) {
            setMitting( false );
            setMessage( `Un probleme est surveneu pendant le mint.` )
            setSeverity( 'error' )
            setOpen( true )
            setTimeout(
                function () {
                    setOpen( false )
                }, 5000 );
        }

        setMessage( 'Minting finished ! :)' )
        setSeverity( 'success' )
        setOpen( true )
        return true;
    }

    /**
     * Form events management.
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
        <section>
            <h3>Ajout d'un acteur ou réalisateur</h3>
            <div>
                <div className="form-ligne">
                    <label>
                        Prénom :
                        <input name="Firstname" onChange={ updateFirstname } value={ firstname }/>
                    </label>
                </div>
                <div className="form-ligne">
                    <label>
                        Nom :
                        <input name="Lastname" onChange={ updateLastname } value={ lastname }/>
                    </label>
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
                    <label>
                        Addresse wallet :
                        <input name="Address" onChange={ updateAddress }
                               value={ address }/>
                    </label>
                </div>
                <div className="form-ligne">
                    <label htmlFor="type">Type :
                        <select id="type" onChange={ updateType }>
                            <option value={ 1 }>Acteur</option>
                            <option value={ 2 }>Réalisateur</option>
                        </select>
                    </label>
                </div>
            </div>

            <button onClick={ onClickAddPeople } disabled={ mitting }>Ajout d'une nouvelle personne</button>

            <div>
                <SnackbarAlert open={ open } setOpen={ setOpen } message={ message } severity={ severity }/>
                <PeopleDisplay tokenUri={ tokenUri }/>
            </div>
        </section>
    )
}
export default PeopleGenerator;
