import { Sandbox, SandboxOptions, SandboxPlayer } from "ZEPETO.Multiplay";
import { Player, TennisBall, Transform, Vector3 } from "ZEPETO.Multiplay.Schema";
import { EXIT_MAX_TIME, EXIT_ROOM_MAX_TIME, GAME_MAX_SCORE_NUM, MatchData, MatchDetail, SET_CHECK_SCORE_NUM, SET_MAX_SCORE_NUM } from "./ServerData";

// ball position data
class PosData{
    matchNum? : number;
    x? : number;
    y? : number;
    z? : number;
}

// ball hit position data
class PowerData{
    matchNum? : number;
    sessionId? : string;
    x? : number;
    y? : number;
    z? : number;
    isFirstPlayer? : number;
}

// plyer animation data
class AnimationData{
    sessionId? : string;
    animationName? : string;
    isActive? : boolean;
}

// score data
class ScoreData{
    matchNum? : number;
    setScore1? : number;
    setScore2? : number;
    score1? : number;
    score2? : number;
    currentRound? : number;
}

// match game data
class GamePlayerData{
    player1? : string;
    player2? : string;
}

// Player data scored
class GetScorePlayerData{
    matchNum? : number;
    winnerPlayerNum? : number;
}

// match game winner data
class GetGameWinnerData{
    matchNum? : number;
    winnerPlayer? : string;
}

export default class extends Sandbox {

    private matchData : MatchData = new MatchData();
    private currentTimer : number = 0;
    private gameTimer : number = 0;
    private isFirst : boolean = true;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Event Function

