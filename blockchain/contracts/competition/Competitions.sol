// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../identity/Jurys.sol";

/// @title Management of Competition
/// @author Colas Vincent
/// @notice Smart contract to management digital Competition for the festival.
contract Competitions {

    /// @notice Enum of type competition.
    enum  TypeCompetitions {
        Actor,
        Director,
        Movie
    }

    /// @notice Structure of option competition
    struct Option {
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
        Option[] options;
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
    mapping(uint => uint[]) listJuryByCompetition;

    Jurys immutable juryContract;

    /// Event
    event CompetitionSessionRegistered(uint competitionId);
    event JurysCompetitionsRegistered(uint competitionId, string message);
    event OptionsCompetitionsRegistered(uint competitionId, string message);
    event Voted(uint competitionId, bool vote, uint voices);

    constructor(address payable sbtJury){
        juryContract = Jurys(sbtJury);
    }

    /// @notice Adds a competition.
    /// @dev Administrator defines voting period, competition, voting panel and options. event CompetitionSessionRegistered when competition has been registered
    /// @param _tokenURI Competition uri photo - title.
    /// @param _typeCompetitions Defines the type of options.
    /// @param _startDate Voting session start date.
    /// @param _endDate End date of voting session.
    function addCompetition(string memory _tokenURI, TypeCompetitions _typeCompetitions, uint _startDate, uint _endDate) external {
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

    /// @notice Adds options for a competition.
    /// @param _tokenCompetition id of competition
    /// @param _idsOption List of ids in competition (film, actor, director).
    function addOptionsCompetition(uint _tokenCompetition, uint[] memory _idsOption) external {
        require(_idsOption.length >= 4, "Your competition must contain at least 4 options");

        uint counter = 0;
        for(uint i = 0; i < _idsOption.length; i++){
            votingCompetitions[_tokenCompetition - 1].options.push(Option(_idsOption[counter], 0));
            counter ++;
        }

        emit OptionsCompetitionsRegistered(_tokenCompetition, 'Options ajouter avec succes !');
    }

    /// @notice Adds jurys for a competition.
    /// @param _tokenCompetition id of competition
    /// @param _idsJury List id token of voting juries.
    function addJurysCompetition(uint _tokenCompetition, uint[] memory _idsJury) external {
        require(_idsJury.length >= 2, "Your competition must contain jurys");

        // verifie la liste d'idsJurys
        for(uint i = 0; i < _idsJury.length; i++){
            require(juryContract.isTokenValid(_idsJury[i]), "Your jury is invalid");
        }

        listJuryByCompetition[_tokenCompetition] = _idsJury;

        emit JurysCompetitionsRegistered(_tokenCompetition, 'Jurys ajouter avec succes !');
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
    function getVoterStatus(uint _competitionId) external view returns(bool) {
        require(_competitionId <= votingCompetitions.length, "Competition: Voting competition doesn't exist");
        require(controleJuryByCompetition(_competitionId), "Competition: Doesn't access voting");

        return votingCompetitionsVoters[_competitionId][msg.sender].hasVoted;
    }

    /// @notice Checking whether a jury has access to a competition
    /// @param _competitionId The competition identifier.
    /// @return True if the msg.sender has access to this competition.
    function controleJuryByCompetition(uint _competitionId)internal view returns(bool){
        bool contain = false;
        uint juryId = juryContract.getJuryId(msg.sender);

        uint[] memory idsJury = listJuryByCompetition[_competitionId];

        for(uint i = 0; i < idsJury.length; i++){
            if(idsJury[i] == juryId){
                contain = true;
            }
        }
        return contain;
    }

    /// @notice Allows you to vote for an option in a competition during a voting session.
    /// @dev Voting is only possible if the timestamp of the current block is between startTime and endTime of the session and if the voter's address is in the list. event Voted when jury has been voted
    /// @param _competitionId The voting competition on which the voter wants to vote.
    /// @param _tokenIdOption The token id of the option chosen by the voter.
    function voteOnCompetition(uint _competitionId, uint _tokenIdOption) external {
        require(_competitionId <= votingCompetitions.length, "Competition: Voting competition doesn't exist");
        require(controleJuryByCompetition(_competitionId), "Competition: Doesn't access voting");
        require(votingCompetitions[_competitionId].startTime < block.timestamp, "Voting competition isn't open yet");
        require(votingCompetitionsVoters[_competitionId][msg.sender].hasVoted == false, "You have already voted");
        uint nbVote;
        CompetitionVotingSession memory competition = getCompetition(_competitionId);

        for(uint i = 0; i < competition.options.length; i++ ){
            if(competition.options[i].tokenId == _tokenIdOption){
                competition.options[i].voteCount++;
                nbVote = competition.options[i].voteCount;
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

    /// @notice get list by competition
    /// @param _competitionId the id competition
    /// @return the list jury by competition
    function getJuryByCompetition(uint _competitionId) public view returns(uint[] memory){
        return listJuryByCompetition[_competitionId];
    }
}