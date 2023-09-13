import { AlertColor } from "@mui/material";
import { useEffect, useState } from "react";
import { fetchJury, listenToNewJury } from "../../services/JuryService.service.ts";
import contractsInterface from "../../contracts/contracts.ts";
import { provider } from "../../provider/providers.ts";
import { ethers } from "ethers";

export interface CompetitionJuryFormProps {
    reset: boolean,
    minting: boolean,
    setMinting: (minting: boolean) => void,
    setLoading: (loading: boolean) => void,
    setOpenJury: (openJury: boolean) => void,
    setOpen: (open: boolean) => void,
    setMessage: (message: string) => void,
    setSeverity: (severity: AlertColor | undefined) => void,
}

export const CompetitionJuryForm = ({reset, minting, setMinting, setLoading, setOpenJury, setOpen, setMessage, setSeverity}: CompetitionJuryFormProps) => {
    const [idJury, setIdJury]: any = useState(0);
    let [jurys, ]: any = useState([]);

    useEffect(() => {
        const addToJurys = async (jury: any) => {
            jurys.push(jury);
        }

        fetchJury("JuryMinted", contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, setLoading, addToJurys).then();
        listenToNewJury("JuryMinted", contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, addToJurys).then();

        if (reset) {
            setIdJury(0);
        }

    }, [jurys, reset])

    /**
     * Verification des données des jurys de la competitions avant sauvegarde dans la blockchain
     */
    const verifyFormJury = async () => {
        if(!Number.isInteger(idJury) && idJury != 0){
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

        // création de l'appel du smart contract
        const contract = new ethers.Contract(contractsInterface.contracts.Jurys.address, contractsInterface.contracts.Jurys.abi, signer );
        let transaction;

        try {
            transaction = await contract.addCompetitionByJury(tokenId, idJury);
        }catch (e) {
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

        jurys = jurys.filter((el: any) => el.id != idJury)
        setIdJury(0);

        setMessage('Minting finished ! :)')
        setSeverity('success')
        setOpen(true)
        return true;
    }

    return (
        <div  className="form-ligne">
            <h5>Les Jurys : </h5>
            <div style={{display: 'flex', justifyContent: 'center', flexDirection: 'column'}}>
                { jurys && jurys.length > 0 && jurys.map((jury: any, index: number) => {
                    const fullName = jury.Lastname + " " + jury.Firstname;
                    return (
                        <label key={`id-${index}`}> {fullName} :
                            <input name="jury" type="radio" onChange={e => setIdJury(Number(e.target.value))}
                                   value={jury.id} />
                        </label>
                    )
                })
                }
            </div>
            <div>
                <button onClick={verifyFormJury} disabled={minting}>Ajout des Jurys de la compétition</button>
            </div>

        </div>
    )
}