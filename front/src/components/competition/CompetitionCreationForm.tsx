import { useEffect, useState } from "react";
import { dataUrlToFile, selectedPhotoToken } from "../../services/IpfsService.service.ts";
import { AlertColor } from "@mui/material";
import ipfs from "../common/ipfs";
import { CompetitionMetadata } from "../../types/Metadata";
import { provider } from "../../provider/providers";
import { ethers } from "ethers";
import contractsInterface from "../../contracts/contracts";
import { getTimestamp } from "../../utils/dateUtils";

export interface CompetitionCreationFormProps {
    reset: boolean,
    minting: boolean,
    setMinting: (minting: boolean) => void,
    setTokenId: (tokenId: number) => void,
    typeCompetition: number,
    setTypeCompetition: (typeCompetition: number) => void,
    setOpenCompetition: (openCompetition: boolean) => void,
    setOpenNominees: (openNominee: boolean) => void,
    setOpen: (open: boolean) => void,
    setMessage: (message: string) => void,
    setSeverity: (severity: AlertColor | undefined) => void,
}

export const CompetitionCreationForm = ({reset, minting, setMinting, setTokenId, typeCompetition, setTypeCompetition, setOpenCompetition, setOpenNominees, setOpen, setMessage, setSeverity}: CompetitionCreationFormProps) => {
    const [title, setTitle]: any = useState('');
    const [Picture, setPicture]: any = useState('');
    const [startDate, setStartDate]: any = useState(0);
    const [endDate, setEndDate]: any = useState(0);
    const [, setFile] = useState(null);

    useEffect(() => {
        if (reset) {
            setTitle('');
            setPicture('');
            setTypeCompetition(-1);
            setStartDate(0);
            setEndDate(0);
            setFile(null);
            setTokenId(0);
        }
    }, [reset, setTitle, setPicture, setTypeCompetition, setStartDate, setEndDate, setFile, setTokenId]);

    const updateTypeCompetition = (e: React.ChangeEvent<HTMLInputElement>) => setTypeCompetition(parseInt(e.target.value));
    const updateTitleCompetition = (e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value);
    const updateStartDate = (e: React.ChangeEvent<HTMLInputElement>) => setStartDate(getTimestamp(e.target.value));
    const updateEndDate = (e: React.ChangeEvent<HTMLInputElement>) => setEndDate(getTimestamp(e.target.value));

    /**
     * Choix de la photo
     * @param event
     */
    const selectedPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
        selectedPhotoToken(event, setFile, setPicture);
    };

    /**
     * Génération des meta données avec enregistrement sur ipfs
     * @param PictureUri
     * @param Title
     */
    const generateNFTMetadataAndUploadToIpfs = async (PictureUri: string, Title: string) => {
        const NFTMetaData: CompetitionMetadata = {
            "description": "Movie generated NFT metadata",
            "external_url": "",
            "image": PictureUri,
            "name": "Movie DevFest",
            "attributes": [
                {
                    "trait_type": "Title",
                    "value": Title
                },
                {
                    "trait_type": "Picture",
                    "value": PictureUri
                }
            ]
        }
        const metadataString = JSON.stringify(NFTMetaData);

        // enregistrement des meta donné sur ipfs
        const ipfsResponse = await ipfs.add(metadataString, {pin: true}).catch((err: Error) => {
            setMessage(`IPFS: ${err.message}`)
            setSeverity('error')
            setOpen(true)
            setMinting(false);
        });
        // création de l'addresse des meta donnée
        if (ipfsResponse) {
            const tokenURI = 'ipfs://' + ipfsResponse.cid;
            await createCompetition(tokenURI);
        }
        setMinting(false);
    }
    
    /**
     * Fonction qui appel le smart contract afin de créer le token
     * @param tokenURI
     */
    const createCompetition = async (tokenURI: string) => {
        setMinting(true);
        const signer = await provider?.getSigner();

        // création de l'appel du mint
        const contract = new ethers.Contract(contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer);
        let transaction;

        try {
            transaction = await contract.addCompetition(tokenURI, typeCompetition, startDate, endDate);
        } catch (e) {
            setMinting(false);
            setMessage(`Minting in error`)
            setSeverity('error')
            setOpen(true)
            setTimeout(
                function () {
                    setOpen(false)
                }, 5000);
        }

        // récupération de l'id du token minté
        await contract.on('*', (event) => {
            if (event.eventName == 'CompetitionSessionRegistered') {
                const id = ethers.toNumber(event.args[0]);
                setTokenId(id);
            }
        });

        // vérification que la transaction c'est bien passé
        await transaction.wait().then(async (receipt: any) => {
            if(receipt && receipt.status == 1){
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
                setMinting(false);
                setMessage(`Minting in error`)
                setSeverity('error')
                setOpen(true)
                setTimeout(
                    function () {
                        setOpen(false)
                    }, 5000);
            }
        })

        setOpenNominees(true)
        setOpenCompetition(false)

        setMessage('Minting finished ! :)')
        setSeverity('success')
        setOpen(true)
        return true;
    }

    /**
     * Verification des données de la compétition avant sauvegarde dans la blockchain
     */
    const verifyForm = async () => {
        // controle des champs
        if (!startDate || (new Date(startDate)).getTime() <= 0) {
            setMinting(false);
            setMessage(`Invalide start date`)
            setSeverity('error')
            setOpen(true)
            return false
        }
        if (!endDate || (new Date(endDate)).getTime() <= 0 || endDate < startDate) {
            setMinting(false);
            setMessage(`Invalide end date`)
            setSeverity('error')
            setOpen(true)
            return false
        }
        if (typeCompetition > 2 || typeCompetition < 0) {
            setMinting(false);
            setMessage(`Invalide type competition`)
            setSeverity('error')
            setOpen(true)
            return false
        }
        if (!Picture) {
            setMinting(false);
            setMessage(`invalid Picture`)
            setSeverity('error')
            setOpen(true)
            return false;
        }
        if (!title || title.length == 0) {
            setMinting(false);
            setMessage(`Invalide Title`)
            setSeverity('error')
            setOpen(true)
            return false;
        }

        // Upload de l'image sur ipfs
        const PictureFile = await dataUrlToFile(`data:image/*;${Picture}`, 'competition.jpg')
        const ipfsPictureUploadResult = await ipfs.add(PictureFile, {pin: true}).catch((err: Error) => {
            setMessage(`IPFS: ${err.message}`)
            setSeverity('error')
            setOpen(true)
            setMinting(false);
        });

        // création de l'uri - addresse de l'image uploadé
        if (ipfsPictureUploadResult) {
            const PictureUri = `ipfs://${ipfsPictureUploadResult.cid}`
            await generateNFTMetadataAndUploadToIpfs(PictureUri, title);
        }
    }

    return (
        <div>
            <div className="form-ligne">
                <label> Titre de la compétition :
                    <input name="title" type="text" onChange={updateTitleCompetition} />
                </label>
            </div>
            <div className="form-ligne">
                <label> Type de compétition :
                    <select name="type" onChange={updateTypeCompetition}>
                        <option>Selectionnez le type de compétition {typeCompetition}</option>
                        <option value={0}>Acteur</option>
                        <option value={1}>Réalisateur</option>
                        <option value={2}>Film</option>
                    </select>
                </label>
            </div>
            <div className="form-ligne">
                <label> Debut de la compétition :
                    <input name="startDate" type="datetime-local" onChange={updateStartDate} />
                </label>
            </div>
            <div className="form-ligne">
                <label> Fin de la competition :
                    <input name="endDate" type="datetime-local" onChange={updateEndDate} />
                </label>
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

            <button onClick={verifyForm} disabled={minting}>Ajout d'une nouvelle compétition</button>
        </div>
    )
}
