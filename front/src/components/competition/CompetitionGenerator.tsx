import {useEffect, useState} from "react";
import {AlertColor} from "@mui/material";
import {fetchMovie} from "../../services/MovieService.service";
import contractsInterface from "../../contracts/contracts";
import {fetchPeople} from "../../services/PeopleService.service";
import CardCompetitionSelect from "./CardCompetitionSelect";
import {ethers} from "ethers";
import SnackbarAlert from "../common/SnackbarAlert";
import ipfs from "../common/ipfs";
import {CompetitionMetadata} from "../../types/Metadata";
import {provider} from "../../provider/providers";
import CompetitionDisplay from "./CompetitionDisplay";
import {dataUrlToFile, selectedPhotoToken} from "../../services/IpfsService.service";
import {fetchJury, listenToNewJury} from "../../services/JuryService.service.ts";
import { CompetitionCreationForm } from "./CompetitionCreationForm.tsx";
import { CompetitionNomineesForm } from "./CompetitionNomineesForm.tsx";
import { CompetitionJuryForm } from "./CompetitionJuryForm.tsx";

const CompetitionGenerator = () => {
    const [, setLoading] = useState(false);
    const [minting, setMinting] = useState(false);

    const [tokenId, setTokenId]: any = useState(0);

    const [typeCompetition, setTypeCompetition]: any = useState(0);

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
                    setReset={setReset}
                    minting={minting}
                    setMinting={setMinting}
                    typeCompetition={typeCompetition}
                    setTypeCompetition={setTypeCompetition}
                    setTokenId={setTokenId}
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
                    tokenId={tokenId}
                    setMinting={setMinting}
                    setLoading={setLoading}
                    setOpenNominees={setOpenNominees}
                    setOpenJury={setOpenJury}
                    setOpen={setOpen}
                    setMessage={setMessage}
                    setSeverity={setSeverity}
                    typeCompetition={typeCompetition} />
            </section>

            <section className={(!openJury ? 'openBlockCompetition' : '')}>
                <CompetitionJuryForm
                    reset={reset}
                    minting={minting}
                    setMinting={setMinting}
                    setLoading={setLoading}
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
