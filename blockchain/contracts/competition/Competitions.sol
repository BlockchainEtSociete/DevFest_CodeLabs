// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
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

    /// Events
    event CompetitionSessionRegistered(uint competitionId);
    event NomineeCompetitionsRegistered(uint indexed competitionId, uint indexed nomineeId, uint indexed nomineeTokenId);
    event VotedOnCompetition(uint competitionId, uint nomineeId, uint nbVotes);
    event JuryAddedToCompetition(uint indexed competitionId, uint indexed juryId);

    modifier onlyJuryOfCompetition(uint _competitionId) {
        uint juryId = juryContract.getJuryId(msg.sender);
        uint competitionIndex = _competitionId - 1;
        require(juryId >= 0, "You are not a jury");
        require(competitionIndex < votingCompetitions.length, "Voting competition doesn't exist");
        require(jurysOfCompetitions[competitionIndex][juryId], "You are not a jury for this competition");
        _;
    }

    modifier competitionExists(uint _competitionId) {
        uint competitionIndex = _competitionId - 1;
        require(competitionIndex < votingCompetitions.length, string.concat("Voting competition ", string.concat(Strings.toString(_competitionId), " doesn't exist")));
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

        CompetitionVotingSession storage newCompetitionVotingSession = votingCompetitions.push();
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
    function addNomineeCompetition(uint _competitionId, uint _nomineeTokenId) competitionExists(_competitionId) onlyOwner external {
        uint competitionIndex = _competitionId - 1;

        votingCompetitions[competitionIndex].nominees.push(Nominee(_nomineeTokenId, 0));
        uint nomineeId = votingCompetitions[competitionIndex].nominees.length;

        emit NomineeCompetitionsRegistered(_competitionId, nomineeId, _nomineeTokenId);
    }

    /// @notice Adds jury to a competition.
    /// @param _competitionId The voting competition number.
    /// @param _juryId The jury id.
    function addJuryToCompetition(uint _competitionId, uint _juryId) competitionExists(_competitionId) onlyOwner external {
        require(juryContract.isTokenValid(_juryId), "Jury is invalid");

        uint competitionIndex = _competitionId - 1; // see addCompetition
        jurysOfCompetitions[competitionIndex][_juryId] = true;

        emit JuryAddedToCompetition(_competitionId, _juryId);
    }

    /// @notice Allows you to vote for an option in a competition during a voting session.
    /// @param _competitionId The voting competition id on which the voter wants to vote
    /// @param _nomineeId Index of the nominee in the array of nominees in the competition
    function voteOnCompetition(uint _competitionId, uint _nomineeId) competitionExists(_competitionId) onlyJuryOfCompetition(_competitionId) external {
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
    function getCompetition(uint _competitionId) competitionExists(_competitionId) public view returns(CompetitionVotingSession memory) {
        uint competitionIndex = _competitionId - 1; // see addCompetition        
        return votingCompetitions[competitionIndex];
    }

    /// @notice Gets the voting competition status according to the current timestamp.
    /// @param _competitionId The voting competition number.
    /// @return The voting competition status.
    function getVotingCompetitionStatus(uint _competitionId) competitionExists(_competitionId) public view returns(VotingCompetitionStatus) {
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
    function getUnvotedCompetitionOfJury(uint _competitionId) competitionExists(_competitionId) onlyJuryOfCompetition(_competitionId) external view returns(CompetitionAndVotingStatus memory) {
        CompetitionVotingSession memory competition = getCompetition(_competitionId);
        uint competitionIndex = _competitionId - 1; // see addCompetition

        require(votingCompetitionsVoters[competitionIndex][msg.sender].hasVoted == false, "You already have voted on this competition");

        CompetitionAndVotingStatus memory newCompetitionAndVotingStatus;
        newCompetitionAndVotingStatus.competition = competition;
        newCompetitionAndVotingStatus.votingStatus = getVotingCompetitionStatus(_competitionId);

        return newCompetitionAndVotingStatus;
    }
}
