import SnackbarAlert from "../common/SnackbarAlert";
import { ChangeEvent, useState } from "react";
import { AlertColor } from "@mui/material";
import { ethers } from "ethers";
import ipfs from "../common/ipfs";
import { GenerateJuryGenerator, GenerateJuryImage, JuryInfos } from "./JuryImageGenerator";
import { dataUrlToFile, selectedPhotoToken } from "../../services/IpfsService.service";
import { generateNFTMetadataJuryAndUploadToIpfs, mintJury } from "../../services/JuryService.service";

const JuryGenerator = () => {
    const [ mitting, setMitting ] = useState( false );

    const [ open, setOpen ] = useState( false )
    const [ message, setMessage ] = useState( '' )
    const [ severity, setSeverity ] = useState<AlertColor | undefined>( 'success' )

    const [ lastname, setLastname ] = useState( '' );
    const [ firstname, setFirstname ] = useState( '' );
    const [ picture, setPicture ] = useState( '' );
    const [ , setFile ] = useState( null );
    const [ address, setAddress ] = useState( '' );

    const [ cardDataUrl, setCardDataUrl ] = useState( '' );
    const [ juryInfo, setJuryInfo ] = useState( {
        firstname: '',
        lastname: '',
        picture: '',
        address: '',
    } );

    /**
     * Form events management.
     */
    const selectedPhoto = ( event: ChangeEvent<HTMLInputElement> ) => selectedPhotoToken( event, setFile, setPicture )
    const updateFirstname = ( event: ChangeEvent<HTMLInputElement> ) => setFirstname( event.target.value )
    const updateLastname = ( event: ChangeEvent<HTMLInputElement> ) => setLastname( event.target.value )
    const updateAddress = ( event: ChangeEvent<HTMLInputElement> ) => setAddress( event.target.value )

    /**
     * Verification du formulaire avant procédure du mint NFT
     * */
    const onClickAddJury = async () => {
        // Controle des champs
        if ( !firstname || firstname.length === 0 ) {
            setMitting( false );
            setMessage( `Invalide firstname` )
            setSeverity( 'error' )
            setOpen( true )
            return false
        }
        if ( !lastname || lastname.length === 0 ) {
            setMitting( false );
            setMessage( `Invalide lastname` )
            setSeverity( 'error' )
            setOpen( true )
            return false;
        }
        if ( !picture ) {
            setMitting( false );
            setMessage( `Invalide picture` )
            setSeverity( 'error' )
            setOpen( true )
            return false;
        }
        if ( !address || address.length === 0 || !ethers.isAddress( address ) ) {
            setMitting( false );
            setMessage( `Invalide address wallet` )
            setSeverity( 'error' )
            setOpen( true )
            return false;
        }

        // Création du jury
        const newJury: JuryInfos = {
            firstname,
            lastname,
            picture,
            address
        }
        setJuryInfo( newJury );

        if ( juryInfo ) {
            await createURIPicture( newJury );
        }
    }

    /**
     * Création de l'image ipfs du jury
     * @param newJury
     */
    const createURIPicture = async ( newJury: JuryInfos ) => {
        // Upload de l'image sur ipfs
        const pictureFile = await dataUrlToFile( `data:image/*;${ newJury.picture }`, "jury.jpg" );
        const ipfsPictureUploadResult = await ipfs.add( pictureFile, { pin: true } ).catch( ( err: Error ) => {
            setMessage( `IPFS: ${ err.message }` )
            setSeverity( 'error' )
            setOpen( true )
            setMitting( false );
        } );

        // création de l'uri - addresse de l'image uploadé
        if ( ipfsPictureUploadResult ) {
            const pictureUri = `ipfs://${ ipfsPictureUploadResult.cid }`

            // genere l'image des données a partir du html
            const cardBase64 = await GenerateJuryImage( newJury );

            if ( cardBase64 && cardBase64 !== 'data:image/*;' && cardBase64 !== 'data:,' ) {
                setCardDataUrl( cardBase64 )

                const cardFile = await dataUrlToFile( cardBase64, 'cardJury.jpg' )

                const ipfsImageUploadResult = await ipfs.add( cardFile, { pin: true } ).catch( ( err: Error ) => {
                    console.log( err.message )
                    setMessage( `IPFS: ${ err.message }` )
                    setSeverity( 'error' )
                    setOpen( true )
                    setMitting( false )
                } );

                if ( ipfsImageUploadResult ) {
                    const imageUri = `ipfs://${ ipfsImageUploadResult.cid }`;
                    let tokenURI;
                    try {
                        tokenURI = await generateNFTMetadataJuryAndUploadToIpfs( imageUri, pictureUri, newJury )
                    } catch ( e ) {
                        setMessage( `IPFS: ${ e }` )
                        setSeverity( 'error' )
                        setOpen( true )
                        setMitting( false );
                    }
                    if ( tokenURI ) {
                        await createJury( tokenURI );
                    }
                    setMitting( false );
                }
            }
        }
    }

    /**
     * fonction qui Mint le token uri dans la blockchain
     * @param tokenURI
     */
    const createJury = async ( tokenURI: string ) => {
        setMitting( true );
        try {
            await mintJury( address, tokenURI );

            setFirstname( '' );
            setLastname( '' );
            setPicture( '' );
            setAddress( '' );

            setTimeout(
                function () {
                    setOpen( false )
                    setCardDataUrl( '' )
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

    return (
        <section>
            <h3>Ajout d'un nouveau jury</h3>
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
            </div>

            <button onClick={ onClickAddJury } disabled={ mitting }>Ajouter</button>

            <GenerateJuryGenerator cardInfos={ juryInfo }/>
            {
                cardDataUrl ?
                    <div>
                        <img id="generatedCard" src={ cardDataUrl }
                             alt={ `${ juryInfo.firstname } ${ juryInfo.lastname }` }></img>
                    </div>
                    : ''
            }
            <div>
                <SnackbarAlert open={ open } setOpen={ setOpen } message={ message } severity={ severity }/>
            </div>
        </section>
    )
}
export default JuryGenerator;
