import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../../../components/base.component';
import { Chess, Color, DEFAULT_POSITION, Piece, Square } from 'chess.js';
import { IPlayer, IPlayerAskConfig } from '../../../interfaces';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { PlayersConfigComponent } from '../../../components/players-config/players-config.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CHESS_COLORS } from '../../../config';
import { take } from 'rxjs';
import { Router } from '@angular/router';
import { isChessColor } from '../../../utils/support.utils';
import { UserService } from '../../../services/user.service';
import { MultiPlayerService } from '../../../services/multi-player.service';

@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  styleUrls: ['./chess-board.component.scss'],
})
export class ChessBoardComponent extends BaseComponent implements OnInit {
  chess: Chess; // Instance of the Chess class
  board: (Piece | undefined)[][] = [];
  gameMode: 'humanVsHuman' | 'humanVsComputer' | 'computerVsComputer' = 'humanVsHuman';
  isWhiteTurn: boolean = true;
  gameOver: boolean = false;
  winner: IPlayer | null = null;
  selectedSquare: string | null = null;
  possibleMoves: string[] = []; // List of possible moves for the selected square

  get currentPlayer(): number {
    return this.players.findIndex(p => (p.color === 'white' && this.isWhiteTurn) || (p.color === 'black' && !this.isWhiteTurn))
  }

  get isMyTurn(): boolean {
    const me = this.userService.me;
    const hasOtherPlayers = this.players.some(p => p.userId != undefined && p.userId != me?.userId);

    if (hasOtherPlayers) {
      const myPlayerIndex = this.players.findIndex(p => p.userId === me?.userId);
      return myPlayerIndex === this.currentPlayer;
    } else return true;
  }

  override get selectedPlayer(): IPlayer | undefined {
    return this.players[this.currentPlayer]
  }

  constructor(
    gameDashboardService: GameDashboardService,
    dialog: MatDialog,
    private router: Router,
    private userService: UserService,
    multiPlayerService: MultiPlayerService
  ) {
    super(gameDashboardService, multiPlayerService, dialog);
    this.chess = new Chess(); // Initialize the Chess instance
  }

  override ngOnInit(): void {
    super.ngOnInit();
    // this.updateBoard();
    this.sendGameStateUpdate();
  }

  getGameState() {
    return {
      chess: this.chess.fen(),
      players: this.players,
      winner: this.winner,
      isWhiteTurn: this.isWhiteTurn,
      gameOver: this.gameOver,
      selectedSquare: this.selectedSquare,
      possibleMoves: this.possibleMoves
    };
  }

  setGameState(savedState: any): void {
    this.players = savedState.players;
    this.winner = savedState.winner;
    this.chess.load(savedState.chess);
    this.isWhiteTurn = savedState.isWhiteTurn;
    this.gameOver = savedState.gameOver;
    this.selectedSquare = savedState.selectedSquare;
    this.possibleMoves = savedState.possibleMoves;
    this.updateBoard();
  }

  loadGameState(): void {

    const savedState = this.gameDashboardService.loadGameState();
    if (savedState) {
      this.setGameState(savedState);

      if (!savedState.winner) {
        if (this.winner || this.players.length === 0 || this.chess.fen() === DEFAULT_POSITION) {
          this.askForPlayers();
        } else if (this.isMultiPlayerGame) {
          this.listenForGameStateChange();
        }
      }
    } else {
      this.askForPlayers();
    }
  }

  saveGameState(): void {
    const state = this.getGameState();
    this.gameDashboardService.saveGameState(state);
  }

  resetGame(): void {
    this.chess.reset(); // Reset the game
    this.gameOver = false;
    this.winner = null;
    this.selectedSquare = null;
    this.possibleMoves = [];
    this.isWhiteTurn = true;
    this.updateBoard();
    this.saveGameState();
    this.sendGameStateUpdate();
  }

  override getPlayerConfigPopup(): MatDialogRef<PlayersConfigComponent, any> | undefined {
    const curGame = this.gameDashboardService.selectedGame.value;
    if (!curGame) return;

    return this.dialog.open(PlayersConfigComponent, {
      data: {
        game: curGame,
        askForName: true,
        minPlayerCount: 2,
        maxPlayerCount: 2,
        preFillPlayers: this.players.length > 0 ? this.players : undefined,
        colorOptions: CHESS_COLORS
      } as IPlayerAskConfig,
      disableClose: true
    })
  }

  askForPlayers(): void {
    const curGame = this.gameDashboardService.selectedGame.value;
    if (!curGame) return;

    const ref = this.getPlayerConfigPopup();
    ref?.afterClosed().pipe(take(1))
      .subscribe((players: IPlayer[] | undefined) => {
        if (!players) {
          if (this.players.length === 0)
            this.router.navigateByUrl('');
        }
        else {
          this.players = players;
          this.resetGame();
          const otherPlayers = this.players.find(p => p.userId !== undefined && p.userId === this.userService.me?.userId) !== undefined;
          if (otherPlayers) {
            this.listenForGameStateChange();
          }

          // if (this.gameDashboardService.selectedGame.value)
          //   this.gameDashboardService.sendGameStartRequest(this.gameDashboardService.selectedGame.value, this.players, this.getGameState());
        }
      })
  }

