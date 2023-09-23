import { useState } from "react";
import { AlertColor, CircularProgress } from "@mui/material";
import SnackbarAlert from "../../common/SnackbarAlert";
import CompetitionPreview from "./CompetitionPreview";
import { CompetitionCreationForm } from "./CompetitionCreationForm";
import { CompetitionNomineesForm } from "./CompetitionNomineesForm";
import { CompetitionJuryForm } from "./CompetitionJuryForm";
import { TypeCompetitions } from "../../../types/Competition";

/**
 * Composant principal pour la création des compétitions
 * @returns 
 */
const CompetitionGenerator = () => {
    const [minting, setMinting] = useState(false);
    const [competitionId, setCompetitionId] = useState(0);
    const [typeCompetition, setTypeCompetition] = useState(TypeCompetitions.None);
    const [openCompetitionCreationForm, setOpenCompetitionCreationForm] = useState(true);
    const [openNominees, setOpenNominees] = useState(false);
    const [openJury, setOpenJury] = useState(false);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState<AlertColor | undefined>('success')

    const [reset, setReset] = useState(false);

    /**
     * Reset all variables of form
     */
    const resetForm = () => {
        setReset(true);
        setOpenCompetitionCreationForm(true);
        setOpenNominees(false);
        setOpenJury(false);
        setMinting(false);
        setReset(false);
    }

    /**
     * Evenement de compétition créée
     */
    const onCompetitionCreated = (createdCompetitionId: number, typeCompetition: TypeCompetitions) => {
        setCompetitionId(createdCompetitionId);
        setTypeCompetition(typeCompetition);
        setOpenCompetitionCreationForm(false)
        setOpenNominees(true)
    }
    return (
        <div>
            {isLoading && <CircularProgress />}
            <h2>Création d'une nouvelle compétition</h2>
            {openCompetitionCreationForm &&
                <section>
                    <CompetitionCreationForm
                        setOpen={setOpen}
                        setMessage={setMessage}
                        setSeverity={setSeverity}
                        setIsLoading={setIsLoading}
                        isLoading={isLoading}
                        onCompetitionCreated={onCompetitionCreated} />
                </section>
            }

            <section className={(!openNominees ? 'openBlockCompetition' : '')} >
                <CompetitionNomineesForm
                    reset={reset}
                    minting={minting}
                    typeCompetition={typeCompetition}
                    tokenId={competitionId}
                    setMinting={setMinting}
                    setOpenNominees={setOpenNominees}
                    setOpenJury={setOpenJury}
                    setOpen={setOpen}
                    setMessage={setMessage}
                    setSeverity={setSeverity} />
            </section>

            <section className={(!openJury ? 'openBlockCompetition' : '')}>
                <CompetitionJuryForm
                    reset={reset}
                    tokenId={competitionId}
                    setMinting={setMinting}
                    setOpen={setOpen}
                    setMessage={setMessage}
                    setSeverity={setSeverity} />
            </section>

            <button className="btn-reset" onClick={resetForm}>Fin de la création de la compétition </button>

            {competitionId !== 0 && <CompetitionPreview competitionId={competitionId} />}
            
            <SnackbarAlert open={open} setOpen={setOpen} message={message} severity={severity} />
        </div>
    )
}
export default CompetitionGenerator;
