import { useEffect, useState } from "react";
import { fetchCompetitions, listenToNewCompetition, stopListenToNewCompetition } from "../services/CompetitionService.service";
import CardListCompetition from "../components/competition/CardListCompetition";
import { Competition as CompetitionType } from "../types/Competition";
import { CircularProgress } from "@mui/material";

const Competition = () => {
    const [competitions, setCompetitions] = useState<CompetitionType[]>([]);
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        stopListenToNewCompetition()
        listenToNewCompetition((competition) => setCompetitions([...competitions, competition]));
        return stopListenToNewCompetition;
    }, [competitions]);

    useEffect(() => {
        (async () => {
            setLoading(true)
            try {
                setCompetitions(await fetchCompetitions());
            } catch (e) {
                console.log("Erreur lors de la récupération des compétitions", e);
            } finally {
                setLoading(false)
            }
        })();
    }, []);

    return (
        <article>
            {isLoading && <CircularProgress />}
            <h2>Les compétitions du devfest 2023</h2>
            <section>
                {competitions.map((competition) =>
                    <CardListCompetition
                        key={competition.id}
                        idCompetition={competition.id}
                        title={competition.title}
                        nameAward={competition.nameAward}
                        picture={competition.pictureUrl}
                        startDate={competition.startTime}
                        endDate={competition.endTime}
                        nominees={competition.nominees}
                        typeCompetition={competition.typeCompetitions}
                    />
                )}
            </section>
        </article>
    );
}
export default Competition;
