import {useState, useSyncExternalStore} from "react";
import PeopleGenerator from "../components/peoples/PeopleGenerator.tsx";
import MovieGenerator from "../components/movies/MovieGenerator.tsx";
import CompetitionGenerator from "../components/competition/creation/CompetitionGenerator.tsx";
import "../styles/account.css";
import useConnectedUserContext from '../context/ConnectedUserContextHook.tsx';
import JuryGenerator from "../components/jurys/JuryGenerator.tsx";
import { isUserAdmin } from '../types/ConnectedUser.ts';

const Administrator = () => {
    const {state: { connectedUser }} = useConnectedUserContext()
    const { canAddPeople, canAddMovie, canAddCompetition, canAddJury } = connectedUser.accessRights

    const [addPeople, setAddPeople] = useState(false);
    const [addMovie, setAddMovie] = useState(false);
    const [addCompetition, setAddCompetition] = useState(false);
    const [addJury, setAddJury] = useState(false);

    if (connectedUser && isUserAdmin(connectedUser))
        return (
            <article>
                <h2>Administration</h2>
                <div>
                    {canAddPeople && <a className="choice_add" onClick={() => {setAddPeople(!addPeople); setAddMovie(false); setAddCompetition(false); setAddJury(false); }} >Ajout d'un acteurs ou réalisateurs</a>}
                    {canAddMovie && <a className="choice_add" onClick={() => {setAddMovie(!addMovie); setAddPeople(false); setAddCompetition(false); setAddJury(false);} }>Ajout d'un nouveau film</a>}
                    {canAddCompetition && <a className="choice_add" onClick={() => {setAddCompetition(!addCompetition); setAddPeople(false); setAddMovie(false); setAddJury(false); } }>Nouvelle competition</a>}
                    {canAddJury && <a className="choice_add" onClick={() => {setAddJury(!addJury); setAddPeople(false); setAddMovie(false); setAddCompetition(false)} }>Ajout d'un nouveau jury</a>}
                </div>
                {
                    addPeople
                        ? <PeopleGenerator />
                        : null
                }
                {
                    addMovie
                        ? <MovieGenerator />
                        : null
                }
                {
                    addCompetition
                        ? <CompetitionGenerator />
                        : null
                }
                {
                    addJury
                        ? <JuryGenerator />
                        : null
                }
                <p></p>
            </article>
        )
}
export default Administrator;
