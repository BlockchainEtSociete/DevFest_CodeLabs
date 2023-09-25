import CardCompetitionSelect from "../CardCompetitionSelect";
import { AlertColor } from "@mui/material";
import { useEffect, useState } from "react";
import { Nominee, TypeCompetitions } from "../../../types/Competition";
import { addNomineesToCompetition, fetchEligibleNomineesByTypeCompetition } from "../../../services/CompetitionService.service";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface NomineeSelection {
    nominee: Nominee,
    isSelected: boolean
}

export interface CompetitionNomineesFormProps {
    typeCompetition: TypeCompetitions,
    competitionId: number,
    setOpen: (open: boolean) => void,
    setMessage: (message: string) => void,
    setSeverity: (severity: AlertColor | undefined) => void,
    isLoading: boolean,
    setIsLoading: (open: boolean) => void,
    onNomineesAdded: () => void
}
export const CompetitionNomineesForm = ({ typeCompetition, competitionId, setOpen, setMessage, setSeverity, isLoading, setIsLoading, onNomineesAdded }: CompetitionNomineesFormProps) => {
    const [nominees, setNominees] = useState<NomineeSelection[]>([]);
    const [forceRenderedKey, setForceRenderedKey] = useState<number>(new Date().getTime());
    
    useEffect(() => {
        (async () => {
            setIsLoading(true)
            try {
                const nominees: NomineeSelection[] = (await fetchEligibleNomineesByTypeCompetition(typeCompetition)).map((nominee) => {
                    return { nominee, isSelected: false }
                });
                setNominees(nominees)
            } finally {
                setIsLoading(false)
            }
        })();
    }, [typeCompetition, setIsLoading]);

    /**
     * Permet d'ajouter ou d'enlever un nominé de la liste des nominés sélectionnés
     * 
     * @param nomineeTokenId token id du nominé
     */
    const toggleNomineeSelection = (nomineeTokenId: number) => {
        const indexOfNominee = nominees.findIndex(({ nominee: { tokenId } }) => nomineeTokenId === tokenId);
        nominees[indexOfNominee].isSelected = !nominees[indexOfNominee].isSelected
        
        setNominees(nominees)
        setForceRenderedKey(new Date().getTime()) // TODO revoir ça
    }

    /**
     * Action d'ajout des nominés à une compétition
     */
    const onClickAddNomineesToCompetition = async () => {
        const nomineesTokenIds = nominees.filter(({ isSelected }) => isSelected).map(({ nominee: { tokenId } }) => tokenId)
        if (nomineesTokenIds.length === 0) {
            setMessage(`Au moins 1 nominé doit être sélectionné`)
            setSeverity('error')
            setOpen(true)
            return;
        }

        try {
            setIsLoading(true)
            await addNomineesToCompetition(competitionId, nomineesTokenIds);
            onNomineesAdded();

            setMessage("Minting success");
            setSeverity("success");
            setOpen(true);
            setTimeout(
                function () {
                    setOpen(false)
                }, 5000);
        } catch (e) {
            const msg = "Erreur lors de l'ajout d'un nominé";
            console.log(msg, e);
            setMessage(msg);
            setSeverity("error");
            setOpen(true);
            setTimeout(
                function () {
                    setOpen(false)
                }, 5000);
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }} key={forceRenderedKey}>
                {
                    nominees.map(({ nominee: { tokenId, pictureUrl, title }, isSelected }) => (
                        <div key={`${tokenId}`} onClick={() => toggleNomineeSelection(tokenId)} style={{ border: '1px solid black', margin: '5px' }}>
                            {isSelected && <CheckCircleOutlineIcon color="info" />}
                            {!isSelected && <HelpOutlineIcon color="warning" />}
                            <CardCompetitionSelect
                                info={title || ''}
                                picture={pictureUrl || ''}
                            />
                        </div>
                    ))
                }
            </div>
            <button onClick={onClickAddNomineesToCompetition} disabled={isLoading}>Ajout des nominées de la compétition</button>
        </div>
    )
}
