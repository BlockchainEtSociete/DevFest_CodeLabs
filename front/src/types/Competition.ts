export enum TypeCompetitions {
    Actor,
    Director,
    Movie,
    None
}

export enum VotingCompetitionStatus {
    Pending,
    InProgress,
    Ended
}

export interface Nominee {
    id: number;
    tokenId: number;
    voteCount?: number;
    pictureUrl?: string;
    title?: string;
}

export interface Competition {
    id: number;
    title: string;
    pictureUrl: string;
    tokenURI: string;
    typeCompetitions: TypeCompetitions;
    status: VotingCompetitionStatus;
    startTime: number;
    endTime: number;
    nominees: Nominee[];
    winnerCompetition: number;
}

export interface CompetitionAndVotingStatus {
    competition: Competition;
    votingStatus: VotingCompetitionStatus;
}