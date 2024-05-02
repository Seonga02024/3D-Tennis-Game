import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import * as UnityEngine from 'UnityEngine'
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { Player, State, TennisBall } from 'ZEPETO.Multiplay.Schema';
import { CharacterState, ZepetoCharacter, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Vector3 } from 'ZEPETO.Multiplay.Schema';
import { SpawnInfo } from 'ZEPETO.Character.Controller';
import { GRAVITY, SceneType } from './Data/SystemData';
import TS_SceneManager from './System/TS_SceneManager';
import TS_PlayerController from './System/Player/TS_PlayerController';
import TS_GameManager from './System/TS_GameManager';
import TS_PlayerControllerManager from './Controller/TS_PlayerControllerManager';
import TS_BallEvent from './Event/TS_BallEvent';
import TS_SystemCanvas from './Canvas/TS_SystemCanvas';
import TS_PlayerColliderTrigger from './Event/TS_PlayerColliderTrigger';
import TS_GameSound, { SFX } from './Controller/TS_GameSound';

class GamePlayerData{
    player1 : string;
    player2 : string;
}

class PosData{
    matchNum : number;
    x : number;
    y : number;
    z : number;
}

class PowerData{
    matchNum : number;
    sessionId : string;
    x : number;
    y : number;
    z : number;
    isFirstPlayer : number;
}

class ScoreData{
    matchNum : number;
    setScore1 : number;
    setScore2 : number;
    score1 : number;
    score2 : number;
    currentRound : number;
}

class GetScorePlayerData{
    matchNum : number;
    winnerPlayerNum : number;
}

class GetGameWinnerData{
    matchNum : number;
    winnerPlayer : string;
}

// const values
const SEND_MESSAGE_LOOP_DURATION : number = 0.04;
const SEND_TENNISBALL_LOOP_DURATION : number = 0.01;
const ALLOWABLE_POSITION_DIFFERENCE : number = 3;

export default class TS_ClientStarter extends ZepetoScriptBehaviour {

    @Header("Ball")
    @SerializeField()
    public ball : UnityEngine.GameObject[];
    // management of tennis balls
    // 0 : test ball
    // 1~4 : match game balls
    private ballRigid : UnityEngine.Rigidbody[] = [];
    @NonSerialized() public ballTS : TS_BallEvent[] = [];
    @NonSerialized() public isGameStart : boolean = false; // is game start
    @NonSerialized() public isSoloPlay : boolean = false; // test
    @NonSerialized() public isDualPlay : boolean = false; // test
    @NonSerialized() public isRobotPlay : boolean = false; // test
    private isPause : boolean = false; // current player phone background
    private isSettingGameHost : boolean = false; // Call change host 
    private currentMatchGameNum : number = 0; // current player match game number
    // 0 : no match / 1~4 : match
    private player1SessionId : string = null; // match game player 1
    private player2SessionId : string = null; // match game player 2
    // 이미 라운드가 끝났지만 해당 데이터가 날아오기 전에 또 치는 경우를 막기 위한 함수
    private isWaitSendData : boolean = false; // is round alread over?

    @Header("player Hit Range")
    @SerializeField()
    public playerHitRange : UnityEngine.GameObject; // hit range collider
    @SerializeField()
    public playerHitRangeImg : UnityEngine.GameObject; // hit obj foot

    @Header("Default")
    @SerializeField()
    private multiplay : ZepetoWorldMultiplay;

    /* Instances */
    private room : Room = null;
    @NonSerialized() public player : Player = null;
    @NonSerialized() public zepetoPlayer : ZepetoPlayer = null;
    @NonSerialized()
    public currentPlayers:Map<string, Player> = new Map<string, Player>();

    @NonSerialized()
    public currentZepetoCharacterRef:Map<string, ZepetoCharacter> = new Map<string, ZepetoCharacter>();

