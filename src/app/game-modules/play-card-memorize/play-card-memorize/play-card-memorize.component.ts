import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Card } from '../../../interfaces';
import { GameDashboardService } from '../../../services/game-dashboard.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { RANKS, SUIT } from '../../../types';
import { LoadingButtonDirective } from '../../../directives';

@Component({
  selector: 'app-play-card-memorize',
  templateUrl: './play-card-memorize.component.html',
  styleUrl: './play-card-memorize.component.scss'
})
export class PlayCardMemorizeComponent implements OnInit, OnDestroy {
  deck: Card[] = [];
  visibleCards: Card[] = [];
  currentQuestionType: string = '';
  currentQuestion: string = '';
  correctAnswer: boolean | null = null;
  correctAnswers: Card[] = [];
  score: number = 0; // Total correct answers
  totalQuestions: number = 0; // Total questions asked
  selectedLevel: number = 1;
  levels: number[] = [1, 2, 3, 4, 5];
  options: (Card | string)[] = []; // Options for the current question (can be cards or yes/no)
  userAnswer: (Card | string)[] = []; // User's selected answer(s)
  isAnswerSubmitted: boolean = false; // Track if the user has submitted an answer
  questionsRemaining: number = 0; // Number of questions remaining for the current set of cards
  isShowingCards: boolean = false; // Track if cards are currently being shown
  cardShowTime = 10000;  // 10 seconds

  @ViewChild('showCard', { read: LoadingButtonDirective }) showCardDirective!: LoadingButtonDirective;

  constructor(private gameDashboardService: GameDashboardService) { }

  ngOnInit(): void {
    this.loadGameState();
  }

  ngOnDestroy(): void {
    this.saveGameState();
  }

