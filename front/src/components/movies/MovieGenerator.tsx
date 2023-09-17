import {ChangeEvent, useEffect, useState} from "react";
import {ethers} from "ethers";
import contractsInterface from "../../contracts/contracts";
import ipfs from "../common/ipfs";
import {MovieMetadata} from "../../types/Metadata";
import {provider} from "../../provider/providers";
import MovieDisplay from "./MovieDisplay";
import {fetchPeople, listenToNewPeople} from "../../services/PeopleService.service";
import SnackbarAlert from "../common/SnackbarAlert";
import {AlertColor} from "@mui/material";

const MovieGenerator = () => {
    const [, setLoading] = useState(false);
    const [mitting, setMitting] = useState(false);

    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState<AlertColor | undefined>('success')
    const [directors, setDirectors]: any = useState({});

    const [Title, setTitle]: any = useState('');
    const [Description, setDescription]: any = useState('');
    const [Picture, setPicture]: any = useState('');
    const [TokenIdDirector, setTokenIdDirector]: any = useState(0);
    const [, setFile] = useState(null);

    const [tokenId, setTokenId]: any = useState(0);

    /**
     * Récupération de la liste des réalisateurs pour ajouter l'id au film
     */
    useEffect(() => {
        const addToDirectors = async (people: any) => {
            if (!directors[people.id]) {
                directors[people.id] = people;
                setDirectors(directors);
            }
        }

        (async () => {
            setLoading(true)
            await fetchPeople("DirectorMinted", contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, addToDirectors);
            await listenToNewPeople("DirectorMinted", contractsInterface.contracts.Directors.address, contractsInterface.contracts.Directors.abi, addToDirectors);
            setLoading(false)
        })();
    }, [directors, setDirectors]);

    /**
     * Form events management
     */
    const updateTitle = (e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value);
    const updateDescription = (e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value);
    const updateTokenIdDirector = (e: ChangeEvent<HTMLSelectElement>) => setTokenIdDirector(e.target.value);

    /**
     * Verification du formulaire avant procédure du mint NFT
     * */
    const verifyForm = async () => {
        // controle des champs
        if(!Title || Title.length == 0){
            setMitting(false);
            setMessage(`Invalide Title`)
            setSeverity('error')
            setOpen(true)
            return false;
        }
        if(!Description || Description.length == 0){
            setMitting(false);
            setMessage(`Invalid Description`)
            setSeverity('error')
            setOpen(true)
            return false;
        }
        if(!Picture){
            setMitting(false);
            setMessage(`invalid Picture`)
            setSeverity('error')
            setOpen(true)
            return false;
        }
        if(!TokenIdDirector && TokenIdDirector == 0){
            setMitting(false);
            setMessage(`Invalid token id director`)
            setSeverity('error')
            setOpen(true)
            return false;
        }

        // Creation du film
        const newFilm = {
            Title,
            Description,
            Picture,
            TokenIdDirector
        }

        // Upload de l'image sur ipfs
        const PictureFile = await dataUrlToFile(`data:image/*;${newFilm.Picture}`)
        const ipfsPictureUploadResult = await ipfs.add(PictureFile, {pin: true}).catch((err: Error) => {
            setMessage(`IPFS: ${err.message}`)
            setSeverity('error')
            setOpen(true)
            setMitting(false);
        });

        // création de l'uri - addresse de l'image uploadé
        if (ipfsPictureUploadResult) {
            const PictureUri = `ipfs://${ipfsPictureUploadResult.cid}`
            await generateNFTMetadataAndUploadToIpfs(PictureUri, newFilm);
        }
    }

    /**
     * Génération des meta données du nft avec enregistrement sur ipfs
     * @param PictureUri
     * @param newFilm
     */
    const generateNFTMetadataAndUploadToIpfs = async (PictureUri: string, newFilm: any,) => {
        const NFTMetaData: MovieMetadata = {
            "description": "Movie generated NFT metadata",
            "external_url": "",
            "image": PictureUri,
            "name": "Movie DevFest",
            "attributes": [
                {
                    "trait_type": "Title",
                    "value": newFilm.Title
                },
                {
                    "trait_type": "Description",
                    "value": newFilm.Description
                },
                {
                    "trait_type": "Picture",
                    "value": PictureUri
                },
                {
                    "trait_type": "TokenIdDirector",
                    "value": newFilm.TokenIdDirector
                }
            ]
        }

        const metadataString = JSON.stringify(NFTMetaData);

        // enregistrement des meta donné sur ipfs
        const ipfsResponse = await ipfs.add(metadataString, {pin: true}).catch((err: Error) => {
            setMessage(`IPFS: ${err.message}`)
            setSeverity('error')
            setOpen(true)
            setMitting(false);
        });
        // création de l'addresse des meta donnée
        if (ipfsResponse) {
            const tokenURI = 'ipfs://' + ipfsResponse.cid;
            await mintMovie(tokenURI);
        }
        setMitting(false);
    }

    /**
     * Fonction qui appel le smart contract afin de minter le token uri dans la blockchain
     * @param tokenURI
     */
    async function mintMovie(tokenURI: string){
        setMitting(true);
        const signer = await provider?.getSigner();

        // création de l'appel du mint
        const contract = new ethers.Contract(contractsInterface.contracts.Movies.address, contractsInterface.contracts.Movies.abi, signer );
        const transaction = await contract.mint(tokenURI);

        // récupération de l'id du token minté
        await contract.on('*', (event) => {
            if (event.eventName == 'MovieMinted') {
                const id = ethers.toNumber(event.args[0]);
                setTokenId(id);
            }
        });

        // vérification que la transaction c'est bien passé
        await transaction.wait().then(async (receipt: any) => {
            if(receipt && receipt.status == 1){
                setTitle('');
                setDescription('');
                setPicture('');
                setTokenIdDirector('');
                setMessage(`Minting in success`)
                setSeverity('success')
                setOpen(true)
                setTimeout(
                    function () {
                        setOpen(false)
                    }, 5000);
            }
        }).catch((err: any )=> {
            if(err){
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
        const filesUploaded = event.currentTarget.files;
        if (filesUploaded && filesUploaded.length > 0) {
            setPictureBase64(filesUploaded[0]);
        }
    };

    /**
     * Set l'url de la photo
     * @param file
     */
    const setPictureBase64 = (file: any) => {
        setFile(file);
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            setPicture(reader.result as string);
        };
        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
    };

    /**
     * création d'un fichier a partir d'une url base 64
     * @param src
     */
    const dataUrlToFile = async (src: string) => {
        return (fetch(src)
            .then(function (res) {
                return res.arrayBuffer();
            }))
            .then(function (buf) {
                return new File([buf], 'people.jpg', {type: 'image/*'});
            })
    };

    return (
        <div>
            <h3>Ajout d'un nouveau film</h3>
            <div>
                <div className="form-ligne">
                    <label>
                        Title :
                        <input name="Title" onChange={updateTitle} value={Title} />
                    </label>
                </div>
                <div className="form-ligne form-description">
                    <label>
                        Description :
                    </label>
                    <textarea name="Description" rows={5} cols={25} value={Description} onChange={updateDescription}  />
                </div>
                <div className="form-ligne">
                    <label>
                        Photo :
                        <div>
                            <img src={Picture} style={{width: '200px'}}/>
                        </div>
                        <input name="Picture" type="file" onChange={selectedPhoto} />
                    </label>
                </div>
                <div className="form-ligne">
                    <label >Réalisateur :
                        <select name="type" onChange={updateTokenIdDirector}>
                            <option>Sélectionner un réalisateur</option>
                            {directors && Object.keys(directors).length > 0 && Object.keys(directors).map((director: any, index: number) => {
                                const idNumber = ethers.toNumber(directors[director].id);
                                return (
                                    <option key={directors[director].id} value={idNumber} >{directors[director].Firstname} {directors[director].Lastname}</option>
                                )
                            })
                            }
                        </select>
                    </label>
                </div>
            </div>

            <button onClick={verifyForm} disabled={mitting}> Ajout d'un nouveau film</button>

            <div>
                <SnackbarAlert open={open} setOpen={setOpen} message={message} severity={severity} />
                <MovieDisplay tokenId={tokenId} />
            </div>
        </div>
    )
}
export default MovieGenerator;
