// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../identity/Jurys.sol";
import "./Awards.sol";
import "../festival/Actors.sol";
import "../festival/Directors.sol";
import "../festival/Movies.sol";

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
        string title;
        string tokenURI;
        TypeCompetitions typeCompetitions;
        Nominee[] nominees;
        uint winnerCompetition; // the nominee index in nominees array, +1
        uint startTime;
        uint endTime;
    }

    /// @notice represents competition and its voting status
    struct CompetitionAndVotingStatus {
        CompetitionVotingSession competition;
        VotingCompetitionStatus votingStatus;
    }

    /// @notice Enum with the possible status for a competition session.
    enum  VotingCompetitionStatus {
        Pending,
        InProgress,
        Ended
    }

    CompetitionVotingSession[] votingCompetitions;
    mapping (uint => mapping(address => Voter)) votingCompetitionsVoters;
    mapping (uint => mapping(uint => bool)) jurysOfCompetitions;

    Jurys immutable juryContract;
    Awards immutable awardContract;
    Actors immutable actorsContract;
    Directors immutable directorsContract;
    Movies immutable moviesContract;

    /// Events
    event CompetitionSessionRegistered(uint competitionId);
    event NomineeCompetitionsRegistered(uint indexed competitionId, uint indexed nomineeId, uint indexed nomineeTokenId);
    event VotedOnCompetition(uint indexed competitionId, uint indexed nomineeId, uint nbVotes);
    event JuryAddedToCompetition(uint indexed competitionId, uint indexed juryId);
    event WinnerDesignated(uint indexed competitionId, uint indexed winnerId, uint awardId, TypeCompetitions typeCompetition);

    modifier onlyJuryOfCompetition(uint _competitionId) {
        uint juryId = juryContract.getJuryId(msg.sender);
        uint competitionIndex = _competitionId - 1;
        require(juryId >= 0, "You are not a jury");
        require(competitionIndex < votingCompetitions.length, "Voting competition doesn't exist");
        require(jurysOfCompetitions[competitionIndex][juryId], "You are not a jury for this competition");
        _;
    }

    modifier onlyExistingCompetition(uint _competitionId) {
        uint competitionIndex = _competitionId - 1;
        require(competitionIndex < votingCompetitions.length, string.concat("Voting competition ", string.concat(Strings.toString(_competitionId), " doesn't exist")));
        _;
    }

    constructor(address payable _contractJury, address payable _contractAward, address payable _contractActor, address payable _contractDirector, address payable _contractMovie){
        juryContract = Jurys(_contractJury);
        awardContract = Awards(_contractAward);
        actorsContract = Actors(_contractActor);
        directorsContract = Directors(_contractDirector);
        moviesContract = Movies(_contractMovie);
    }

    /// @notice Adds a competition.
    /// @dev Administrator defines voting period, competition, voting panel and options. event CompetitionSessionRegistered when competition has been registered
    /// @param _title title of the competition
    /// @param _tokenURI Competition uri photo - title.
    /// @param _typeCompetitions Defines the type of options.
    /// @param _startDate Voting session start date.
    /// @param _endDate End date of voting session.
    function addCompetition(string calldata _title, string calldata _tokenURI, TypeCompetitions _typeCompetitions, uint _startDate, uint _endDate) external onlyOwner {
        require(_startDate > block.timestamp, "Your competition can't be in the past");
        require(_startDate < _endDate, "Your competition end date can't be before the start date");
        require(keccak256(abi.encode(_typeCompetitions)) != keccak256(abi.encode("")), "Your competition must contain type of competition");

        CompetitionVotingSession storage newCompetitionVotingSession = votingCompetitions.push();
        newCompetitionVotingSession.title = _title;
        newCompetitionVotingSession.tokenURI = _tokenURI;
        newCompetitionVotingSession.typeCompetitions = _typeCompetitions;
        newCompetitionVotingSession.startTime = _startDate;
        newCompetitionVotingSession.endTime = _endDate;
        newCompetitionVotingSession.winnerCompetition = 0;

        uint competitionId = votingCompetitions.length;
        emit CompetitionSessionRegistered(competitionId);
    }

    /// @notice Adds nominee to a competition.
    /// @param _competitionId id of competition
    /// @param _nomineeTokenId token id of the nominee
    function addNomineeCompetition(uint _competitionId, uint _nomineeTokenId) external onlyExistingCompetition(_competitionId) onlyOwner {
        uint competitionIndex = _competitionId - 1;

        votingCompetitions[competitionIndex].nominees.push(Nominee(_nomineeTokenId, 0));
        uint nomineeId = votingCompetitions[competitionIndex].nominees.length;

        emit NomineeCompetitionsRegistered(_competitionId, nomineeId, _nomineeTokenId);
    }

    /// @notice Adds jury to a competition.
    /// @param _competitionId The voting competition number.
    /// @param _juryId The jury id.
    function addJuryToCompetition(uint _competitionId, uint _juryId) external onlyExistingCompetition(_competitionId) onlyOwner {
        require(juryContract.isTokenValid(_juryId), "Jury is invalid");

        uint competitionIndex = _competitionId - 1; // see addCompetition
        jurysOfCompetitions[competitionIndex][_juryId] = true;

        emit JuryAddedToCompetition(_competitionId, _juryId);
    }

    /// @notice Allows you to vote for an option in a competition during a voting session.
    /// @param _competitionId The voting competition id on which the voter wants to vote
    /// @param _nomineeId Index of the nominee in the array of nominees in the competition
    function voteOnCompetition(uint _competitionId, uint _nomineeId) external onlyExistingCompetition(_competitionId) onlyJuryOfCompetition(_competitionId) {
        CompetitionVotingSession memory competition = getCompetition(_competitionId);
        uint competitionIndex = _competitionId - 1; // see addCompetition
        uint nomineeIndex = _nomineeId - 1; // see addNomineeCompetition

        require(competition.startTime < block.timestamp, "Voting competition isn't open yet");
        require(competition.endTime > block.timestamp, "Voting competition is closed");
        require(nomineeIndex >= 0 && nomineeIndex < competition.nominees.length, "This nominee does not exist on this competition");
        require(votingCompetitionsVoters[competitionIndex][msg.sender].hasVoted == false, "You already have voted on this competition");
        
        votingCompetitions[competitionIndex].nominees[nomineeIndex].voteCount = competition.nominees[nomineeIndex].voteCount + 1;
        votingCompetitionsVoters[competitionIndex][msg.sender] = Voter(msg.sender, true);

        // Determine the winner at each vote
        if (competition.winnerCompetition == 0) {
            // No winner yet
            votingCompetitions[competitionIndex].winnerCompetition = nomineeIndex + 1;
        } else {
            uint currentWinnerCompetitionVoteCount = competition.nominees[competition.winnerCompetition - 1].voteCount;
            if (votingCompetitions[competitionIndex].nominees[nomineeIndex].voteCount > currentWinnerCompetitionVoteCount) {
                // New winner designated
                votingCompetitions[competitionIndex].winnerCompetition = nomineeIndex + 1;
            }
        }

        emit VotedOnCompetition(_competitionId, _nomineeId, votingCompetitions[competitionIndex].nominees[nomineeIndex].voteCount);
    }

    /// @notice get One competition
    /// @param _competitionId the id of the competition
    /// @return the competition
    function getCompetition(uint _competitionId) public view onlyExistingCompetition(_competitionId) returns(CompetitionVotingSession memory) {
        uint competitionIndex = _competitionId - 1; // see addCompetition        
        return votingCompetitions[competitionIndex];
    }

    /// @notice Gets the voting competition status according to the current timestamp.
    /// @param _competitionId The voting competition number.
    /// @return The voting competition status.
    function getVotingCompetitionStatus(uint _competitionId) public view onlyExistingCompetition(_competitionId) returns(VotingCompetitionStatus) {
        CompetitionVotingSession memory competition = getCompetition(_competitionId);

        if (competition.startTime > block.timestamp) {
            return VotingCompetitionStatus.Pending;
        }
        else if (competition.endTime < block.timestamp) {
            return VotingCompetitionStatus.Ended;
        }

        return VotingCompetitionStatus.InProgress;
    }

    /// @notice get a competition of a jury if it has not already voted on this competition
    /// @param _competitionId id of competition
    /// @return the competition
    function getUnvotedCompetitionOfJury(uint _competitionId) external view onlyExistingCompetition(_competitionId) onlyJuryOfCompetition(_competitionId) returns(CompetitionAndVotingStatus memory) {
        CompetitionVotingSession memory competition = getCompetition(_competitionId);
        uint competitionIndex = _competitionId - 1; // see addCompetition

        require(votingCompetitionsVoters[competitionIndex][msg.sender].hasVoted == false, "You already have voted on this competition");

        CompetitionAndVotingStatus memory newCompetitionAndVotingStatus;
        newCompetitionAndVotingStatus.competition = competition;
        newCompetitionAndVotingStatus.votingStatus = getVotingCompetitionStatus(_competitionId);

        return newCompetitionAndVotingStatus;
    }

    /// @notice search en send award the winner of competition
    /// @param _competitionId the id competition
    function designateWinner(uint _competitionId) external onlyExistingCompetition(_competitionId) onlyOwner {
        CompetitionVotingSession memory competition = getCompetition(_competitionId);
        require(competition.endTime < block.timestamp, "Voting competition isn't closed yet");
        require(competition.winnerCompetition > 0, "No one has voted for this competition");
        address addressNominee;

        uint tokenIdNominee = competition.nominees[competition.winnerCompetition -1].tokenId;

        if(competition.typeCompetitions == TypeCompetitions.Actor){
            addressNominee = actorsContract.ownerOf(tokenIdNominee);
        } else if(competition.typeCompetitions == TypeCompetitions.Director){
            addressNominee = directorsContract.ownerOf(tokenIdNominee);
        } else {
            addressNominee = directorsContract.ownerOf(moviesContract.getIdTokenDirector(tokenIdNominee));
        }

        uint awardId = awardContract.mint(addressNominee, competition.tokenURI);

        emit WinnerDesignated(_competitionId, tokenIdNominee, awardId, competition.typeCompetitions);
    }
}
