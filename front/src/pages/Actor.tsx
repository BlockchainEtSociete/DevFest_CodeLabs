import PeopleCard from "../components/peoples/PeopleCard";
import {useEffect, useState} from "react";
import contractsInterface from "../contracts/contracts";
import {fetchPeople, listenToNewPeople} from "../services/PeopleService.service";

const Actor = () => {
    const [actors, ]: any = useState({});
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        const addToActors = async (people: any) => {
            if (!actors[people.id]) {
                actors[people.id] = people;
            }
        }

        fetchPeople("ActorMinted", contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi, setLoading, addToActors).then();
        listenToNewPeople("ActorMinted", contractsInterface.contracts.Actors.address, contractsInterface.contracts.Actors.abi, addToActors).then();
    }, [actors]);

    return (
        <article>
            <h2>Les Acteurs en compétition du devfest 2023</h2>

            <section style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap'}}>
                {!isLoading && actors && Object.keys(actors).length > 0 && Object.keys(actors).map((actor: any) => (
                    <PeopleCard
                        key={`${actors[actor].id}`}
                        Firstname={actors[actor].Firstname}
                        Lastname={actors[actor].Lastname}
                        Picture={actors[actor].Picture}
                    />
                ))}
            </section>
        </article>
    )
}
export default Actor;
