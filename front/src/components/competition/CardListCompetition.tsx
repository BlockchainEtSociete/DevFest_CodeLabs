import CardCompetitionSelect from "./CardCompetitionSelect";

export interface CardListCompetitionProps{
    title: string,
    picture: string,
    startDate: number,
    endDate: number,
    nominees: any[],
    typeCompetition: number
}
function CardListCompetition({title, picture, startDate, endDate, nominees, typeCompetition}: CardListCompetitionProps){
    const dateDebut = new Date(startDate * 1000)
    const dateFin = new Date(endDate * 1000);

    return (
        <div style={{border: '1px solid black', width: '50%', margin: '2rem auto'}}>
            <h3>{title}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around'}}>
                <div>
                    <img src={picture} alt="card" height='200' width='200'/>
                </div>
                <div>
                    <p>Début de la compétition : {dateDebut.toLocaleString("fr")}</p>
                    <p>Fin de la competition :  {dateFin.toLocaleString("fr")}</p>
                    <h4>Les nominés sont :</h4>

                    { nominees.map((nominee: any) => {
                        let info = ''
                        if (typeCompetition == 1 || typeCompetition == 2) {
                            info = `${nominee.nominee.Firstname} ${nominee.nominee.Lastname}`
                        }
                        else {
                            info = nominee.nominee.title
                        }

                        return (
                            <div key={nominee.nominee.id}>
                                <CardCompetitionSelect
                                    Info={info}
                                    Picture={nominee.nominee.Picture}
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