    onCreate(options: SandboxOptions) {
        // Player transform이 변경될 경우 호출
        // 지속적으로 Player transform 값을 변경
        this.onMessage("OnChangedTransform", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if(player) {
                const transform = new Transform();
                transform.position = new Vector3();
                transform.position.x = message.position.x;
                transform.position.y = message.position.y;
                transform.position.z = message.position.z;
                transform.rotation = new Vector3();
                transform.rotation.x = message.rotation.x;
                transform.rotation.y = message.rotation.y;
                transform.rotation.z = message.rotation.z;
                player.transform = transform;
                //console.log(`SendTransform ${message.position.x} ${message.position.y} ${message.position.z}`);
            }
        });
        // Player state가 변경될 경우 호출
        // 주로 점프 및 제스쳐
        this.onMessage("OnChangedState", (client, message) => {
            const player = this.state.players.get(message.sessionId);
            if(player) {
                player.state = message.state;
            }
        });
        // send tennis pos
        this.onMessage<PosData>("SendTennisBallPos", (client, message) => {
            if(message.x != null && message.y != null && message.z != null && message.matchNum != null){
                // const matchGame : MatchDetail = this.matchData.GetMatchByIndex(Number(message.matchNum));
                // this.loadPlayer(matchGame.player2SessionId)?.send("SendTennisBallPosToSever", message);
                let tennisBall = this.state.tennisBalls.get(message.matchNum.toString());
                if(tennisBall != null){
                    tennisBall.position.x = message.x;
                    tennisBall.position.y = message.y;
                    tennisBall.position.z = message.z;
                }
            }
        });
        // send hit Trigger
        this.onMessage<PowerData>("SendHitTrigger", (client, message) => {
            console.log(`SendHitTrigger`);
            if(message.sessionId != null && message.x != null && message.y != null && message.z != null && message.isFirstPlayer != null){
                const matchGame : MatchDetail = this.matchData.GetMatchByIndex(Number(message.matchNum));
                this.loadPlayer(matchGame.player1SessionId)?.send("SendHitTriggerToSever", message);
                this.loadPlayer(matchGame.player2SessionId)?.send("SendHitTriggerToSever", message);
                //this.broadcast("SendHitTriggerToSever", message);
            }
        });
        // send player animation data
        this.onMessage<AnimationData>("SendAnimationData", (client, message) => {
            console.log(`SendAnimationData`);
            if(message.sessionId != null && message.animationName != null && message.isActive != null){
                this.broadcast("SendAnimationDataToSever", message);
            }
        });
        this.onMessage<GetScorePlayerData>("SendGetScorePlayerData", (client, message) => {
            if(message.matchNum != null && message.winnerPlayerNum != null){
                console.log(`SendScoreData ${message.matchNum}`);
                const matchGame : MatchDetail = this.matchData.GetMatchByIndex(Number(message.matchNum));

                this.loadPlayer(matchGame.player1SessionId)?.send("SendScoreDataQuickToSever");
                this.loadPlayer(matchGame.player2SessionId)?.send("SendScoreDataQuickToSever");

                // Adding game score
                if(Number(message.winnerPlayerNum) == 1) matchGame.score1 += 1;
                if(Number(message.winnerPlayerNum) == 2) matchGame.score2 += 1;
                if(Number(message.winnerPlayerNum) == 1 || Number(message.winnerPlayerNum) == 2) matchGame.round += 1;

                // check game kip going
                if(matchGame.score1 >= SET_CHECK_SCORE_NUM || matchGame.score2 >= SET_CHECK_SCORE_NUM){

                    let checkNetSet = false;
                    let isPlayer1Win = false;
                    let isPlayer2Win = false;
                    // 6:6 인 경우 ‘타이브레이크 시스템’에 의해 먼저 1승하는 사람이 승리.
                    if(matchGame.score1 > SET_MAX_SCORE_NUM || matchGame.score2 > SET_MAX_SCORE_NUM){
                        checkNetSet = true;
                        if (matchGame.score1 > SET_MAX_SCORE_NUM) isPlayer1Win = true;
                        else isPlayer2Win = true;
                    }
                    // 4점이상 + 상대방 점수의 차이가 2점 이상의 값을 가질 경우
                    else if(matchGame.score1 >= SET_CHECK_SCORE_NUM && (matchGame.score1 - matchGame.score2) >= 2){
                        checkNetSet = true;
                        isPlayer1Win = true;
                    }else if(matchGame.score2 >= SET_CHECK_SCORE_NUM && (matchGame.score2 - matchGame.score1) >= 2){
                        checkNetSet = true;
                        isPlayer2Win = true;
                    }

                    // setting next set
                    if(checkNetSet){
                        if(isPlayer1Win){
                            console.log(`set winner ${matchGame.player1SessionId}`);
                            matchGame.setScore1 += 1;
                        }
                        if(isPlayer2Win){
                            console.log(`set winner ${matchGame.player2SessionId}`);
                            matchGame.setScore2 += 1;
                        }
                        matchGame.score1 = 0;
                        matchGame.score2 = 0;
                    }
                }

                // end game
                if(matchGame.setScore1 >= GAME_MAX_SCORE_NUM || matchGame.setScore2 >= GAME_MAX_SCORE_NUM){
                    console.log(`SendGameEnd ${matchGame.score1} ${matchGame.setScore2}`);
                    if(matchGame.setScore1 >= GAME_MAX_SCORE_NUM){
                        console.log(`winner ${matchGame.player1SessionId}`);
                        this.EndGameAndReset(client.sessionId, false, matchGame.player1SessionId);
                    }else{
                        console.log(`winner ${matchGame.player2SessionId}`);
                        this.EndGameAndReset(client.sessionId, false, matchGame.player2SessionId);

                    }
                }else{
                    // if not end, send score data
                    let scoreData : ScoreData = new ScoreData();
                    scoreData.matchNum = message.matchNum;
                    scoreData.setScore1 = matchGame.setScore1;
                    scoreData.setScore2 = matchGame.setScore2;
                    scoreData.score1 = matchGame.score1;
                    scoreData.score2 = matchGame.score2;
                    scoreData.currentRound = matchGame.round;

                    this.loadPlayer(matchGame.player1SessionId)?.send("SendScoreDataToSever", scoreData);
                    this.loadPlayer(matchGame.player2SessionId)?.send("SendScoreDataToSever", scoreData);
                    //this.broadcast("SendScoreDataToSever", scoreData);
                }
            }
        });
        this.onMessage("SendGameReady", (client, message) => {
            console.log(`SendGameReady ${client.sessionId}`); 

            let index : number = 0;
            // found match game number
            for(let num = 0; num < this.matchData.GetNumberOfMatch(); num++){
                if(num != 0 && this.matchData.GetMatchByIndex(num).isMatch == false){
                    index = num;
                    break;
                }
            }

            if(index == 0) return;

            const matchGame : MatchDetail = this.matchData.GetMatchByIndex(index);

            if(matchGame.isMatch == false && (matchGame.isPlayer1 == false || matchGame.isPlayer2 == false)){
                // game player setting
                if(matchGame.isPlayer1 == false){
                    if(matchGame.isPlayer2 == true && matchGame.player2SessionId == client.sessionId) return;
                    matchGame.player1SessionId = client.sessionId;
                    matchGame.isPlayer1 = true;
                    client.send("GetReadySettingMatchNum", index);
                    console.log(`SendGameReady index ${index} isPlayer1`); 
                }else{
                    if(matchGame.isPlayer1 == true && matchGame.player1SessionId == client.sessionId) return;
                    matchGame.player2SessionId = client.sessionId;
                    matchGame.isPlayer2 = true;
                    client.send("GetReadySettingMatchNum", index);
                    console.log(`SendGameReady index ${index} isPlayer2`); 
                }
            }

            // full game player
            if(matchGame.isPlayer1 && matchGame.isPlayer2){

                // setting game match
                const selectPlayer1 = this.state.players.get(matchGame.player1SessionId);
                const selectPlayer2 = this.state.players.get(matchGame.player2SessionId);
                if(selectPlayer1){
                    selectPlayer1.isHost = true;
                    matchGame.currentMatchHostSessionId = selectPlayer1.sessionId;
                    selectPlayer1.matchGameNum = index;
                    selectPlayer1.currnetPlayerNum = 1;
                    console.log(`player1SessionId isHost ${matchGame.player1SessionId}`);
                }
                if(selectPlayer2){
                    selectPlayer2.isHost = false;
                    selectPlayer2.matchGameNum = index;
                    selectPlayer2.currnetPlayerNum = 2;
                    console.log(`player2SessionId ${matchGame.player2SessionId}`);
                }

                let gamePlayerData = new GamePlayerData();
                gamePlayerData.player1 = matchGame.player1SessionId;
                gamePlayerData.player2 = matchGame.player2SessionId;

                matchGame.isMatch = true;
                this.loadPlayer(matchGame.player1SessionId)?.send("GameStartToSever", gamePlayerData);
                this.loadPlayer(matchGame.player2SessionId)?.send("GameStartToSever", gamePlayerData);
                //this.broadcast("GameStartToSever", gamePlayerData);
                this.broadcast("ChangeHost", 1); // 1은 의미없는 숫자

                console.log(`GameStartToSever ChangeHost`);
            }
        });
        this.onMessage("SendNotGameReady", (client, message) => {
            for(let num = 0; num < this.matchData.GetNumberOfMatch(); num++){
                const matchGame : MatchDetail = this.matchData.GetMatchByIndex(num);
                if(num != 0 && matchGame.isMatch == false){
                    if(matchGame.player1SessionId == client.sessionId){
                        matchGame.isPlayer1 = false;
                        matchGame.player1SessionId = '';
                    }
                    if(matchGame.player2SessionId == client.sessionId){
                        matchGame.isPlayer2 = false;
                        matchGame.player2SessionId ='';
                    }
                }
            }  
        });
        this.onMessage("OnApplicationPause", (client, message : any) => {
            // if player turns phone back round, Declare game over
            const player = this.state.players.get(client.sessionId);
            if(player){
                console.log(`OnApplicationPause ${this.gameTimer}`);
                player.pauseTime = this.gameTimer;
                player.isPause = true;
            }
        });
        this.onMessage("OnApplicationResume", (client, message : any) => {
            // if player turns phone back round, Declare game over
            const player = this.state.players.get(client.sessionId);
            if(player){
                console.log(`OnApplicationPause ${this.gameTimer}`);
                player.isPause = false;
                player.pauseTime = 0;
            }
        });
        this.onMessage("TestGameEnd", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if(player){
                player.matchGameNum = 0;
                player.currnetPlayerNum = 0;
            }
        });
        this.onMessage("SendSubMiss", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if(player){
                const matchGame : MatchDetail = this.matchData.GetMatchByIndex(player.matchGameNum);
                this.loadPlayer(matchGame.player1SessionId)?.send("SendSubMissToServer", message);
                this.loadPlayer(matchGame.player2SessionId)?.send("SendSubMissToServer", message);
                console.log(`SendSubMiss`);
            }
        });
    }

    onJoin(client: SandboxPlayer) {
        console.log(`[OnJoin] sessionId : ${client.sessionId}, UserId : ${client.userId}`);
        let player : Player = this.initPlayer();
        player.sessionId = client.sessionId;   
        if(client.userId) {
            player.zepetoUserId = client.userId;
        }
        if(this.isFirst){
            // 처음 좀비 배열 만들어주기
            for (let i = 0; i < this.matchData.GetNumberOfMatch(); i++) {
                let tennisBall = new TennisBall(); // player 정보 확인
                tennisBall.index = i;
                tennisBall.position.x = 0;
                tennisBall.position.y = 0;
                tennisBall.position.z = 0;
                this.state.tennisBalls.set(i.toString(), tennisBall);
            }
            this.isFirst = false;
        }
        this.state.players.set(client.sessionId, player);
    }

    onLeave(client: SandboxPlayer, consented?: boolean) {
        this.EndGameAndReset(client.sessionId, true, '');
        console.log(`[onLeave] sessionId : ${client.sessionId}, UserId : ${client.userId}, Consented : ${consented}`);
        this.state.players.delete(client.sessionId);
    }

    onTick(deltaTime : number){
        this.currentTimer += deltaTime * 0.001;
        if(this.currentTimer > 1) {
            this.currentTimer -= 1;
            this.gameTimer += 1;

            this.state.players.forEach(player => {
                if(player.isPause && player.matchGameNum != 0){
                    let diffTime = this.gameTimer - player.pauseTime;
                    if(diffTime > EXIT_MAX_TIME){
                        const matchGame : MatchDetail = this.matchData.GetMatchByIndex(player.matchGameNum);
                        if(matchGame.player1SessionId == player.sessionId || matchGame.player2SessionId == player.sessionId){
                            this.EndGameAndReset(player.sessionId, true, '');
                        }
                    }
                }
                if(player.isPause){
                    let diffTime = this.gameTimer - player.pauseTime;
                    if(diffTime > EXIT_ROOM_MAX_TIME){
                        this.tryKick(player.sessionId);
                    }
                }
            });
        }
    }

    async tryKick(sessionId: string) {
        let player = this.loadPlayer(sessionId);
        if(player) {
            await this.kick(player);
            console.log(`try kick : ${player.userId}`);
        }
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // ETC

    private initPlayer() : Player {
        const player : Player = new Player();
        player.sessionId = "";
        player.zepetoUserId = "";
        player.state = 0;
        const transform = new Transform();
        transform.position = new Vector3();
        transform.position.x = 0;
        transform.position.y = 0;
        transform.position.z = 0;
        transform.rotation = new Vector3();
        transform.rotation.x = 0;
        transform.rotation.y = 0;
        transform.rotation.z = 0;
        player.transform = transform;
        player.currnetPlayerNum = 0;
        player.matchGameNum = 0;
        player.isHost = false;
        player.pauseTime = 0;
        player.isPause = false;
        return player;
    }

    private EndGameAndReset(sessionId : string, isLeave : boolean, winner : string){
        const player = this.state.players.get(sessionId);
        // 매칭 중인 게임이 있었으면
        if(player && player.matchGameNum != 0){
            console.log(`[EndGame] EndGameAndReset ${player.matchGameNum}`);
            let matchGameNum : number = player.matchGameNum;
            let winnerSessionId : string = '';
            const matchGame : MatchDetail = this.matchData.GetMatchByIndex(matchGameNum);
                
            const selectPlayer1 = this.state.players.get(matchGame.player1SessionId);
            const selectPlayer2 = this.state.players.get(matchGame.player2SessionId);

            if(isLeave){
                if(matchGame.player1SessionId == sessionId){
                    // 승자는 matchGame.player2SessionId
                    winnerSessionId = matchGame.player2SessionId;
                }else{
                    // 승자는 matchGame.player1SessionId
                    winnerSessionId = matchGame.player1SessionId;
                }
            }else{
                winnerSessionId = winner;
            }

            console.log(`[EndGame] winnerSessionId ${winnerSessionId}`);

            ////////////////// match Reset

            // score info reset
            let scoreData : ScoreData = new ScoreData();
            scoreData.matchNum = player.matchGameNum;
            scoreData.setScore1 = 0;
            scoreData.setScore2 = 0;
            scoreData.score1 = 0;
            scoreData.score2 = 0;
            scoreData.currentRound = 1;
            matchGame.score1 = 0;
            matchGame.score2 = 0;
            matchGame.round = 1;

            this.loadPlayer(matchGame.player1SessionId)?.send("SendScoreDataToSever", scoreData);
            this.loadPlayer(matchGame.player2SessionId)?.send("SendScoreDataToSever", scoreData);
            //this.broadcast("SendScoreDataToSever", scoreData);
            console.log(`[EndGame] SendScoreDataToSever`);

            // player info reset
            if(selectPlayer1){
                selectPlayer1.isHost = false;
                selectPlayer1.matchGameNum = 0;
                selectPlayer1.currnetPlayerNum = 0;
                console.log(`[EndGame] reset selectPlayer1 info ${selectPlayer1.sessionId}`);
            }
            if(selectPlayer2){
                selectPlayer2.isHost = false;
                selectPlayer2.matchGameNum = 0;
                selectPlayer2.currnetPlayerNum = 0;
                console.log(`[EndGame] reset selectPlayer2 info ${selectPlayer2.sessionId}`);
            }

            let getScorePlayerData = new GetGameWinnerData();
            getScorePlayerData.matchNum = matchGameNum;
            getScorePlayerData.winnerPlayer = winnerSessionId;

            console.log(`[EndGame] SendGameEndToSever ${getScorePlayerData.matchNum} ${getScorePlayerData.winnerPlayer}`);
            this.loadPlayer(matchGame.player1SessionId)?.send("SendGameEndToSever", getScorePlayerData);
            this.loadPlayer(matchGame.player2SessionId)?.send("SendGameEndToSever", getScorePlayerData);

            // match info reset
            matchGame.isMatch = false;
            matchGame.isPlayer1 = false;
            matchGame.isPlayer2 = false;
            matchGame.player1SessionId = '';
            matchGame.player2SessionId = '';
            matchGame.currentMatchHostSessionId = '';
            matchGame.setScore1 = 0;
            matchGame.setScore2 = 0;
            matchGame.score1 = 0;
            matchGame.score2 = 0;
            matchGame.round = 1;

            // this.broadcast("SendGameEndToSever", matchGameNum);
            this.broadcast("ChangeHost", 1); // 1은 의미없는 숫자
        } 
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}