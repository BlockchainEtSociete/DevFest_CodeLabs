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
 * @returns JSX
 */
const CompetitionGenerator = () => {
    const [competitionId, setCompetitionId] = useState(0);
    const [typeCompetition, setTypeCompetition] = useState(TypeCompetitions.None);
    const [openCompetitionCreationForm, setOpenCompetitionCreationForm] = useState(true);
    const [openNomineesSelection, setOpenNomineesSelection] = useState(false);
    const [openJurySelection, setOpenJurySelection] = useState(false);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState<AlertColor | undefined>('success')

    /**
     * Reset all variables of form
     */
    const onEndCompetitionCreation = () => {
        setCompetitionId(0)
        setOpenCompetitionCreationForm(true);
        setOpenNomineesSelection(false);
        setOpenJurySelection(false);
    }

    /**
     * Evenement compétition créée
     */
    const onCompetitionCreated = (createdCompetitionId: number, typeCompetition: TypeCompetitions) => {
        setCompetitionId(createdCompetitionId);
        setTypeCompetition(typeCompetition);
        setOpenCompetitionCreationForm(false)
        setOpenNomineesSelection(true)
    }

    /**
     * Evenement nominées ajoutés
     */
    const onNomineesAdded = () => {
        setOpenNomineesSelection(false)
        setOpenJurySelection(true)
    }

    /**
     * Evenement jurys ajoutés
     */
    const onJuriesAdded = () => {
        setOpenJurySelection(false)
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

            {openNomineesSelection &&
                <section>
                    <CompetitionNomineesForm
                        typeCompetition={typeCompetition}
                        competitionId={competitionId}
                        setOpen={setOpen}
                        setMessage={setMessage}
                        setSeverity={setSeverity}
                        setIsLoading={setIsLoading}
                        isLoading={isLoading}
                        onNomineesAdded={onNomineesAdded} />
                </section>
            }

            {openJurySelection &&
                <section>
                    <CompetitionJuryForm
                        competitionId={competitionId}
                        setOpen={setOpen}
                        setMessage={setMessage}
                        setSeverity={setSeverity}
                        setIsLoading={setIsLoading}
                        isLoading={isLoading}
                        onJuriesAdded={onJuriesAdded} />
                </section>
            }

            {!openCompetitionCreationForm && !openNomineesSelection && !openJurySelection &&
                <button className="btn-reset" onClick={onEndCompetitionCreation}>Fin de la création de la compétition</button>
            }

            {competitionId !== 0 &&
                <CompetitionPreview competitionId={competitionId} setOpen={setOpen} setMessage={setMessage} setSeverity={setSeverity} />
            }
            
            <SnackbarAlert open={open} setOpen={setOpen} message={message} severity={severity} />
        </div>
    )
}
export default CompetitionGenerator;
