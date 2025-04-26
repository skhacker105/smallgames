import { Component } from '@angular/core';
import { BaseComponent } from '../../../components/base.component';
import { Chess, Color, DEFAULT_POSITION, Piece, Square } from 'chess.js';
import { IGameMultiPlayerConnection, IPlayer, IPlayerAskConfig } from '../../../interfaces';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { PlayersConfigComponent } from '../../../components/players-config/players-config.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CHESS_COLORS } from '../../../config';
import { Observable, map, take, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { generateHexId, isChessColor } from '../../../utils/support.utils';
import { UserService } from '../../../services/user.service';
import { MultiPlayerService } from '../../../services/multi-player.service';

type BoardSquare = Piece | undefined;

@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  styleUrls: ['./chess-board.component.scss'],
})
export class ChessBoardComponent extends BaseComponent {
  chess: Chess; // Instance of the Chess class
  board: BoardSquare[][] = [];
  gameMode: 'humanVsHuman' | 'humanVsComputer' | 'computerVsComputer' = 'humanVsHuman';
  isWhiteTurn: boolean = true;
  gameOver: boolean = false;
  winner: IPlayer | null = null;
  selectedSquare: string | null = null;
  possibleMoves: string[] = []; // List of possible moves for the selected square
  isBoardRotated = false;

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

  get winnerName(): string {
    return !this.gameOver ? '' : (this.winner?.name ?? '')
  }

