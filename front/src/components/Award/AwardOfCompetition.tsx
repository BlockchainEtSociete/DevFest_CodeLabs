import { useState, useEffect } from 'react';
import { AlertColor } from "@mui/material";
import Popup from 'reactjs-popup';
import { designateWinner, fetchWinner } from '../../services/AwardService.service';
import SnackbarAlert from '../common/SnackbarAlert';
import { isUserAdmin } from "../../types/ConnectedUser";
import useConnectedUserContext from "../../context/ConnectedUserContextHook";
import { TypeCompetitions, WinnerOfCompetition } from '../../types/Competition';

export interface AwardProps {
    idCompetition: number
    typeCompetition: TypeCompetitions
    dateFinCompetition: Date
    nameAward: string
}

/**
 * Composant qui implémente la logique de choix et affichage du gagnant d'une compétition
 * @param param0 AwardProps
 * @returns React.JSX
 */
const AwardOfCompetition = ({ idCompetition, typeCompetition, dateFinCompetition, nameAward }: AwardProps) => {
    const [openDesignatedWinnerConfirmation, setOpenDesignatedWinnerConfirmation] = useState(false);
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState<AlertColor | undefined>('success')

    const [winner, setWinner] = useState<WinnerOfCompetition | undefined>();
    const [atLeastOneVote, setAtLeastOneVote] = useState(false);

    const {state: { connectedUser }} = useConnectedUserContext()
    const onCloseDesignatedWinnerConfirmation = () => setOpenDesignatedWinnerConfirmation(false);
    const today = new Date();
    
    const onDesignateWinnerCompetition = async () => {
        const winner = await designateWinner(idCompetition);        
        if (winner) {
            setWinner(winner)
            setOpenDesignatedWinnerConfirmation(true)
            setMessage('Le gagant a été désigné !')
            setSeverity('success')
            setOpen(true)
            setTimeout(
                function () {
                    setOpen(false)
                }, 5000);
        } else {
            setMessage(`Le gagant n'a pas pu etre désigné`)
            setSeverity('error')
            setOpen(true)
            setTimeout(
                function () {
                    setOpen(false)
                }, 5000);
        }
    }

    useEffect(() => {
        (async () => {
            const { winner, atLeastOneVote } = await fetchWinner(idCompetition, typeCompetition);
            setWinner(winner)
            setAtLeastOneVote(atLeastOneVote)
        }) ();
    }, [idCompetition, typeCompetition])

    return(
        <div>
            <p>Récompense : {nameAward}</p>
            {
                dateFinCompetition < today && !winner && !atLeastOneVote && "Personne n'a voté sur cette compétition, pas de gagnant !"
            }
            {
                isUserAdmin(connectedUser) && dateFinCompetition < today && !winner ?
                    atLeastOneVote ? <button className="btn-winner" onClick={onDesignateWinnerCompetition}>Désigner le gagant</button> : ''
                    : dateFinCompetition < today && winner ? <p>🎉 Le gagnant est : {winner?.title} 🎉</p> : ''
            }
            {winner &&
                <Popup open={openDesignatedWinnerConfirmation} closeOnDocumentClick  onClose={onCloseDesignatedWinnerConfirmation}>
                    <div className="modal">
                        <button className="close" onClick={onCloseDesignatedWinnerConfirmation}>x</button>
                        <h2 className="header"> The winner is </h2>
                        <div className="content">
                        <p>🎉{winner.title}🎉</p>
                        </div>
                        <div className="actions">
                            <button className="btn-reset" onClick={onCloseDesignatedWinnerConfirmation}> Retour </button>
                        </div>
                    </div>
                </Popup>
            }
            <div>
                <SnackbarAlert open={open} setOpen={setOpen} message={message} severity={severity} />
            </div>
        </div>
    )
}
export default AwardOfCompetition;
