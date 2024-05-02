export const SET_CHECK_SCORE_NUM : number = 4;
export const SET_MAX_SCORE_NUM : number = 6;
export const GAME_MAX_SCORE_NUM : number = 2;
export const EXIT_MAX_TIME : number = 5;
export const EXIT_ROOM_MAX_TIME : number = 8;

export class MatchDetail {
    public isMatch : boolean = false;
    public isPlayer1 : boolean = false;
    public isPlayer2 : boolean = false;
    public player1SessionId : string = '';
    public player2SessionId : string = '';
    public currentMatchHostSessionId : string = '';
    public setScore1 : number = 0;
    public setScore2 : number = 0;
    public score1 : number = 0;
    public score2 : number = 0;
    public round : number = 1;
}

export class MatchData {
    /* Const Values */
    private readonly NumberOfMatches : number = 5;
    /* Values */
    private matches : MatchDetail[] = [];
    /* Constructor */
    constructor() {
        for (let index = 0; index < this.NumberOfMatches; index++) {
            this.matches.push(
                new MatchDetail
            );
        }
    }
    /* Function */
    public GetMatchByIndex(index : number) : MatchDetail {
        return this.matches[this.ClampNumber(index, 0, this.matches.length - 1)];
    }
    public GetNumberOfMatch() : number {
        return this.matches.length;
    }
    private ClampNumber(num : number, a : number, b : number) : number {
        return Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));
    }
}