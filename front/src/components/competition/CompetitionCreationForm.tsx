import { useEffect, useState } from "react";
import { dataUrlToFile, selectedPhotoToken } from "../../services/IpfsService.service.ts";
import { AlertColor } from "@mui/material";
import ipfs from "../common/ipfs";
import { AwardMetadata } from "../../types/Metadata";
import { provider } from "../../provider/providers";
import { ethers, ContractTransactionResponse, EventLog } from "ethers";
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
    const [nameAward, setNameAward]: any = useState('');
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

    const updateTypeCompetition = (e: React.ChangeEvent<HTMLSelectElement>) => setTypeCompetition(parseInt(e.target.value));
    const updateTitleCompetition = (e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value);
    const updateStartDate = (e: React.ChangeEvent<HTMLInputElement>) => setStartDate(getTimestamp(e.target.value));
    const updateEndDate = (e: React.ChangeEvent<HTMLInputElement>) => setEndDate(getTimestamp(e.target.value));
    const updateNameAward = (e: React.ChangeEvent<HTMLInputElement>) => setNameAward(e.target.value);

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
    const generateNFTMetadataAndUploadToIpfs = async (PictureUri: string, Name: string) => {
        const NFTMetaData: AwardMetadata = {
            "description": "Movie generated NFT metadata",
            "external_url": "",
            "image": PictureUri,
            "name": "Movie DevFest",
            "attributes": [
                {
                    "trait_type": "Name",
                    "value": Name
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

        try {
            // création de la compétition
            const transaction:ContractTransactionResponse = await contract.addCompetition(title, tokenURI, typeCompetition, startDate, endDate);

            // vérification que la transaction c'est bien passé
            const receipt = await transaction.wait();

            if (receipt && receipt.status == 1) {

                const competitionSessionRegistered = (receipt.logs as EventLog[]).find((log) => log.fragment && log.fragment.name === "CompetitionSessionRegistered")

                if (!competitionSessionRegistered) {
                    console.log("receipt", receipt)
                    throw "Evenement de création attendu"
                }

                const competitionId = ethers.toNumber(competitionSessionRegistered.args[0]);
                setTokenId(competitionId);

                setMessage(`Minting in success`)
                setSeverity('success')
                setOpen(true)
                setTimeout(
                    function () {
                        setOpen(false)
                    }, 5000);
                
                setOpenNominees(true)
                setOpenCompetition(false)

            } else {
                console.log("receipt", receipt)
                throw "Receipt status incorrect"
            }
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

        return false;
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
        if (!nameAward || nameAward.length == 0) {
            setMinting(false);
            setMessage(`Invalide Name Award`)
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
            await generateNFTMetadataAndUploadToIpfs(PictureUri, nameAward);
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
                <label> Nom de la récompense :
                    <input name="nameAward" type="text" onChange={updateNameAward} />
                </label>
            </div>
            <div className="form-ligne">
                <label>
                    Photo de la récompense :
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
