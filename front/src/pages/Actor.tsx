import PeopleCard from "../components/peoples/PeopleCard";
import {useEffect, useState} from "react";
import contractsInterface from "../contracts/contracts";
import {fetchPeople, listenToNewPeople} from "../services/PeopleService.service";
import { People } from "../types/People";

const Actor = () => {
    const [actors, setActors] = useState<People[]>();
    const [isLoading, setLoading] = useState<boolean>(false);


    useEffect(() => {
        const addToActors = async (people: People) => {
            if (actors && !actors[people.id]) {
                actors[people.id] = people;
                setActors(actors);
            }
        }

        (async () => {
            setLoading(true)
            await fetchPeople("ActorMinted", contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi, addToActors);
            await listenToNewPeople("ActorMinted", contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi, addToActors);
            setLoading(false)
        })();
    }, [actors, setActors]);

    return (
        <article>
            <h2>Les Acteurs en compétition du devfest 2023</h2>

            <section style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap'}}>
                {!isLoading && actors && Object.keys(actors).length > 0 && Object.keys(actors).map((actor: any) => (
                    <PeopleCard
                        key={actors[actor].id}
                        Firstname={actors[actor].firstname}
                        Lastname={actors[actor].lastname}
                        Picture={actors[actor].picture}
                    />
                ))}
            </section>
        </article>
    )
}
export default Actor;