  isWhitePlayer(player: IPlayer): boolean {
    return player.color === 'white'
  }

  isBlackPlayer(player: IPlayer): boolean {
    return player.color === 'black'
  }

  getPlayer(color: Color): IPlayer {
    const allColors = { 'white': 'w', 'black': 'b' };
    return this.players.find(p => p.color && isChessColor(p.color) ? allColors[p.color] === color : false) ?? this.players[0]
  }

  updateBoard(): void {
    this.board = [];
    for (let i = 0; i < 8; i++) {
      this.board[i] = [];
      for (let j = 0; j < 8; j++) {
        const piece = this.chess.get(this.indicesToSquare(i, j)); // Get piece at position (i, j)
        this.board[i][j] = piece; // Add piece details to the board
      }
    }
    if (!this.winner)
      this.checkGameOver();
  }

  indicesToSquare(i: number, j: number): Square {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    return (files[j] + ranks[i]) as Square;
  }

  movePiece(from: string, to: string): void {
    if (this.gameOver) return; // Prevent moves if the game is over
    try {
      const move = this.chess.move({ from, to }); // Make a move
      if (move) {
        this.updateBoard();
        this.isWhiteTurn = !this.isWhiteTurn;
        this.saveGameState(); // Save the updated game state
        this.sendGameStateUpdate();

        if (this.gameMode === 'humanVsComputer' && !this.isWhiteTurn) {
          this.computerMove();
        }
      }
    } catch (ex) { }
  }

  computerMove(): void {
    if (this.gameOver) return; // Prevent moves if the game is over

    const moves = this.chess.moves(); // Get all possible moves
    const move = moves[Math.floor(Math.random() * moves.length)]; // Pick a random move
    this.chess.move(move); // Make the move
    this.updateBoard();
    this.isWhiteTurn = !this.isWhiteTurn;
    this.saveGameState(); // Save the updated game state
  }

  checkGameOver(): void {
    if (this.chess.isCheckmate()) {
      this.gameOver = true;
      this.winner = this.getPlayer(this.chess.turn() === 'w' ? 'b' : 'w'); // Opposite turn indicates the winner
      this.gameDashboardService.saveGameWinner(this.winner);
    } else if (this.chess.isStalemate() || this.chess.isDraw()) {
      this.gameOver = true;
      this.winner = null;
      this.gameDashboardService.saveGameWinner(this.players, true);
    }
  }

  selectGameMode(mode: 'humanVsHuman' | 'humanVsComputer' | 'computerVsComputer'): void {
    this.gameMode = mode;
    this.resetGame();
  }

  getPieceSymbol(piece: any): string {
    const symbols: { [key: string]: string } = {
      p: '♟', // Pawn
      r: '♜', // Rook
      n: '♞', // Knight
      b: '♝', // Bishop
      q: '♛', // Queen
      k: '♚', // King,
    };

    if (!piece) return ''; // No piece on the square
    const symbol = symbols[piece.type.toLowerCase()]; // Get the symbol based on piece type
    return piece.color === 'w' ? symbol : symbol.toLowerCase(); // Uppercase for white, lowercase for black
  }

  handleSquareClick(i: number, j: number): void {
    if (!this.isMyTurn) return;

    const square = this.indicesToSquare(i, j);

    if (!this.selectedSquare) {
      // Select the square if no square is currently selected
      this.selectedSquare = square;

      // Get possible moves for the selected square and strip prefixes
      const possibleMoves = this.chess.moves({ square }).map((move: string) => move.slice(-2));
      possibleMoves.forEach((move, index) => {
        if (move.includes('+')) {
          possibleMoves[index] = move.replace('+', '');
          // console.log(`${move} is a check.`);
        } else if (move.includes('x')) {
          possibleMoves[index] = move.split('x')[1];
          // console.log(`${move} is a capture.`);
        } else if (move.includes('=')) {
          possibleMoves[index] = move.split('=')[0];
          // console.log(`${move} is a promotion.`);
        } else if (move === 'O-O' || move === 'O-O-O') {
          // Handle castling (no target square to highlight)
          // console.log(`${move} is castling.`);
        } else {
          // console.log(`${move} is a standard move.`);
        }
      });
      this.possibleMoves = possibleMoves;
    } else {
      // Move the piece from the selected square to the clicked square
      // if (this.possibleMoves.includes(square)) {
      this.movePiece(this.selectedSquare, square);
      // }

      // Clear the selected square and possible moves
      this.selectedSquare = null;
      this.possibleMoves = [];
    }
    this.saveGameState();
    this.sendGameStateUpdate();
  }

  isDarkCell(i: number, j: number): boolean {
    return (i + j) % 2 !== 0
  }

  isLightCell(i: number, j: number): boolean {
    return (i + j) % 2 === 0
  }

  isBlackSquare(square: Piece): boolean {
    return square.color === 'b';
  }

  isWhiteSquare(square: Piece): boolean {
    return square.color === 'w';
  }
}
