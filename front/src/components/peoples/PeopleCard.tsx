export interface CardPeopleProps {
    firstname: string,
    lastname: string,
    picture: string
}

const PeopleCard = ( { firstname, lastname, picture }: CardPeopleProps ) => {
    const fullname = `${ firstname } ${ lastname }`;
    return (
        <div style={ { padding: 15 } }>
            <div>
                <h4>{ fullname }</h4>
                <img src={ picture } alt={ fullname } height='400' width='400'/>
            </div>
        </div>
    )
}
export default PeopleCard;
