interface CardFilmProps {
    title: string,
    description: string,
    picture: string,
    director: {
        firstname: string,
        lastname: string
    },
}

function CardFilm( { title, description, picture, director }: CardFilmProps ) {
    const fullname = `${ director.firstname } ${ director.lastname }`;
    return (
        <div style={ { display: 'flex', padding: 15, justifyContent: 'space-around' } }>
            <div>
                <img src={ picture } alt={ fullname } height='400' width='400'/>
            </div>
            <div style={ { width: '40%', textAlign: 'justify' } }>
                <h4>{ title }</h4>
                <p>{ description }</p>
                <div style={ { display: 'flex' } }>
                    <p style={ { fontWeight: 'bold', marginRight: '5px' } }>Réalisateur :</p>
                    <p> { fullname }</p>
                </div>
            </div>
        </div>
    )
}

export default CardFilm;
