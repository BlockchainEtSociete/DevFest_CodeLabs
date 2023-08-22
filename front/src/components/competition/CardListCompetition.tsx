import {ethers} from "ethers/lib.esm";

export interface CardListCompetitionProps{
    title: string,
    picture: string,
    startDate: number,
    endDate: number,
    options: any,
    jurys: any,
    typeCompetition: number
}
function CardListCompetition({title, picture, startDate, endDate, options, jurys, typeCompetition}: CardListCompetitionProps){

    const dateDebut = new Date(startDate * 1000)
    const dateFin = new Date(endDate * 1000);
    console.log(options)

    return (
        <div>
            <div>
                <h3>{title}</h3>
                <img src={picture} alt="card" height='200' width='200'/>
                <p>Début de la compétition : {dateDebut.toLocaleString("fr")}</p>
                <p>Fin de la competition :  {dateFin.toLocaleString("fr")}</p>
                <h4>Les nominés sont :</h4>
                {
                    options.map((option: any, index: number) => {
                        return ([
                                <div key={`${option.id}-${index}`}>
                                    <p>{option.option.Firstname} {option.option.Lastname} : {option.voteCount} nombres de vote</p>
                                </div>
                            ]

                            )
                    })
                }
            </div>
        </div>
    )
}
export default CardListCompetition;
