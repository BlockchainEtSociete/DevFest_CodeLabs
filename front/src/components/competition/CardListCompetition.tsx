import { common } from "@mui/material/colors";
import { TypeCompetitions } from "../../types/Competition";
import AwardOfCompetition from "../Award/AwardOfCompetition";
import CardCompetitionSelect from "./CardCompetitionSelect";

export interface CardListCompetitionProps{
    idCompetition: number,
    title: string,
    nameAward: string,
    picture: string,
    startDate: number,
    endDate: number,
    nominees: any[],
    typeCompetition: TypeCompetitions
}

function CardListCompetition({idCompetition, title, nameAward, picture, startDate, endDate, nominees, typeCompetition}: CardListCompetitionProps) {
    const dateDebutCompetition = new Date(startDate * 1000);
    const dateFinCompetition = new Date(endDate * 1000);

    console.log(idCompetition, nominees)

    return (
        <div style={{border: '1px solid black', width: '50%', margin: '2rem auto'}}>
            <h3>{title}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around'}}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <img src={picture} alt={nameAward} height='200' width='200'/>
                    <AwardOfCompetition
                        idCompetition={idCompetition}
                        typeCompetition={typeCompetition}
                        dateFinCompetition={dateFinCompetition}
                        nameAward={nameAward}
                    />
                </div>

                <div>
                    <p>Début de la compétition : {dateDebutCompetition.toLocaleString("fr")}</p>
                    <p>Fin de la competition :  {dateFinCompetition.toLocaleString("fr")}</p>
                    <h4>Les nominés :</h4>
                    {nominees.length === 0 && <p>Pas de nominés pour cette compétitions !</p>}

                    { nominees.map((nominee: any) => {
                        let info = ''
                        if (typeCompetition == TypeCompetitions.Actor || typeCompetition == TypeCompetitions.Director) {
                            info = `${nominee.nominee.firstname} ${nominee.nominee.lastname}`
                        }
                        else {
                            info = nominee.nominee.title
                        }

                        return (
                            <div key={nominee.nominee.id}>
                                <CardCompetitionSelect
                                    info={info}
                                    picture={nominee.nominee.picture}
                                />
                            </div>
                        )})
                    }
                </div>
            </div>
        </div>
    )
}
export default CardListCompetition;
