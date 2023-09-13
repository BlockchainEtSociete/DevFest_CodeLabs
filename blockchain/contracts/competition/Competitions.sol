// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../identity/Jurys.sol";

/// @title Management of Competition
/// @author Colas Vincent
/// @notice Smart contract to management digital Competition for the festival.
contract Competitions is Ownable {

    /// @notice Enum of type competition.
    enum  TypeCompetitions {
        Actor,
        Director,
        Movie
    }

    /// @notice Structure of competition nominee
    struct Nominee {
        uint tokenId;
        uint voteCount;
    }

    /// @notice Voter structure
    struct Voter {
        address voter;
        bool hasVoted;
    }

    /// @notice Voting competition structure to store a voting competition details.
    struct CompetitionVotingSession {
        uint id;
        string tokenURI;
        TypeCompetitions typeCompetitions;
        Nominee[] nominees;
        uint winnerCompetition;
        uint startTime;
        uint endTime;
    }

    /// @notice Enum with the possible status for a competition session.
    enum  VotingCompetitionStatus {
        Pending,
        InProgress,
        Ended
    }

    CompetitionVotingSession[] public votingCompetitions;
    mapping (uint => mapping(address => Voter)) votingCompetitionsVoters;
    mapping (uint => mapping(uint => bool)) jurysOfCompetitions;

    Jurys immutable juryContract;

    /// Event
    event CompetitionSessionRegistered(uint competitionId);
    event NomineeCompetitionsRegistered(uint competitionId, string message);
    event Voted(uint competitionId, bool vote, uint nbVotes);
    event JuryAddedToCompetition(uint competitionId, uint juryId);

    modifier onlyJuryOfCompetition(uint _competitionId) {
        uint juryId = juryContract.getJuryId(msg.sender);
        require(juryId >= 0, "You are not a jury");
        require(jurysOfCompetitions[_competitionId][juryId], "You are not a jury for this competition");
        _;
    }

    constructor(address payable sbtJury){
        juryContract = Jurys(sbtJury);
    }

    /// @notice Adds a competition.
    /// @dev Administrator defines voting period, competition, voting panel and options. event CompetitionSessionRegistered when competition has been registered
    /// @param _tokenURI Competition uri photo - title.
    /// @param _typeCompetitions Defines the type of options.
    /// @param _startDate Voting session start date.
    /// @param _endDate End date of voting session.
    function addCompetition(string memory _tokenURI, TypeCompetitions _typeCompetitions, uint _startDate, uint _endDate) onlyOwner external {
        require(_startDate > block.timestamp, "Your competition can't be in the past");
        require(_startDate < _endDate, "Your competition end date can't be before the start date");
        require(keccak256(abi.encode(_typeCompetitions)) != keccak256(abi.encode("")), "Your competition must contain type of competition");

        uint tokenId = votingCompetitions.length + 1;

        CompetitionVotingSession storage newCompetitionVotingSession = votingCompetitions.push();
        newCompetitionVotingSession.id = tokenId;
        newCompetitionVotingSession.tokenURI = _tokenURI;
        newCompetitionVotingSession.typeCompetitions = _typeCompetitions;
        newCompetitionVotingSession.startTime = _startDate;
        newCompetitionVotingSession.endTime = _endDate;

        emit CompetitionSessionRegistered(tokenId);
    }

    /// @notice Adds nominee to a competition.
    /// @param _tokenCompetition id of competition
    /// @param _idsNominees List of ids of nominees in competition (film, actor, director).
    function addNomineeCompetition(uint _tokenCompetition, uint[] memory _idsNominees) external {
        require(_idsNominees.length >= 2, "Your competition must contain at least 2 options");

        uint counter = 0;
        for(uint i = 0; i < _idsNominees.length; i++){
            votingCompetitions[_tokenCompetition - 1].nominees.push(Nominee(_idsNominees[counter], 0));
            counter ++;
        }

        emit NomineeCompetitionsRegistered(_tokenCompetition, 'Nominee added successfully!');
    }

    /// @notice Adds jury to a competition.
    /// @param _competitionId The voting competition number.
    /// @param _juryId The jury id.
    function addJuryToCompetition(uint _competitionId, uint _juryId) onlyOwner external {
        require(_competitionId <= votingCompetitions.length, "Competition: Voting competition doesn't exist");
        require(juryContract.isTokenValid(_juryId), "Your jury is invalid");

        jurysOfCompetitions[_competitionId][_juryId] = true;

        emit JuryAddedToCompetition(_competitionId, _juryId);
    }

    /// @notice Gets the voting competition status according to the current timestamp.
    /// @param _competitionId The voting competition number.
    /// @return The voting competition status.
    function getVotingCompetitionStatus(uint _competitionId) external view returns (VotingCompetitionStatus){
        require(_competitionId <= votingCompetitions.length, "Competition: Voting competition doesn't exist");

        if (votingCompetitions[_competitionId].startTime > block.timestamp) {
            return VotingCompetitionStatus.Pending;
        }
        else if (votingCompetitions[_competitionId].endTime < block.timestamp) {
            return VotingCompetitionStatus.Ended;
        }

        return VotingCompetitionStatus.InProgress;
    }

    /// @notice Returns whether the user has voted on the voting competition.
    /// @param _competitionId The voting competition identifier.
    /// @return True if msg.sender has already voted on this competition id.
    function getVoterStatus(uint _competitionId) external view onlyJuryOfCompetition(_competitionId) returns(bool) {
        require(_competitionId <= votingCompetitions.length, "Competition: Voting competition doesn't exist");

        return votingCompetitionsVoters[_competitionId][msg.sender].hasVoted;
    }

    /// @notice Allows you to vote for an option in a competition during a voting session.
    /// @dev Voting is only possible if the timestamp of the current block is between startTime and endTime of the session and if the voter's address is in the list. event Voted when jury has been voted
    /// @param _competitionId The voting competition on which the voter wants to vote.
    /// @param _tokenIdOption The token id of the option chosen by the voter.
    function voteOnCompetition(uint _competitionId, uint _tokenIdOption) onlyJuryOfCompetition(_competitionId) external {
        require(_competitionId <= votingCompetitions.length, "Competition: Voting competition doesn't exist");
        require(votingCompetitions[_competitionId].startTime < block.timestamp, "Voting competition isn't open yet");
        require(votingCompetitionsVoters[_competitionId][msg.sender].hasVoted == false, "You have already voted");
        uint nbVote;
        CompetitionVotingSession memory competition = getCompetition(_competitionId);

        for(uint i = 0; i < competition.nominees.length; i++ ){
            if(competition.nominees[i].tokenId == _tokenIdOption){
                competition.nominees[i].voteCount++;
                nbVote = competition.nominees[i].voteCount;
            }
        }

        // Determining if the voted proposal became the most voted. !!! A revoir lors de l'implementation des votes
        for(uint i = 0; i < competition.nominees.length; i++ ){
            if(competition.nominees[i].tokenId == competition.winnerCompetition && competition.nominees[i].voteCount > nbVote){
                competition.winnerCompetition = _tokenIdOption;
            }
        }

        votingCompetitionsVoters[_competitionId][msg.sender] = Voter(msg.sender, true);

        emit Voted(_competitionId, true, nbVote);
    }

    /// @notice get One competition
    /// @param _competitionId the id competition
    /// @return the competition
    function getCompetition(uint _competitionId) public view returns(CompetitionVotingSession memory){
        require(_competitionId -1 < votingCompetitions.length, "Competition inexistante !");
        return votingCompetitions[_competitionId - 1];
    }
}
