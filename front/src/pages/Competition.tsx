import {useEffect, useState} from "react";
import {fetchCompetitions} from "../services/CompetitionService.service.ts";
import contractsInterface from "../contracts/contracts";
import CardListCompetition from "../components/competition/CardListCompetition";

const Competition = () => {
    const [competitions, setCompetitions]: any = useState([]);
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        fetchCompetitions('CompetitionSessionRegistered', contractsInterface.contracts.Competitions.address, contractsInterface.contracts.Competitions.abi, setLoading, setCompetitions)
            .then();
    }, []);

    return(
        <article>
            <h2>Les compétitions du devfest 2023</h2>
            <section>
                { !isLoading && competitions && competitions.length > 0 && competitions.map((competition: any, index: number) => (
                        <CardListCompetition
                            key={`${competition.id}-${index}`}
                            title={competition.title}
                            picture={competition.Picture}
                            startDate={competition.startDate}
                            endDate={competition.endDate}
                            options={competition.options}
                            jurys={competition.jurys}
                            typeCompetition={competition.typeCompetition}
                        />
                    ))
                }
            </section>
        </article>
    );
}
export default Competition;
