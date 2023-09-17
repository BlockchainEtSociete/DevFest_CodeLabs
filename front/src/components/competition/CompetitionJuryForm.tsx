import { AlertColor } from "@mui/material";
import { useEffect, useState } from "react";
import { fetchJury, listenToNewJury } from "../../services/JuryService.service";
import contractsInterface from "../../contracts/contracts";
import { provider } from "../../provider/providers";
import { ethers } from "ethers";
import { fetchIdsByFilter } from "../../services/CompetitionService.service";

export interface CompetitionJuryFormProps {
    reset: boolean,
    minting: boolean,
    tokenId: number,
    setMinting: (minting: boolean) => void,
    setOpenJury: (openJury: boolean) => void,
    setOpen: (open: boolean) => void,
    setMessage: (message: string) => void,
    setSeverity: (severity: AlertColor | undefined) => void,
}

export const CompetitionJuryForm = ({reset, minting, tokenId, setMinting, setOpenJury, setOpen, setMessage, setSeverity}: CompetitionJuryFormProps) => {
    const [idJury, setIdJury]: any = useState(0);
    const [jurys, setJurys]: any = useState([]);
    const [idsJury, setIdsJurys]: any = useState([]);
    const [, setIdsCompetition]: any = useState();

    useEffect(() => {
        const addToJurys = async (jury: any) => {
            jurys[jury.id] = jury;
            setJurys(jurys);
        }

        (async () => {
            await fetchJury("JuryMinted", contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, addToJurys);
            await listenToNewJury("JuryMinted", contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, addToJurys);
        })();
        if (reset) {
            setIdJury(0);
        }
    }, [jurys, setJurys, reset, setIdJury])

    const updateIdJuryCompetition = (e: React.ChangeEvent<HTMLInputElement>) => setIdJury(Number(e.target.value));

    /**
     * Verification des données des jurys de la competitions avant sauvegarde dans la blockchain
     */
    const verifyFormJury = async () => {
        if (!Number.isInteger(idJury) && idJury != 0) {
            setMinting(false);
            setMessage(`Invalide id`)
            setSeverity('error')
            setOpen(true)
            return false;
        }
        await addJurysCompetition();
    }

    /**
     * Fonction qui appel le smart contract afin d'ajouter les jurys de la compétition
     */
    const addJurysCompetition = async () => {
        setMinting(true);
        const signer = await provider?.getSigner();
        // building smart contract call
        const contract = new ethers.Contract(contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer );
        let transaction;

        try {
            transaction = await contract.addJuryToCompetition(tokenId, idJury);
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

                await getIdsJury();
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

        setIdJury(0);

        setMessage('Minting finished ! :)')
        setSeverity('success')
        setOpen(true)
        return true;
    }

    /**
     * Récupération des ids jury deja ajouté à la competition et les enlevers de la liste
     */
    const getIdsJury = async () => {
        try {
            await fetchIdsByFilter(tokenId, null, contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, setIdsCompetition, setIdsJurys);
            !idsJury.includes(idJury) ? idsJury.push(idJury) : '';
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
    }

    return (
        <div  className="form-ligne">
            <h5>Les Jurys : </h5>
            <div style={{display: 'flex', justifyContent: 'center', flexDirection: 'column'}}>
                { jurys && Object.keys(jurys).length > 0 && Object.keys(jurys).map((jury: any) => {
                    const fullName = jurys[jury].Lastname + " " + jurys[jury].Firstname;
                    return (
                        <label key={jurys[jury].id} style={{ display: idsJury.includes(jurys[jury].id) ? 'none': 'block' }}> {fullName} :
                            <input name="jury" type="radio" onChange={updateIdJuryCompetition}
                                   value={jurys[jury].id} />
                        </label>
                    )}
            )}
            </div>
            <div>
                <button onClick={verifyFormJury} >Ajout des Jurys de la compétition</button>
            </div>
        </div>
    )
}