  get winnerMessage(): string {
    return !this.gameOver ? '' : (this.winner ? 'Winner' : `It's a draw`);
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

  getGameState() {
    return {
      chess: this.chess.fen(),
      players: this.players,
      winner: this.winner,
      isWhiteTurn: this.isWhiteTurn,
      gameOver: this.gameOver,
      selectedSquare: this.selectedSquare,
      possibleMoves: this.possibleMoves,
      gameId: this.gameId
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
    this.gameId = savedState.gameId ?? generateHexId(16);
    this.setBoardRotation();
    this.updateBoard();
  }

  loadGameState(): void {

    const savedState = this.gameDashboardService.loadGameState();
    if (savedState) {
      this.setGameState(savedState);

      if (this.gameOver || this.players.length === 0 || this.chess.fen() === DEFAULT_POSITION) {
        this.setPlayersAndStartGame();
      }
    } else {
      this.setPlayersAndStartGame();
    }
  }

  saveGameState(): void {
    const state = this.getGameState();
    this.gameDashboardService.saveGameState(state, (this.gameInfo?.key ?? undefined));

    if (!this.gameInfo) return;
    this.multiPlayerService.updateMultiPlayerGameState(this.gameId, this.gameInfo.key, state);
  }

  resetGame(): void {
    this.askToConfirmResetGame()
      .pipe(take(1), takeUntil(this.isComponentActive))
      .subscribe({
        next: confirm => {
          if (!confirm) return;

          this.performResetGame();
        }
      });
  }
  performResetGame(sendUpdates: boolean = true): void {
    this.gameId = generateHexId(16);
    this.chess.reset(); // Reset the game
    this.gameOver = false;
    this.winner = null;
    this.selectedSquare = null;
    this.possibleMoves = [];
    this.isWhiteTurn = true;
    this.updateBoard();
    this.saveGameState();
    if (sendUpdates) this.sendGameStateUpdate();
  }

  restartGameFromScratch(): void {
    if (!this.gameInfo) return;

    this.players = [];
    this.multiPlayerService.removeGame(this.gameInfo.key, this.gameId);
    this.performResetGame(false);
    this.setPlayersAndStartGame();
  }

  rematch(): void {
    this.performResetGame(false);
    this.setPlayersAndStartGame(true);
  }

  cancelGame(): void {
    this.askToConfirmCancelGame()
      .pipe(take(1), takeUntil(this.isComponentActive))
      .subscribe({
        next: confirm => {
          if (!confirm || !this.gameDashboardService.selectedGame.value) return;

          this.multiPlayerService.cancelMultiPlayerGame(this.gameId, this.gameDashboardService.selectedGame.value, 'Game owner cancelled this game');
          if (this.gameDashboardService.selectedGame.value)
            this.multiPlayerService.removeGameAndGotoHomePage(this.gameDashboardService.selectedGame.value.key, this.gameId);
        }
      });
  }

  leaveGame(): void {
    this.askToConfirmLeaveGame()
      .pipe(take(1), takeUntil(this.isComponentActive))
      .subscribe({
        next: confirm => {
          if (!confirm || !this.mpg) return;

          this.players = [];
          this.multiPlayerService.sendLeaveGameMessage(this.gameId, this.mpg, this.mpg.gameOwner.userId);
          if (this.gameDashboardService.selectedGame.value)
            this.multiPlayerService.removeGameAndGotoHomePage(this.gameDashboardService.selectedGame.value.key, this.gameId);
        }
      });
  }

  override getPlayerConfigPopup(repeatSamePlayer: boolean): MatDialogRef<PlayersConfigComponent, any> | undefined {
    const curGame = this.gameDashboardService.selectedGame.value;
    if (!curGame) return;

    return this.dialog.open(PlayersConfigComponent, {
      data: {
        game: curGame,
        askForName: true,
        minPlayerCount: 2,
        maxPlayerCount: 2,
        preFillPlayers: this.players.length > 0 ? this.players : undefined,
        colorOptions: CHESS_COLORS,
        gameId: this.gameId,
        repeatSamePlayer
      } as IPlayerAskConfig,
      disableClose: true
    })
  }

  setPlayers(repeatSamePlayer: boolean): Observable<IPlayer[]> | undefined {
    const curGame = this.gameDashboardService.selectedGame.value;
    if (!curGame) return;

    const ref = this.getPlayerConfigPopup(repeatSamePlayer);

    return ref?.afterClosed().pipe(
      take(1), takeUntil(this.isComponentActive),
      map((players: IPlayer[] | IGameMultiPlayerConnection | undefined) => {

        if (!players) {
          this.router.navigateByUrl('');
        }
        else {

          if (Array.isArray(players)) this.setLocalPlayers(players);
          else this.setOnlinePlayers(players);
        }

        return this.players;
      })
    )
  }
  setLocalPlayers(players: IPlayer[]): void {
    this.players = players;
  }
  setOnlinePlayers(multiPlayerGame: IGameMultiPlayerConnection): void {
    this.players = multiPlayerGame.players.map(player => player.player);
  }
  setPlayersAndStartGame(repeatSamePlayer: boolean = false): void {
    this.performResetGame(false);

    this.setPlayers(repeatSamePlayer)?.subscribe({
      next: players => {

        this.saveGameState();

        const otherPlayers = this.players.find(p => p.userId && p.userId !== this.userService.me?.userId) !== undefined;
        if (otherPlayers) {
          this.startMultiPlayerGame();
          this.startListening();
        } else {
          this.setBoardRotation();
          this.updateBoard();
        }
      }
    });
  }

  startMultiPlayerGame(): void {
    if (!this.gameDashboardService.selectedGame.value) return;

    this.mpg = this.multiPlayerService.getMultiPlayerGame(this.gameDashboardService.selectedGame.value.key)
    if (!this.mpg) return;

    this.multiPlayerService.updateMultiPlayerGameState(this.mpg.gameId, this.mpg.gameInfo.key, this.getGameState());
    this.multiPlayerService.updateMultiPlayerGamePlayState(this.mpg.gameId, this.mpg.gameInfo.key, 'gameInProgress');

    // Send Game start signal to all players
    this.players.forEach(player => {
      if (player.userId && this.gameDashboardService.selectedGame.value && this.mpg) {
        this.multiPlayerService.sendGameStart(this.gameId, this.mpg, player.userId)
      }
    });

    this.setBoardRotation();
    this.updateBoard();
  }

  setBoardRotation() {
    // Set board rotate if my player is black
    let iAmBlack = false;
    this.players.forEach(player => {
      if (player.userId === this.userService.me?.userId && player.color === 'black') {
        iAmBlack = true;
      }
    });
    if (iAmBlack) this.isBoardRotated = true;
    else this.isBoardRotated = false;
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
  }

  indicesToSquare(i: number, j: number): Square {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    if (this.isBoardRotated) {
      files.reverse();
      ranks.reverse();
    }

    return (files[j] + ranks[i]) as Square;
  }

  movePiece(from: string, to: string): 'success' | 'fail' {
    if (this.gameOver) return 'fail'; // Prevent moves if the game is over
    try {
      const move = this.chess.move({ from, to }); // Make a move

      if (move && this.gameMode === 'humanVsComputer' && !this.isWhiteTurn) {
        this.computerMove();
      }
    } catch (ex) {
      return 'fail'
    }
    return 'success';
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
      const moveState = this.movePiece(this.selectedSquare, square);
      if (moveState === 'success') {
        this.updateBoard();
        this.checkWinner();
        if (!this.winner)
          this.moveToNextPlayer();
      }


      // Clear the selected square and possible moves
      this.selectedSquare = null;
      this.possibleMoves = [];
    }

    this.saveGameState();
    if (!this.gameOver) this.sendGameStateUpdate();
    else {
      this.players.forEach(player => {
        if (!player.userId || !this.gameInfo || player.userId === this.userService.me?.userId) return;

        this.multiPlayerService.updateMultiPlayerGamePlayState(this.gameId, this.gameInfo.key, 'gameEnd');
        const winner = this.gameDashboardService.saveGameWinner(this.gameId, (this.winner ?? this.players), (this.winner ? false : true));
        this.multiPlayerService.sendGameEndMessage(this.gameId, this.gameInfo.key, player.userId, winner, this.getGameState());

        // Remove MPG Game
        this.multiPlayerService.removeMPGFromLocalStorageByGameId(this.gameInfo.key, this.gameId);

        // Listen for Rematch
        this.listenForGameRematchRequest();
      });
    }
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

  moveToNextPlayer(): void {
    this.isWhiteTurn = !this.isWhiteTurn;
  }

  checkWinner() {
    if (this.winner) return;

    if (this.chess.isCheckmate()) {
      this.gameOver = true;
      this.winner = this.getPlayer(this.chess.turn() === 'w' ? 'b' : 'w'); // Opposite turn indicates the winner

    } else if (this.chess.isStalemate() || this.chess.isDraw()) {
      this.gameOver = true;
      this.winner = null;
    }
  }
}