    /* Coroutines */
    private ballCoroutine : UnityEngine.Coroutine = null;
    /* Timers */
    private waitForSendMessageLoop : UnityEngine.WaitForSeconds = new UnityEngine.WaitForSeconds(SEND_MESSAGE_LOOP_DURATION);
    private waitForSendTennisBallLoop : UnityEngine.WaitForSeconds = new UnityEngine.WaitForSeconds(SEND_TENNISBALL_LOOP_DURATION);
    private waitForMoment : UnityEngine.WaitForSeconds = new UnityEngine.WaitForSeconds(1);

    /* Singleton */
    private static Instance: TS_ClientStarter;
    public static GetInstance(): TS_ClientStarter {
        if (!TS_ClientStarter.Instance) {
            const targetObj = UnityEngine.GameObject.Find("ClientStarter");
            if (targetObj)
            TS_ClientStarter.Instance = targetObj.GetComponent<TS_ClientStarter>();
        }
        return TS_ClientStarter.Instance;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Event Function

    private Start() {    
        this.multiplay.RoomCreated += (room:Room) => {
            this.room = room;
            this.room.AddMessageHandler("ChangeHost", (message: number) => { 
                this.isSettingGameHost = true;
            });
            // this.room.AddMessageHandler<PosData>("SendTennisBallPosToSever", message => {
            //     //console.log(`SendTennisBallPosToSever ${message.matchNum} ${this.player.matchGameNum}`);
            //     if(this.player != null && message.matchNum == this.player.matchGameNum){
            //         //console.log(`SendTennisBallPosToSever ${message.matchNum} ${this.player.matchGameNum}`);
            //         if(message.x != null && message.y != null && message.z != null){
            //             if(this.player.isHost == false){
            //                 this.ballTS[this.player.matchGameNum].ChangeBallPosNoHost(new UnityEngine.Vector3(message.x, message.y, message.z));
            //             }
            //         }
            //     }
            // }); 
            this.room.AddMessageHandler<PowerData>("SendHitTriggerToSever", message => {
                if(this.player.isHost) console.log(`SendHitTriggerToSever ${message.sessionId} ${message.isFirstPlayer}`);
                if(this.isWaitSendData == true) return;
                if(message.matchNum == this.player.matchGameNum){
                    if(message.sessionId != null && message.x != null && message.y != null && message.z != null && message.isFirstPlayer != null){
                        let power : UnityEngine.Vector3 = new UnityEngine.Vector3(message.x, message.y, message.z);
                        TS_GameManager.GetInstance().ChangeDropBallObj(power, this.ball[this.player.matchGameNum].transform.position);
                        TS_SystemCanvas.GetInstance().GetTestPanel().ChangeBallDataText(Number(message.matchNum));

                        // sfx
                        if(message.isFirstPlayer == 1 && TS_GameManager.GetInstance().isPlayer1) TS_GameSound.GetInstance().sfxPlay(SFX.TennisBallHitMe);
                        else if(message.isFirstPlayer == 0 && TS_GameManager.GetInstance().isPlayer1 == false) TS_GameSound.GetInstance().sfxPlay(SFX.TennisBallHitMe);
                        else if(message.isFirstPlayer == 1 && TS_GameManager.GetInstance().isPlayer1 == false) TS_GameSound.GetInstance().sfxPlay(SFX.TennisBallHitNotMe);
                        else TS_GameSound.GetInstance().sfxPlay(SFX.TennisBallHitNotMe);

                        TS_GameManager.GetInstance().StopCountDown();
                        if(this.ballRigid[this.player.matchGameNum] != null){
                            TS_GameManager.GetInstance().CheckRoundAndHit(power, Number(message.isFirstPlayer));
                        }
                    }
                }
                // if solo play
                if(message.matchNum == 0 && message.sessionId == this.room.SessionId){
                    if(message.sessionId != null && message.x != null && message.y != null && message.z != null && message.isFirstPlayer != null){
                        let power : UnityEngine.Vector3 = new UnityEngine.Vector3(message.x, message.y, message.z);
                        TS_GameManager.GetInstance().ChangeDropBallObj(power, this.ball[0].transform.position);
                        if(this.ballRigid != null){
                            this.ballTS[0].playerHitBall(power, Number(message.isFirstPlayer));
                        }
                    }
                }
            });
            this.room.AddMessageHandler<ScoreData>("SendScoreDataToSever", message => { 
                if(this.player.isHost) console.log(`SendScoreDataToSever`);
                if(this.isGameStart == false) return;
                if(message.setScore1 != null && message.setScore2 != null && message.score1 != null && message.score2 != null && message.currentRound != null){
                    TS_GameManager.GetInstance().FinishRound();
                    TS_SystemCanvas.GetInstance().GetScorePanel().ChangeScorePanel(Number(message.setScore1), Number(message.setScore2),Number(message.score1), Number(message.score2), Number(message.currentRound));
                    this.isWaitSendData = false;
                }
            });
            this.room.AddMessageHandler<GamePlayerData>("GameStartToSever", message => { 
                // if my player participate in the game
                if(message.player1 != null && message.player2 != null && (message.player1 == this.player.sessionId || message.player2 == this.player.sessionId)){
                    
                    this.player1SessionId = message.player1;
                    this.player2SessionId = message.player2;

                    console.log(`GameStartToSever ${message.player1} ${message.player2}`);
                    if(message.player1 == this.player.sessionId){
                        TS_GameManager.GetInstance().isPlayer1 = true;
                    }
                    if(message.player2 == this.player.sessionId){
                        TS_GameManager.GetInstance().isPlayer1 = false;
                    }

                    TS_PlayerControllerManager.GetInstance().SetGamePlayerInfo(message.player1, message.player2);
                    TS_GameManager.GetInstance().GameStart();
                    TS_SystemCanvas.GetInstance().GetTestPanel().SettingGameUI(false);
                    TS_SystemCanvas.GetInstance().GetTimePanel().OnTimePanel(true);

                    if(this.ballCoroutine != null) { this.StopCoroutine(this.ballCoroutine); }
                    this.ballCoroutine = this.StartCoroutine(this.SendBallPosLoop());
                }
            });
            this.room.AddMessageHandler<GetGameWinnerData>("SendGameEndToSever", message => { 
                console.log(`SendGameEndToSever`);
                if(message.matchNum != null && message.winnerPlayer != null){
                    console.log(`SendGameEndToSever ${this.currentMatchGameNum} ${Number(message.matchNum)}`);
                    // 자신의 게임이 끝났는지 확인하기
                    if(this.currentMatchGameNum != Number(message.matchNum)) return;
                    this.StartCoroutine(this.GameEnd(message.winnerPlayer));
                }
            });
            this.room.AddMessageHandler("SendSubMissToServer", message => { 
                if(this.isGameStart){
                    this.ballTS[this.currentMatchGameNum].SubMiss();
                }
            });
            this.room.AddMessageHandler("SendScoreDataQuickToSever", message => { 
                this.isWaitSendData = true;
            });
        }
        this.multiplay.RoomJoined += (room:Room) => {
            room.OnStateChange += this.OnStateChange;
        }
        // basic setting
        this.StartCoroutine(this.SendMessageLoop());
        for(let i =0; i < this.ball.length; i++){
            this.ballTS.push(this.ball[i].GetComponent<TS_BallEvent>());
            this.ballRigid.push(this.ball[i].GetComponent<UnityEngine.Rigidbody>());
            this.ball[i].SetActive(false);
        }
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // States

    // 서버에 처음 접속 시에도 한번 호출
    // 그 이후 서버 State가 변경될 경우 호출
    private OnStateChange(state : State, isFirst : boolean) {
        if(isFirst) {
            // LocalPlayer 추가
            ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
                // set zepeto values
                const mPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;
                const player : Player = this.currentPlayers.get(this.room.SessionId);
                this.zepetoPlayer = mPlayer;
                // set default gravity
                this.zepetoPlayer.character.motionState.gravity = GRAVITY;
                // add playerController
                let playerController = this.zepetoPlayer.character.gameObject.AddComponent<TS_PlayerController>();
                TS_PlayerControllerManager.GetInstance().SetPlayerController(this.room.SessionId, playerController);
                TS_PlayerControllerManager.GetInstance().AddPlayerInfo(this.room.SessionId, player.zepetoUserId);
                // init
                playerController.Init(this.zepetoPlayer.character, true, this.room.SessionId);
                TS_GameManager.GetInstance().LocalPlayerController(playerController);
                this.currentZepetoCharacterRef.set(this.room.SessionId, mPlayer.character);
                mPlayer.character.gameObject.tag = "Player";
                mPlayer.character.gameObject.layer = UnityEngine.LayerMask.NameToLayer("Player");

                this.playerHitRange.GetComponent<TS_PlayerColliderTrigger>().playerControllerTS = playerController;
                this.playerHitRange.transform.SetParent(mPlayer.character.gameObject.transform);
                this.playerHitRange.transform.localPosition = new UnityEngine.Vector3(0, 0, 0);
                this.playerHitRangeImg.transform.SetParent(mPlayer.character.gameObject.transform);
                this.playerHitRangeImg.transform.localPosition = new UnityEngine.Vector3(0, 0.02, 0);
            });
            // 다른 Player 추가
            ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId:string) => {
                const isLocal = this.room.SessionId === sessionId;
                if(!isLocal) {
                    const player : Player = this.currentPlayers.get(sessionId);
                    const mPlayer : ZepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);
                    player.OnChange += (ChangeValues) => this.OnUpdatePlayer(sessionId, player);
                    this.currentZepetoCharacterRef.set(sessionId, mPlayer.character);
                    mPlayer.character.gameObject.tag = "Player";
                    mPlayer.character.gameObject.layer = UnityEngine.LayerMask.NameToLayer("Player");
                    let playerController = mPlayer.character.gameObject.AddComponent<TS_PlayerController>();
                    playerController.Init(mPlayer.character, false, sessionId);
                    TS_PlayerControllerManager.GetInstance().SetPlayerController(sessionId, playerController);
                    TS_PlayerControllerManager.GetInstance().AddPlayerInfo(sessionId, player.zepetoUserId);
                }
            });
        }
        let join = new Map<string, Player>();
        let leave = new Map<string, Player>(this.currentPlayers);
        state.players.ForEach((sessionId:string, player:Player) => {
            if(!this.currentPlayers.has(sessionId)) {
                join.set(sessionId, player);
            }
            leave.delete(sessionId);
        });
        join.forEach((player:Player, sessionId:string) => this.OnJoinPlayer(sessionId, player));
        leave.forEach((player:Player, sessionId:string) => this.OnLeavePlayer(sessionId, player));

        if(this.isGameStart && this.player.isHost == false){
            this.UpdateTennisBall(state);
        }
    }

    private UpdateTennisBall(state:State) {
        if(this.player.matchGameNum != 0){
            let tennisBall : TennisBall = state.tennisBalls.get_Item(this.player.matchGameNum.toString());
            let newPos = new UnityEngine.Vector3(tennisBall.position.x, tennisBall.position.y, tennisBall.position.z);
            this.ballTS[this.player.matchGameNum].ChangeBallPosNoHost(newPos);
        }
    }

    private OnUpdatePlayer(sessionId : string, player : Player) {
        const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);

        // It's in the player test state
        if(this.player.matchGameNum == 0){
            if(player.matchGameNum != 0){
                if(zepetoPlayer.character.gameObject != null){
                    zepetoPlayer.character.gameObject.transform.GetChild(0).gameObject.SetActive(false);
                }
                return;
            }else{
                if(zepetoPlayer.character.gameObject != null){
                    zepetoPlayer.character.gameObject.transform.GetChild(0).gameObject.SetActive(true);
                }
            }
        }else{
            // It's not in the player test state
            if(player.matchGameNum == this.player.matchGameNum){
                if(zepetoPlayer.character.gameObject != null){
                    zepetoPlayer.character.gameObject.transform.GetChild(0).gameObject.SetActive(true);
                }
            }else{
                if(zepetoPlayer.character.gameObject != null){
                    zepetoPlayer.character.gameObject.transform.GetChild(0).gameObject.SetActive(false);
                }
                return;
            }
        }

        const position = this.ParseVector3(player.transform.position);
        const rotation = player.transform.rotation;
        var moveDir = UnityEngine.Vector3.op_Subtraction(position, zepetoPlayer.character.transform.position);
        // 기본
        moveDir = new UnityEngine.Vector3(moveDir.x, 0, moveDir.z);
        if (moveDir.magnitude < 0.05) {
            if (player.state === CharacterState.MoveTurn)
                return;
            zepetoPlayer.character.StopMoving();
        } else {
            zepetoPlayer.character.MoveContinuously(moveDir);
        }
        // 기본 state
        if (player.state === CharacterState.Jump) {
            if (zepetoPlayer.character.CurrentState !== CharacterState.Jump) {
                zepetoPlayer.character.Jump();
            }
        }
        // Scene에서의 캐릭터의 위치와 서버에서의 캐릭터 위치가 허용값 보다 많이 차이날 경우 Teleport
        if (UnityEngine.Vector3.Distance(zepetoPlayer.character.transform.position, position) > ALLOWABLE_POSITION_DIFFERENCE) {
            zepetoPlayer.character.transform.position = position;
            zepetoPlayer.character.transform.rotation = UnityEngine.Quaternion.Euler(rotation.x, rotation.y, rotation.z);
        }
    }

    private OnJoinPlayer(sessionId : string, player : Player) {
        if(this.isGameStart) return;
        console.log(`[OnJoinPlayer] players - sessionId : ${sessionId}`);
        this.currentPlayers.set(sessionId, player);
        const spawnInfo : SpawnInfo = new SpawnInfo();
        const position : UnityEngine.Vector3 = this.gameObject.transform.position;
        const rotation : UnityEngine.Quaternion = this.gameObject.transform.rotation;
        const isLocal = this.room.SessionId === player.sessionId;
        spawnInfo.position = position;
        spawnInfo.rotation = rotation;
        if(isLocal) {
            this.player = player;
            TS_SceneManager.GetInstance().Load(SceneType.Dummy, ()=>{
                ZepetoPlayers.instance.CreatePlayerWithUserId(sessionId, player.zepetoUserId, spawnInfo, isLocal);
            });
            TS_SystemCanvas.GetInstance().GetTestPanel().SettingGameUI(true);
        }
        else {
            ZepetoPlayers.instance.CreatePlayerWithUserId(sessionId, player.zepetoUserId, spawnInfo, isLocal);
        }
    }

    private OnLeavePlayer(sessionId : string, player : Player) {
        console.log(`[OnRemove] players = sessionId : ${sessionId}`);
        if(this.currentPlayers.has(sessionId)) {
            this.currentPlayers.delete(sessionId);
        }
        ZepetoPlayers.instance.RemovePlayer(sessionId);
        // delete zepeto character ref
        this.currentZepetoCharacterRef.delete(sessionId);
    }

    private OnApplicationPause(pause : boolean) {
        // pause
        if(pause == true) {
            this.isPause = true;
            if(this.room) {
                this.room.Send("OnApplicationPause");
            }
        }
        // resume
        else {
            // pause 후 resume된 경우
            if(this.isPause == true) {
                this.isPause = false;
                this.room.Send("OnApplicationResume");
            }
        }
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Coroutines

    // Player 상태를 지속적으로 서버로 전송 1, 0.04초
    private * SendMessageLoop() {
        while(true){
            yield this.waitForSendMessageLoop;
            if(this.room != null && this.room.IsConnected) {
                const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.room.SessionId);
                if(hasPlayer) {
                    const mPlayer = ZepetoPlayers.instance.GetPlayer(this.room.SessionId);
                    this.SendTransform(mPlayer.character.transform);
                    this.SendState(mPlayer.character.CurrentState);
                }
            }
        }
    }

    // 공 상태를 지속적으로 서버로 전송 , 0.04초
    private * SendBallPosLoop() {
        while(true){
            yield this.waitForSendTennisBallLoop;
            if(this.room != null && this.room.IsConnected) {
                //if(this.player != null) console.log(`SendBallPosLoop ${this.player.isHost}`);
                if(this.player != null && this.player.isHost == true){
                    this.SendTennisBallPos();
                }
                if(this.player != null && this.player.matchGameNum !=0 && this.isSettingGameHost){
                    this.SettingGameHost();
                }
                if(this.player != null && this.isGameStart == true){
                    if(TS_GameManager.GetInstance().isPlayer1 == true){
                        TS_SystemCanvas.GetInstance().GetScorePanel().ChangeMyTurnText(1, this.player.currnetPlayerNum);
                    }else{
                        TS_SystemCanvas.GetInstance().GetScorePanel().ChangeMyTurnText(2, this.player.currnetPlayerNum);
                    }
                }
            }
        }
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // To Server

    // 실제로 Player 위치 정보를 서버로 보내는 함수
    private SendTransform(transform : UnityEngine.Transform) {
        //console.log(`SendTransform ${transform.localPosition.x} ${transform.localPosition.y} ${transform.localPosition.z}`);
        const data = new RoomData();
        const pos = new RoomData();
        pos.Add("x", transform.localPosition.x);
        pos.Add("y", transform.localPosition.y);
        pos.Add("z", transform.localPosition.z);
        data.Add("position", pos.GetObject());
        const rot = new RoomData();
        rot.Add("x", transform.localEulerAngles.x);
        rot.Add("y", transform.localEulerAngles.y);
        rot.Add("z", transform.localEulerAngles.z);
        data.Add("rotation", rot.GetObject());
        this.room.Send("OnChangedTransform", data.GetObject());
    }

    // Player 상태를 실제로 서버에 전송하는 함수
    // 주로 점프 및 제스쳐
    private SendState(state : CharacterState) {
        const data = new RoomData();
        // 기본 state
        data.Add("state", state);
        // 메세지 보냄
        this.room.Send("OnChangedState", data.GetObject());
    }

    // tennis ball pos send to sever
    public SendTennisBallPos() {
        if(this.player.matchGameNum == 0) return;
        if(this.ball[this.player.matchGameNum].activeSelf == false) return;
        //console.log(`SendTennisBallPos`);
        
        const posData = new PosData();
        posData.matchNum = this.player.matchGameNum;
        posData.x = this.ball[this.player.matchGameNum].transform.position.x;
        posData.y = this.ball[this.player.matchGameNum].transform.position.y;
        posData.z = this.ball[this.player.matchGameNum].transform.position.z;
        this.room.Send("SendTennisBallPos", posData);
    }

    // tennis player hit ball power send to sever
    public SendHitTrigger(power : UnityEngine.Vector3 , isRobot : boolean) {
        if(this.isGameStart == false) return;
        //console.log(`SendHitTrigger ${this.room.SessionId}`);
        const powerData = new PowerData();
        powerData.matchNum = this.player.matchGameNum;
        powerData.sessionId = this.room.SessionId;
        powerData.x = power.x;
        powerData.y = power.y;
        powerData.z = power.z;
        if(isRobot == false) powerData.isFirstPlayer = TS_GameManager.GetInstance().isPlayer1 ? 1 : 0;
        else powerData.isFirstPlayer = 2;
        //console.log(`SendHitTrigger ${powerData.x} ${powerData.y} ${powerData.z}`);
        this.room.Send("SendHitTrigger", powerData);
    }

    public SendGetScorePlayerData(getScorePlayerNum : number) {
        const winnerData = new GetScorePlayerData();
        winnerData.matchNum = this.player.matchGameNum;
        winnerData.winnerPlayerNum = getScorePlayerNum;
        this.room.Send("SendGetScorePlayerData", winnerData);
    }

    public SendIsGameReady(isAtive : boolean) {
        if(isAtive){
            this.room.Send("SendGameReady", this.room.SessionId);
        }else{
            this.room.Send("SendNotGameReady", this.room.SessionId);
        }
    }

    public TestGameEnd() {
        this.room.Send("TestGameEnd", this.room.SessionId);
    }

    public SendSubMiss() {
        this.room.Send("SendSubMiss", this.room.SessionId);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Etc

    private * GameEnd(winnerSessionId : string){
        this.isGameStart = false;
        TS_GameManager.GetInstance().GameEnd();
        TS_SystemCanvas.GetInstance().GetTimePanel().OnTimePanel(false);
        TS_SystemCanvas.GetInstance().GetTestPanel().SettingGameUI(true);

        this.currentMatchGameNum = 0;
        if(this.ballCoroutine != null) { this.StopCoroutine(this.ballCoroutine); }

        this.player1SessionId = null;
        this.player2SessionId = null;

        // test
        //TS_SystemCanvas.GetInstance().GetTestPanel().OnDualMode();
        //TS_SystemCanvas.GetInstance().GetTestPanel().SettingModeUI(false);
        //TS_SystemCanvas.GetInstance().GetTestPanel().gameStart1Btn.gameObject.SetActive(false);
        
        TS_PlayerControllerManager.GetInstance().SetWinnerInfo(winnerSessionId);
        TS_SystemCanvas.GetInstance().GetGameFinishPanel().OnWinnerPanel(true);

        yield this.waitForMoment;

        TS_SystemCanvas.GetInstance().GetGameFinishPanel().OnWinnerPanel(false);

        // only match game ball Enable 
        for(let num = 0; num < this.ball.length; num++){
            this.ball[num].SetActive(false);
        }
    }

    private ParseVector3(vector3 : Vector3) : UnityEngine.Vector3 {
        return new UnityEngine.Vector3(
            vector3.x,
            vector3.y,
            vector3.z
        );
    }

    // game setting first
    private SettingGameHost(){
        console.log(`SettingGameHost ${this.player.matchGameNum} ${this.player.isHost}`);

        this.currentMatchGameNum = this.player.matchGameNum;

        // only match game ball Enable 
        for(let num = 0; num < this.ball.length; num++){
            if((this.player.matchGameNum) == num){
                this.ball[num].SetActive(true);
            }else{
                this.ball[num].SetActive(false);
            }
        }

        this.ballTS[this.player.matchGameNum].startGame();

        if(this.player.isHost) {
            TS_SystemCanvas.GetInstance().GetTestPanel().hostText.SetActive(true);
        }else{
            TS_SystemCanvas.GetInstance().GetTestPanel().hostText.SetActive(false);
            this.ballRigid[this.player.matchGameNum].useGravity = false;
            this.ballRigid[this.player.matchGameNum].isKinematic = true;
        }

        TS_SystemCanvas.GetInstance().GetScorePanel().OnScorePanel(true);
        TS_SystemCanvas.GetInstance().GetScorePanel().ChangeMatchText(this.player.matchGameNum);
        TS_GameManager.GetInstance().CountDown();

        this.isGameStart = true;
        
        this.isSettingGameHost = false;
    }

    public GetBall() : UnityEngine.GameObject {
        return this.ball[this.player.matchGameNum];
    }

    public GetBallTS() : TS_BallEvent {
        return this.ballTS[this.player.matchGameNum];
    }

    public GetPlayer1ZepetoCharacter() : ZepetoCharacter {
        if(this.player1SessionId == null) return;
        return this.currentZepetoCharacterRef.get(this.player1SessionId);
    }

    public GetPlayer2ZepetoCharacter() : ZepetoCharacter {
        if(this.player1SessionId == null) return;
        return this.currentZepetoCharacterRef.get(this.player2SessionId);
    }

    public OnMode(isSolo : boolean , isDual : boolean, isRobot : boolean){
        this.isSoloPlay = isSolo;
        this.isDualPlay = isDual;
        this.isRobotPlay = isRobot;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}