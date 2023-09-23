import { AlertColor } from "@mui/material";
import { useEffect, useState } from "react";
import { fetchJury, listenToNewJury } from "../../../services/JuryService.service";
import contractsInterface from "../../../contracts/contracts";
import { provider } from "../../../provider/providers";
import { ethers } from "ethers";

export interface CompetitionJuryFormProps {
    reset: boolean,
    tokenId: number,
    setMinting: (minting: boolean) => void,
    setOpen: (open: boolean) => void,
    setMessage: (message: string) => void,
    setSeverity: (severity: AlertColor | undefined) => void,
}

export const CompetitionJuryForm = ({reset, tokenId, setMinting, setOpen, setMessage, setSeverity}: CompetitionJuryFormProps) => {
    const [selectedIdsJury, setSelectedIdsJury]: any = useState([]);
    const [jurys, setJurys]: any = useState([]);

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
            setSelectedIdsJury([]);
        }
    }, [jurys, setJurys, reset, setSelectedIdsJury])

    const updateSelectedJurysCompetition = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked && !selectedIdsJury.includes(parseInt(e.target.value))) {
            setSelectedIdsJury([...selectedIdsJury, parseInt(e.target.value)]);
        } else if (!e.target.checked && selectedIdsJury.includes(parseInt(e.target.value))) {
            setSelectedIdsJury(selectedIdsJury.filter((id: number) => id !== parseInt(e.target.value)));
        }
    }

    /**
     * Verification des données des jurys de la competitions avant sauvegarde dans la blockchain
     */
    const verifyFormJury = async () => {
        if (selectedIdsJury.length === 0) {
            setMinting(false);
            setMessage(`No jury selected`)
            setSeverity('error')
            setOpen(true)
            return false;
        }
        const result = await addJurysCompetition();

        if (result) {
            setMessage(`Competition configuration complete`)
            setSeverity('success')
            setOpen(true)
            setTimeout(
                function () {
                    setOpen(false)
                }, 5000);
        }
    }

    /**
     * Fonction qui appel le smart contract afin d'ajouter les jurys de la compétition
     */
    const addJurysCompetition = async () => {
        setMinting(true);
        const signer = await provider?.getSigner();
        // building smart contract call
        const contract = new ethers.Contract(contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, signer );

        let transactions = [];
        for (const idJury of selectedIdsJury) {
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
                if (receipt && receipt.status == 1) {
                    transactions = transactions.filter((trans: any) => trans.id !== transaction.id);
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
                    transactions = transactions.filter((trans: any) => trans.id !== transaction.id);
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
        }

        setSelectedIdsJury([]);

        setMessage('Minting finished ! :)')
        setSeverity('success')
        setOpen(true)
        return true;
    }

    return (
        <div  className="form-ligne">
            <h5>Les Jurys : </h5>
            <div style={{display: 'flex', justifyContent: 'center', flexDirection: 'column'}}>
                { jurys && Object.keys(jurys).length > 0 && Object.keys(jurys).map((jury: any) => {
                    const fullName = jurys[jury].Lastname + " " + jurys[jury].Firstname;
                    return (
                        <label key={jurys[jury].id}> {fullName} :
                            <input name="jury" type="checkbox" onChange={updateSelectedJurysCompetition}
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
