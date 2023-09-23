import { useEffect, useState } from "react"
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { getCompetitionImageAndAwardName } from "../../../services/CompetitionService.service.ts";
import { AlertColor } from "@mui/material";

interface CompetitionDisplayProps {
    competitionId: number,
    setOpen: (open: boolean) => void,
    setMessage: (message: string) => void,
    setSeverity: (severity: AlertColor | undefined) => void,
}

const CompetitionPreview = ({ competitionId, setOpen, setMessage, setSeverity}: CompetitionDisplayProps) => {
    const [competitionImage, setCompetitionImage] = useState("");
    const [awardName, setAwardName] = useState("");

    useEffect(() => {
        (async () => {

            try {
                const { image, awardName: awardNameFound } = await getCompetitionImageAndAwardName(competitionId)
                setAwardName(awardNameFound)
                setCompetitionImage(uint8ArrayToString(image, 'base64'))
            } catch (e) {
                const msg = "Erreur lors de la récupération des informations de la compétition";
                console.log(msg, e);
                setMessage(msg);
                setSeverity("error");
                setOpen(true);
            }
        }) ()
    }, [competitionId, setMessage, setSeverity, setOpen])

    return (
        <div style={{margin: 'auto'}}>
            {competitionId > 0 && competitionImage &&
                <div>
                    <h3>Apercu :</h3>
                    <img src={`data:image/*;base64,${competitionImage}`} alt="card" style={{height: '200px'}}/>
                    <p>{awardName}</p>
                </div>
            }
        </div>
    )
}
export default CompetitionPreview;
