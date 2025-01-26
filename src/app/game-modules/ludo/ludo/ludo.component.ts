import { Component } from '@angular/core';
import { IPathCell, IPlayer } from '../../../interfaces';
import { BaseComponent } from '../../../components/base.component';
import { LUDO_PATHS } from '../ludo-path';

@Component({
  selector: 'app-ludo',
  templateUrl: './ludo.component.html',
  styleUrl: './ludo.component.scss'
})
export class LudoComponent extends BaseComponent {
  players: IPlayer[] = [];
  currentPlayer: number = 0;
  lastDiceRoll: number = 1;
  rolling: boolean = false;
  totalDiceRoll: number = 0;
  winner: string | null = null;

  paths = LUDO_PATHS;

  loadGameState(): void {
    // Load game state logic
    const savedState = localStorage.getItem('ludoGameState');
    if (savedState) {
      const state = JSON.parse(savedState);
      this.players = state.players;
      this.currentPlayer = state.currentPlayer;
      this.lastDiceRoll = state.lastDiceRoll;
      this.totalDiceRoll = state.totalDiceRoll;
      this.winner = state.winner;
    } else {
      this.askForPlayers();
    }
  }

  resetGame(): void {
    this.players = [];
    this.currentPlayer = 0;
    this.lastDiceRoll = 1;
    this.rolling = false;
    this.totalDiceRoll = 0;
    this.winner = null;
    this.askForPlayers();
  }

  saveGameState(): void {
    const state = {
      players: this.players,
      currentPlayer: this.currentPlayer,
      lastDiceRoll: this.lastDiceRoll,
      totalDiceRoll: this.totalDiceRoll,
      winner: this.winner
    };
    localStorage.setItem('ludoGameState', JSON.stringify(state));
  }

  getPathPosition(cellIndex: number, type: 'col' | 'row' = 'row'): string {
    const row = Math.floor(cellIndex / 15);
    if (type === 'row')
      return (row * 6).toString() + 'vw';
    else
      return ((cellIndex - (row * 15)) * 6).toString() + 'vw';
  }

  askForPlayers(): void {
    const playerCount = prompt('Enter the number of players (2-4):', '2');
    if (!playerCount || +playerCount < 2 || +playerCount > 4) {
      alert('Invalid number of players!');
      return;
    }
    const colors = ['red', 'green', 'yellow', 'blue'];
    this.players = Array.from({ length: +playerCount }, (_, i) => ({
      name: `Player ${i + 1}`,
      color: colors[i],
      ludoCoins: Array(4).fill({ position: 0, finished: false })
    }));
  }

  rollDice(): void {
    if (this.rolling) return;

    this.rolling = true;
    setTimeout(() => {
      this.lastDiceRoll = Math.floor(Math.random() * 6) + 1;
      this.totalDiceRoll += this.lastDiceRoll;
      this.rolling = false;

      if (this.lastDiceRoll < 6) {
        this.moveToNextPlayer();
      }
    }, 1000);
  }

  moveToNextPlayer(): void {
    if (this.checkWinner()) return;

    this.totalDiceRoll = 0;
    this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
  }

  checkWinner(): boolean {
    const current = this.players[this.currentPlayer];
    if (current.ludoCoins?.every(coin => coin.finished)) {
      this.winner = current.name;
      return true;
    }
    return false;
  }

  moveCoin(coinIndex: number): void {
    const current = this.players[this.currentPlayer];
    if (!current.ludoCoins) return;
    const coin = current.ludoCoins[coinIndex];

    if (coin.finished) return;

    const newPosition = coin.position + this.lastDiceRoll;
    if (newPosition > 56) return;

    coin.position = newPosition;
    if (newPosition === 56) {
      coin.finished = true;
    }

    if (this.lastDiceRoll < 6) {
      this.moveToNextPlayer();
    }
  }
}
