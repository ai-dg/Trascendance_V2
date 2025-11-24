// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 * @custom:dev-run-script ./scripts/deploy_with_ethers.ts
 */

 struct Game {
	string tournamentId;
	string player1;
	string player2;
	uint8 score1;
	uint8 score2;
	uint256 timestamp;
 }

 struct Tournament {
	string tournamentId;
	string winner;
	string[] players; 
	uint256 timestamp;
 }

contract TournamentStorage {

	Game[] private games;
	Tournament[] private tournaments;


    function storeGame(Game memory game) public returns(uint256) {
		games.push(game);
		return games.length - 1;

    }

	function storeTournament(Tournament memory tournament) public returns(uint256) {
		tournaments.push(tournament);
		return tournaments.length - 1;
	}

    function retrieveTournament(uint256 index) public view returns (Tournament memory){
        return tournaments[index];
    }

    function retrieveGame(uint256 index) public view returns (Game memory){
        return games[index];
    }
}