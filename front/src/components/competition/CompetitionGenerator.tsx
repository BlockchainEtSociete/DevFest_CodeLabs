import {useState} from "react";
import {AlertColor} from "@mui/material";
import SnackbarAlert from "../common/SnackbarAlert";
import CompetitionDisplay from "./CompetitionDisplay";
import { CompetitionCreationForm } from "./CompetitionCreationForm";
import { CompetitionNomineesForm } from "./CompetitionNomineesForm";
import { CompetitionJuryForm } from "./CompetitionJuryForm";

const CompetitionGenerator = () => {
    const [, setLoading] = useState(false);
    const [minting, setMinting] = useState(false);

    const [tokenId, setTokenId]: any = useState(0);
    const [typeCompetition, setTypeCompetition]: any = useState(-1);

    const [openCompetition, setOpenCompetition] = useState(true);
    const [openNominees, setOpenNominees] = useState(false);
    const [openJury, setOpenJury] = useState(false);
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState<AlertColor | undefined>('success')

    const [reset, setReset] = useState(false);

    /**
     * Reset all variables of form
     */
    const resetForm = () => {
        setReset(true);
        setOpenJury(false);
        setOpenNominees(false);
        setOpenCompetition(true);
        setMinting(false);
        setReset(false);
    }

    return (
        <div>
            <h2>Création d'une nouvelle compétition</h2>
            <section className={(!openCompetition ? 'openBlockCompetition' : '')}>
                <CompetitionCreationForm
                    reset={reset}
                    minting={minting}
                    setMinting={setMinting}
                    setTokenId={setTokenId}
                    typeCompetition={typeCompetition}
                    setTypeCompetition={setTypeCompetition}
                    setOpenCompetition={setOpenCompetition}
                    setOpenNominees={setOpenNominees}
                    setOpen={setOpen}
                    setMessage={setMessage}
                    setSeverity={setSeverity} />
            </section>

            <section className={(!openNominees ? 'openBlockCompetition' : '')} >
                <CompetitionNomineesForm
                    reset={reset}
                    minting={minting}
                    typeCompetition={typeCompetition}
                    tokenId={tokenId}
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
                    minting={minting}
                    tokenId={tokenId}
                    setMinting={setMinting}
                    setOpenJury={setOpenJury}
                    setOpen={setOpen}
                    setMessage={setMessage}
                    setSeverity={setSeverity} />
            </section>

            <button className="btn-reset" onClick={resetForm}>Fin de la création de la compétition </button>
            <div>
                <SnackbarAlert open={open} setOpen={setOpen} message={message} severity={severity} />
                <CompetitionDisplay tokenId={tokenId} />
            </div>
        </div>
    )
}
export default CompetitionGenerator;
