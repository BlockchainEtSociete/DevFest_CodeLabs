import { useState } from "react";
import { selectedPhotoToken } from "../../../services/IpfsService.service.ts";
import { AlertColor } from "@mui/material";
import { getTimestamp } from "../../../utils/dateUtils.ts";
import { TypeCompetitions } from "../../../types/Competition.ts";
import { createCompetition } from "../../../services/CompetitionService.service.ts";

export interface CompetitionCreationFormProps {
    setOpen: (open: boolean) => void,
    setMessage: (message: string) => void,
    setSeverity: (severity: AlertColor | undefined) => void,
    isLoading: boolean,
    setIsLoading: (open: boolean) => void,
    onCompetitionCreated: (createdCompetitionId: number, typeCompetition: TypeCompetitions) => void
}

export const CompetitionCreationForm = ({ setOpen, setMessage, setSeverity, onCompetitionCreated, isLoading, setIsLoading }: CompetitionCreationFormProps) => {
    const [title, setTitle] = useState('');
    const [typeCompetition, setTypeCompetition] = useState(TypeCompetitions.None)
    const [nameAward, setNameAward] = useState('');
    const [picture, setPicture] = useState('');
    const [startDate, setStartDate] = useState(0);
    const [endDate, setEndDate] = useState(0);
    const [, setFile] = useState(null);

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
     * Verification des données de la compétition avant sauvegarde dans la blockchain
     */
    const onClickAddCompetition = async () => {
        // controle des champs
        if (!title || title.length == 0) {
            setMessage(`Invalide Title`)
            setSeverity('error')
            setOpen(true)
            return false;
        }
        if (typeCompetition === TypeCompetitions.None) {
            setMessage(`Invalide type competition`)
            setSeverity('error')
            setOpen(true)
            return false
        }
        if (!startDate || (new Date(startDate)).getTime() <= 0) {
            setMessage(`Invalide start date`)
            setSeverity('error')
            setOpen(true)
            return false
        }
        if (!endDate || (new Date(endDate)).getTime() <= 0 || endDate < startDate) {
            setMessage(`Invalide end date`)
            setSeverity('error')
            setOpen(true)
            return false
        }
        if (!nameAward || nameAward.length == 0) {
            setMessage(`Invalide Name Award`)
            setSeverity('error')
            setOpen(true)
            return false;
        }
        if (!picture) {
            setMessage(`invalid Picture`)
            setSeverity('error')
            setOpen(true)
            return false;
        }

        try {
            setIsLoading(true)
            const competitionId = await createCompetition(title, typeCompetition, startDate, endDate, nameAward, picture);
            onCompetitionCreated(competitionId, typeCompetition)
            setMessage("Minting success");
            setSeverity("success");
            setOpen(true);
            setTimeout(
                function () {
                    setOpen(false)
                }, 5000);
        } catch (e) {
            const msg = "Erreur lors de la création de la compétition";
            console.log(msg, e);
            setMessage(msg);
            setSeverity("error");
            setOpen(true);
        } finally {
            setIsLoading(false)
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
                    <select name="type" onChange={updateTypeCompetition} defaultValue={TypeCompetitions.None}>
                        <option value={TypeCompetitions.None}>Selectionnez le type de compétition</option>
                        <option value={TypeCompetitions.Actor}>Acteur</option>
                        <option value={TypeCompetitions.Director}>Réalisateur</option>
                        <option value={TypeCompetitions.Movie}>Film</option>
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
                        <img src={picture} style={{ width: '200px' }} />
                    </div>
                    <input name="Picture" type="file" onChange={selectedPhoto} />
                </label>
            </div>

            <button onClick={onClickAddCompetition} disabled={isLoading}>Ajout d'une nouvelle compétition</button>
        </div>
    )
}
