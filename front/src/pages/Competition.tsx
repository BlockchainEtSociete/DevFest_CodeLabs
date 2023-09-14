import {useEffect, useState} from "react";
import {fetchCompetitions, listenToNewCompetition} from "../services/CompetitionService.service";
import contractsInterface from "../contracts/contracts";
import CardListCompetition from "../components/competition/CardListCompetition";

const Competition = () => {
    const [competitions, ]: any = useState({});
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        const addToCompetitions = async (competition: any) => {
            if (!competitions[competition.id]) {
                competitions[competition.id] = competition;
            }
        }

        fetchCompetitions('CompetitionSessionRegistered', contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, setLoading, addToCompetitions).then();
        listenToNewCompetition('CompetitionSessionRegistered', contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, setLoading, addToCompetitions).then();
    }, []);

    return(
        <article>
            <h2>Les compétitions du devfest 2023</h2>
            <section>
                { !isLoading && competitions && Object.keys(competitions).length > 0 && Object.keys(competitions).map((competition: any) => (
                        <CardListCompetition
                            key={`${competitions[competition].id}`}
                            title={competitions[competition].title}
                            picture={competitions[competition].Picture}
                            startDate={competitions[competition].startDate}
                            endDate={competitions[competition].endDate}
                            options={competitions[competition].options}
                            typeCompetition={competitions[competition].typeCompetition}
                        />
                    ))
                }
            </section>
        </article>
    );
}
export default Competition;