  generateDeck(): Card[] {
    const suits: SUIT[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const ranks: RANKS[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank });
      }
    }

    return deck;
  }

  displayCards(cards: Card[]): void {
    this.isShowingCards = true; // Cards are being shown
    this.visibleCards = cards;
    this.currentQuestion = ''; // Hide any visible question
    this.showCardDirective.startLoading();
    setTimeout(() => {
      this.isShowingCards = false; // Cards are no longer being shown
      this.questionsRemaining = 5; // Reset questions remaining
      this.startQuestions();
    }, this.cardShowTime);
  }

  startQuestions(): void {
    if (this.questionsRemaining > 0) {
      this.currentQuestionType = this.getRandomQuestionType();
      this.generateQuestion();
    }
  }

  getRandomQuestionType(): string {
    const questionTypes = ['multiple', 'yesNo'];
    return questionTypes[Math.floor(Math.random() * questionTypes.length)];
  }

  generateQuestion(): void {
    this.userAnswer = []; // Reset user's answer
    this.isAnswerSubmitted = false; // Reset answer submission status

    switch (this.currentQuestionType) {
      case 'multiple':
        this.generateMultipleQuestion();
        break;
      case 'yesNo':
        this.generateYesNoQuestion();
        break;
    }
  }

  generateMultipleQuestion(): void {
    this.currentQuestion = 'Which of these cards were part of the cards on the table?';
    const randomCards = this.getRandomCards(4); // Show 4 random cards
    this.correctAnswers = randomCards.filter(card =>
      this.visibleCards.some(visibleCard => visibleCard.suit === card.suit && visibleCard.rank === card.rank)
    );

    if (this.correctAnswers.length === 0) {
      const numberOfCorrectAnswers = Math.floor(Math.random() * 4);

      for (let i = 0; i < numberOfCorrectAnswers; i++) {
        const asnwerPosition = Math.floor(Math.random() * 4);
        const visibleCardsPickIndex = Math.floor(Math.random() * this.visibleCards.length);
        randomCards[asnwerPosition] = this.visibleCards[visibleCardsPickIndex];
      }

      this.correctAnswers = randomCards.filter(card =>
        this.visibleCards.some(visibleCard => visibleCard.suit === card.suit && visibleCard.rank === card.rank)
      );
    }
    this.options = randomCards; // Show 4 cards as options
  }

  generateYesNoQuestion(): void {
    const needYesAnswer = Math.floor((Math.random() * 2) % 2) === 0;
    const visibleCardsPickIndex = Math.floor(Math.random() * this.visibleCards.length);
    const randomCard = needYesAnswer ? this.visibleCards[visibleCardsPickIndex] : this.getRandomCard();
    this.currentQuestion = `Was the ${randomCard.rank} of ${randomCard.suit} present on the table?`;
    this.correctAnswer = this.visibleCards.some(card => card.suit === randomCard.suit && card.rank === randomCard.rank);
    this.options = ['Yes', 'No']; // Yes/No options
  }

  getRandomCard(): Card {
    return this.deck[Math.floor(Math.random() * this.deck.length)];
  }

  getRandomCards(count: number): Card[] {
    const randomCards: Card[] = [];
    while (randomCards.length < count) {
      const card = this.getRandomCard();
      if (!randomCards.some(c => c.suit === card.suit && c.rank === card.rank)) {
        randomCards.push(card);
      }
    }
    return randomCards;
  }

  selectOption(option: Card | string): void {
    if (this.currentQuestionType === 'multiple') {
      // Toggle selection for multiple-choice questions
      if (this.userAnswer.includes(option)) {
        this.userAnswer = this.userAnswer.filter(o => o !== option);
      } else {
        this.userAnswer.push(option);
      }
    } else {
      // Single selection for presence and yes/no questions
      this.userAnswer = [option];
    }
  }

  submitAnswer(): void {
    this.isAnswerSubmitted = true;
    this.totalQuestions++; // Increment total questions asked

    switch (this.currentQuestionType) {
      case 'presence':
      case 'yesNo':
        this.checkYesNoAnswer();
        break;
      case 'multiple':
        this.checkMultipleAnswer();
        break;
    }

    this.questionsRemaining--;
    if (this.questionsRemaining > 0) {
      this.startQuestions(); // Ask the next question
    } else {
      this.displayCards(this.getRandomCards(5)); // Show new cards after 5 questions
    }
  }

  checkYesNoAnswer(): void {
    const userAnswer = this.userAnswer[0];
    const isCorrect = (userAnswer === 'Yes' && this.correctAnswer) || (userAnswer === 'No' && !this.correctAnswer);

    if (isCorrect) {
      this.score++; // Increment score for correct answer
    }
  }

  checkMultipleAnswer(): void {
    const isCorrect = JSON.stringify(this.userAnswer.sort()) === JSON.stringify(this.correctAnswers.sort());

    if (isCorrect) {
      this.score++; // Increment score for correct answer
    }
  }

  saveGameState(): void {
    const gameState = {
      visibleCards: this.visibleCards,
      currentQuestionType: this.currentQuestionType,
      currentQuestion: this.currentQuestion,
      correctAnswer: this.correctAnswer,
      correctAnswers: this.correctAnswers,
      score: this.score,
      totalQuestions: this.totalQuestions,
      deck: this.deck,
      selectedLevel: this.selectedLevel,
      questionsRemaining: this.questionsRemaining,
      isShowingCards: this.isShowingCards
    };
    this.gameDashboardService.saveGameState(gameState);
  }

  loadGameState(): void {
    const gameState = this.gameDashboardService.loadGameState();
    if (gameState) {
      this.visibleCards = gameState.visibleCards;
      this.currentQuestionType = gameState.currentQuestionType;
      this.currentQuestion = gameState.currentQuestion;
      this.correctAnswer = gameState.correctAnswer;
      this.correctAnswers = gameState.correctAnswers;
      this.score = gameState.score;
      this.totalQuestions = gameState.totalQuestions;
      this.deck = gameState.deck;
      this.selectedLevel = gameState.selectedLevel;
      this.questionsRemaining = gameState.questionsRemaining;
      this.isShowingCards = gameState.isShowingCards;
    } else {
      this.resetGame();
    }
  }

  resetGame(): void {
    this.deck = this.generateDeck();
    this.visibleCards = [];
    this.currentQuestionType = '';
    this.currentQuestion = '';
    this.correctAnswer = null;
    this.correctAnswers = [];
    this.score = 0;
    this.totalQuestions = 0;
    this.questionsRemaining = 0;
    this.isShowingCards = false;
    this.saveGameState();
  }

  onLevelChange(event: Event): void {
    const level = +(event.target as HTMLSelectElement).value;
    this.selectedLevel = level;
    this.resetGame();
  }

  isCard(option: Card | string): option is Card {
    try {
      return (option as Card).suit !== undefined;
    } catch (err) {
      throw (err)
    }
  }

  getCardbackgroundImage(card: Card): string {
    return `url(assets/playingCards/${card.rank}${card.suit[0]}@1x.png)`;
  }
}
