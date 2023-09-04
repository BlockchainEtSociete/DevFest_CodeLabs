import SnackbarAlert from "../common/SnackbarAlert.tsx";
import {ChangeEvent, useState} from "react";
import {AlertColor} from "@mui/material";
import {ethers} from "ethers";
import {JuryMetadata} from "../../types/Metadata.ts";
import {provider} from "../../provider/providers.ts";
import contractsInterface from "../../contracts/contracts.ts";
import ipfs from "../common/ipfs.ts";
import {GenerateJuryGenerator, GenerateJuryImage, JuryInfos} from "./JuryImageGenerator.tsx";
import JuryDisplay from "./JuryDisplay.tsx";
import {dataUrlToFile, selectedPhotoToken} from "../../services/IpfsService.service.ts";

const JuryGenerator = () => {
    const [mitting, setMitting] = useState(false);

    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState<AlertColor | undefined>('success')

    const [Lastname, setLastname]: any = useState('');
    const [Firstname, setFirstname]: any = useState('');
    const [Picture, setPicture]: any = useState('');
    const [, setFile] = useState(null);
    const [Address, setAddress]: any = useState('');

    const [cardDataUrl, setCardDataUrl] = useState('');
    const [juryInfo, setJuryInfo] = useState({
        Firstname: '',
        Lastname: '',
        Picture: '',
        Address: '',
    });
    const [tokenURI, setTokenURI]: any = useState(0);

    /**
     * Verification du formulaire avant procédure du mint NFT
     * */
    const verifyFormJury = async () => {
        // Controle des champs
        if (!Firstname || Firstname.length === 0) {
            setMitting(false);
            setMessage(`Invalide Firstname`)
            setSeverity('error')
            setOpen(true)
            return false
        }
        if (!Lastname || Lastname.length === 0) {
            setMitting(false);
            setMessage(`Invalide Lastname`)
            setSeverity('error')
            setOpen(true)
            return false;
        }
        if (!Picture) {
            setMitting(false);
            setMessage(`Invalide Picture`)
            setSeverity('error')
            setOpen(true)
            return false;
        }
        if (!Address || Address.length === 0 || !ethers.isAddress(Address)) {
            setMitting(false);
            setMessage(`Invalide Address wallet`)
            setSeverity('error')
            setOpen(true)
            return false;
        }

        // Création du jury
        const newJury = {
            Firstname,
            Lastname,
            Picture,
            Address
        }
        setJuryInfo(newJury);

        if(juryInfo){
            await createURIPicture(newJury);
        }
    }

    /**
     * Création de l'image ipfs du jury
     * @param newJury
     */
    const createURIPicture = async (newJury: JuryInfos) => {
        // Upload de l'image sur ipfs
        const PictureFile = await dataUrlToFile(`data:image/*;${newJury.Picture}`, "jury.jpg");
        const ipfsPictureUploadResult = await ipfs.add(PictureFile, {pin: true}).catch((err: Error) => {
            setMessage(`IPFS: ${err.message}`)
            setSeverity('error')
            setOpen(true)
            setMitting(false);
        });

        // création de l'uri - addresse de l'image uploadé
        if (ipfsPictureUploadResult) {
            const PictureUri = `ipfs://${ipfsPictureUploadResult.cid}`

            // genere l'image des données a partir du html
            const cardBase64 = await GenerateJuryImage(newJury);

            if (cardBase64 && cardBase64 !== 'data:image/*;' && cardBase64 !== 'data:,') {
                setCardDataUrl(cardBase64)

                const cardFile = await dataUrlToFile(cardBase64, 'cardJury.jpg')

                const ipfsImageUploadResult = await ipfs.add(cardFile, {pin:true}).catch((err: Error) => {
                    console.log(err.message)
                    setMessage(`IPFS: ${err.message}`)
                    setSeverity('error')
                    setOpen(true)
                    setMitting(false)
                });

                if (ipfsImageUploadResult) {
                    const imageUri = `ipfs://${ipfsImageUploadResult.cid}`;

                    await generateNFTMetadataAndUploadToIpfs(imageUri, PictureUri, newJury);
                }
            }
        }
    }

    /**
     * Génération des meta données du nft avec enregistrement sur ipfs
     * @param imageUri
     * @param PictureUri
     * @param newJury
     */
    const generateNFTMetadataAndUploadToIpfs = async (imageUri: string, PictureUri: string, newJury: any,) => {
        const NFTMetaData: JuryMetadata = {
            "description": "Jury generated NFT metadata",
            "external_url": "",
            "image": imageUri,
            "name": "Jury DevFest",
            "attributes": [
                {
                    "trait_type": "Firstname",
                    "value": newJury.Firstname
                },
                {
                    "trait_type": "Lastname",
                    "value": newJury.Lastname
                },
                {
                    "trait_type": "Picture",
                    "value": PictureUri
                },
                {
                    "trait_type": "Address",
                    "value": newJury.Address
                }
            ]
        }

        const metadataString = JSON.stringify(NFTMetaData);

        // enregistrement des meta donnés sur ipfs
        const ipfsResponse = await ipfs.add(metadataString, {pin: true}).catch((err: Error) => {
            setMessage(`IPFS: ${err.message}`)
            setSeverity('error')
            setOpen(true)
            setMitting(false);
        });
        // création de l'addresse des meta donnée
        if (ipfsResponse) {
            const tokenURI = 'ipfs://' + ipfsResponse.cid;
            await mintJury(tokenURI);
        }
        setMitting(false);
    }

    /**
     * fonction qui Mint le token uri dans la blockchain
     * @param tokenURI
     */
    async function mintJury(tokenURI: string) {
        setMitting(true);
        const signer = await provider?.getSigner();
        // création de l'appel du mint
        const contract = new ethers.Contract(contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, signer);
        const transaction = await contract.mint(Address, tokenURI);

        // récuperation de l'id du token minté
        await contract.on('*', (event) => {
            if(event.eventName === 'JuryMinted'){
                const uri = ethers.toNumber(event.args[2]);
                setTokenURI(uri);
            }
        });

        // récupération des informations du mint
        await transaction.wait().then(async (receipt: any) => {
            if (receipt && receipt.status == 1) {
                setFirstname('');
                setLastname('');
                setPicture('');
                setAddress('');
                setMessage(`Minting in success`)
                setSeverity('success')
                setOpen(true)
                setTimeout(
                    function () {
                        setOpen(false)
                    }, 5000);
            }
        }).catch((err: any) => {
            if (err) {
                setMitting(false);
                setMessage(`Minting in error`)
                setSeverity('error')
                setOpen(true)
                setTimeout(
                    function () {
                        setOpen(false)
                    }, 5000);
            }
        })

        setMessage('Minting finished ! :)')
        setSeverity('success')
        setOpen(true)
        return true;
    }

    /**
     * Choix de la photo
     * @param event
     */
    const selectedPhoto = (event: ChangeEvent<HTMLInputElement>) => {
        selectedPhotoToken(event, setFile, setPicture);
    };

    return (
        <section>
            <h3>Ajout d'un nouveau jury</h3>
            <div>
                <div className="form-ligne">
                    <label>
                        Prénom :
                        <input name="Firstname" onChange={e => setFirstname(e.target.value)} value={Firstname}/>
                    </label>
                </div>
                <div className="form-ligne">
                    <label>
                        Nom :
                        <input name="Lastname" onChange={e => setLastname(e.target.value)} value={Lastname}/>
                    </label>
                </div>
                <div className="form-ligne">
                    <label>
                        Photo :
                        <div>
                            <img src={Picture} style={{width: '200px'}}/>
                        </div>
                        <input name="Picture" type="file" onChange={selectedPhoto}/>
                    </label>
                </div>
                <div className="form-ligne">
                    <label>
                        Addresse wallet :
                        <input name="Address" onChange={e => setAddress(e.target.value)}
                               value={Address}/>
                    </label>
                </div>
            </div>

            <button onClick={verifyFormJury} disabled={mitting}>Ajouter</button>

            <GenerateJuryGenerator cardInfos={juryInfo} cardDataUrl={cardDataUrl} />

            <div>
                <SnackbarAlert open={open} setOpen={setOpen} message={message} severity={severity} />
                <JuryDisplay tokenURI={tokenURI}/>
            </div>
        </section>
    )
}
export default JuryGenerator;
