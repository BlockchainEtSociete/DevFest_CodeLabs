interface CardCompetitionSelectProps {
    info: string,
    picture: string
}

function CardCompetitionSelect( { info, picture }: CardCompetitionSelectProps ) {
    return (
        <div style={ { position: 'relative', height: '100px', width: '400px', margin: '1rem', cursor: 'pointer' } }>
            <div style={ { position: 'absolute', zIndex: 1 } }>
                <img src={ picture } alt="card" height='100' width='400'/>
            </div>
            <div style={ {
                position: 'absolute',
                top: '20px',
                width: '400px',
                height: '100px',
                zIndex: 2,
                fontSize: '200%',
                color: 'white'
            } }>
                <center><b>{ info }</b></center>
            </div>
        </div>
    )
}

export default CardCompetitionSelect;
