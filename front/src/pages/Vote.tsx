import { useEffect, useState } from "react";
import { fetchCompetitionsOfOneJury, fetchNomineesOfCompetition, voteOnCompetition } from "../services/CompetitionService.service";
import { Nominee, VotingCompetitionStatus } from "../types/Competition";
import useConnectedUserContext from '../context/ConnectedUserContextHook.tsx';
import { Competition } from "../types/Competition.ts";
import SnackbarAlert from "../components/common/SnackbarAlert";
import { AlertColor, CircularProgress } from "@mui/material";
import Popup from 'reactjs-popup';

const Vote = () => {
    const {state: { connectedUser: {juryId} }} = useConnectedUserContext()

    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [isLoading, setLoading] = useState<boolean>(false);
    const [competitionToVote, setCompetitionToVote]  = useState<Competition>();
    const [nominees, setNominees]  = useState<Nominee[]>([]);
    const [nomineeToVote, setNomineeToVote]  = useState<Nominee>();

    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState<AlertColor | undefined>('success')

    const onCompetitionSelected = async (competition: Competition) => {
        const nominees = await fetchNomineesOfCompetition(competition, setLoading)
        setCompetitionToVote(competition)
        setNominees(nominees)
    }

    const onValidateVoteOnCompetition = async () => {
        if (competitionToVote && nomineeToVote && await voteOnCompetition(competitionToVote, nomineeToVote, setLoading)) {
            setMessage("Vote pris en compte, merci !")
            setSeverity("success")
            setCompetitionToVote(undefined)
            setNominees([])
            setNomineeToVote(undefined)
            fetchCompetitionsOfOneJury(juryId, VotingCompetitionStatus.InProgress, setLoading, setCompetitions);
            setTimeout(
                function () {
                    setOpen(false)
                }, 5000);
        } else {
            setMessage("Vote non pris en compte, c'est moche")
            setSeverity("error")
            setTimeout(
                function () {
                    setOpen(false)
                }, 5000);
        }
        setOpen(true)
    }

    useEffect(() => {
        if (juryId !== -1)
            fetchCompetitionsOfOneJury(juryId, VotingCompetitionStatus.InProgress, setLoading, setCompetitions);
    }, [juryId]);

    return (
        <article>
            {isLoading && <CircularProgress />}
            {competitions && competitions.length > 0 && <h2>Vos compétitions en cours qui attendent votre vote</h2>}
            {(competitions && competitions.length === 0 && !isLoading) && <h2>Aucunes compétitions encore ouvertes, soyez patients</h2>}
            <section style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap'}}>
                { competitions && competitions.length > 0 && competitions.map(competition => (
                    <div style={{ padding: 15, margin: 5, cursor: "pointer", border: "1px solid", borderRadius: 20, borderColor: `${competitionToVote && competition.id === competitionToVote.id ? "blue": "black"}` }}
                        key={competition.id} title="Cliquer pour voir les nominés"  onClick={() => onCompetitionSelected(competition)}>
                        <div>
                            <h4>{competition.title}</h4>
                            <h5>Clotûre des votes le {(new Date(competition.endTime * 1000)).toLocaleString("fr")}</h5>
                            <img src={competition.pictureUrl} alt={competition.title} height='200' width='auto'/>
                        </div>
                    </div>)) }
            </section>
            { competitionToVote && nominees.length === 0 && <h3>Aucuns nominés ({competitionToVote.title}) pour le moment...</h3> }
            { competitionToVote && nominees.length > 0 && <h3>Et les nominés ({competitionToVote.title}) sont :</h3> }
            { competitionToVote &&
                <>
                    <section style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap'}}>
                        { nominees.length > 0 && nominees.map(nominee => (
                            <div style={{ padding: 15,  margin: 5, cursor: "pointer" }} key={nominee.id} 
                                title="Cliquer pour voter pour ce nominé"  onClick={() => setNomineeToVote(nominee)}>
                                <div>
                                    <h4>{nominee.title}</h4>
                                    <img src={nominee.pictureUrl} alt={nominee.title} height='150' width='auto'/>
                                </div>
                            </div>)) }
                    </section>
                    { nomineeToVote &&
                        <Popup open={true} closeOnDocumentClick onClose={() => setNomineeToVote(undefined)}>
                            <div className="modal">
                                <button className="close" onClick={() => setNomineeToVote(undefined)}>x</button>
                                <h2 className="header">Merci de valider votre vote pour {nomineeToVote?.title}</h2>
                                <div className="actions">
                                    <button className="btn-validate" onClick={() => onValidateVoteOnCompetition()}>Valider</button>
                                    <button className="btn-reset" onClick={() => setNomineeToVote(undefined)}>Annuler</button>
                                </div>
                            </div>
                        </Popup>
                    }
                </>
            }
            <SnackbarAlert open={open} setOpen={setOpen} message={message} severity={severity} />
        </article>
    );
}
export default Vote;
