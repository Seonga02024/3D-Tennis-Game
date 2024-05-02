import { Coroutine, GameObject, Mathf, PrimitiveType, Quaternion, Transform, WaitForSeconds } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import TS_PlayerController from './Player/TS_PlayerController';
import TS_ClientStarter from '../TS_ClientStarter';
import TS_SystemCanvas from '../Canvas/TS_SystemCanvas';
import { Vector3 } from 'UnityEngine';
import { Camera } from 'UnityEngine';
import { ZepetoCamera, ZepetoPlayers } from 'ZEPETO.Character.Controller';

const MAX_WAIT_COUNT : number = 10;

export default class TS_GameManager extends ZepetoScriptBehaviour {

    @Header("Default GameObject")
    @SerializeField()
    public net : GameObject;
    @SerializeField()
    public startPos1 : Transform; // Ball 1st start position
    @SerializeField()
    public startPos2 : Transform; // Ball 2nd start position
    @SerializeField()
    private dropPosObj : GameObject; // 공이 떨어지는 위치에 표시해주는 범위 오브젝트
    @SerializeField()
    private dropPosLineObj : GameObject; // 공이 떨어지는 위치에 표시해주는 line 오브젝트
    @SerializeField()
    private currentDropPosObj : GameObject; // 실시간 공과 땅 지점
    @SerializeField() 
    private player1StartPos : Transform; // player 1 start pos
    @SerializeField() 
    private player2StartPos : Transform; // player 2 start pos
    @SerializeField() 
    private rectangleVertices : GameObject[]; // Used to calculate the ball position

    /* Local Player Data */
    private localPlayer : GameObject;
    private localPlayerController : TS_PlayerController = null;
    public get GetLocalPlayerController() { return this.localPlayerController; }

    /* Values */
    public isGameStart : Boolean = false;
    public isRoundStart : Boolean = false;
    public isSub :  Boolean = false;
    public isSub2 :  Boolean = false; // Whether it's the 2nd serve or not
    public isSubSuccess : Boolean = false; // is Sub Success
    private camera : Camera;
    private isTimeOver : boolean = false; // 대기 시간 끝났는지
    @NonSerialized() public isWaitChange : boolean = false; // got a score and waiting for the turn to change
    @NonSerialized() public isPlayer1 : boolean = false; // is player1 (me)

    /* Coroutine */
    private countDownCoroutine : Coroutine = null;
    private checkErrorCoroutine : Coroutine = null;
    private waitSettingCoroutine : Coroutine = null;
    private waitForCount : WaitForSeconds = new WaitForSeconds(1);
    private waitForRobotShoot : WaitForSeconds = new WaitForSeconds(4);
    private waitForMoment : WaitForSeconds = new WaitForSeconds(1.5);

    @Header("Sub")
    // 0~1 사각형 1개 / 2~3 사각형 1개
    @SerializeField() private player1SubPos : Transform[]; // 오른쪽 왼쪽 순서
    @SerializeField() private player1SubGroundPos : Transform[]; // 오른쪽 왼쪽 순서
    @SerializeField() private player2SubPos : Transform[]; // 오른쪽 왼쪽 순서
    @SerializeField() private player2SubGroundPos : Transform[]; // 오른쪽 왼쪽 순서
    @SerializeField() private player1SubObj : GameObject; // 서브 위치 표시 오브젝트
    @SerializeField() private player2SubObj : GameObject; // 서브 위치 표시 오브젝트

    /* Singleton */
    private static Instance: TS_GameManager;
    public static GetInstance(): TS_GameManager {
        if (!TS_GameManager.Instance) {
            const targetObj = GameObject.Find("GameManager");
            if (targetObj)
            TS_GameManager.Instance = targetObj.GetComponent<TS_GameManager>();
        }
        return TS_GameManager.Instance;
    }

    ///////////////////////////////////////////////////////////////////////////////

    // 3D 코트 상에서 공간 좌표를 계산
    public CaluatePos(xRatio : number , yRatio : number) : Vector3
    {
        let interpolatedPosition : Vector3 = Vector3.zero;
        interpolatedPosition = this.rectangleVertices[2].transform.position;
        let ratioX = (this.rectangleVertices[1].transform.position.x - this.rectangleVertices[0].transform.position.x);
        let ratioZ = ((this.rectangleVertices[1].transform.position.z - this.rectangleVertices[2].transform.position.z)/2);
        if(TS_GameManager.GetInstance().isPlayer1 == false){
            ratioX *= (1-xRatio);
            ratioZ *= (1-yRatio);
        }else{
            interpolatedPosition.z += ratioZ;
            ratioX *= xRatio;
            ratioZ *= yRatio;
        }
        interpolatedPosition.x -= ratioX;
        interpolatedPosition.z += ratioZ;
        return interpolatedPosition;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Sub count down 

    // all
    public CountDown(){
        //console.log(`CountDown`);
        if(this.countDownCoroutine != null) { this.StopCoroutine(this.countDownCoroutine); }
        this.countDownCoroutine = this.StartCoroutine(this.CountDownCoroutine());
    }

    // all
    public StopCountDown(){
        if(this.isTimeOver) return;
        if(this.countDownCoroutine != null) { this.StopCoroutine(this.countDownCoroutine); }
    }

    // all
    private * CountDownCoroutine(){
        this.isTimeOver = false;
        let num = 0;
        while(num <= MAX_WAIT_COUNT){
            //console.log(`CountDownCoroutine ${num}`);
            TS_SystemCanvas.GetInstance().GetTimePanel().ChangeTimeText(10-num);
            num += 1;
            if(num == 10){
                this.isTimeOver = true; // set don hit
            }
            yield this.waitForCount;
        }

        this.isRoundStart = true;
        // if player is host
        if(TS_ClientStarter.GetInstance().player.isHost){
            TS_ClientStarter.GetInstance().GetBallTS().CheckTimeOver();
        }
    }

    // host
    private * CheckErrorCoroutine(){
        console.log(`CheckErrorCoroutine`);
        let num = 0;
        while(num <= MAX_WAIT_COUNT){
            num += 1;
            if(num == 10){
                break;
            }
            yield this.waitForCount;
        }
        //error true -> reset round
        TS_ClientStarter.GetInstance().GetBallTS().CheckTimeOver();
    }

    ///////////////////////////////////////////////////////////////////////////////
    ////////////// round start

    // all
    // Check if you are currently able to hit the ball 
    // Where to check before sending data 
    public CheckCanHitBall(pos : Vector3, isRobot : boolean){
        //console.log(`CheckCanHitBall ${this.isRoundStart} ${this.isTimeOver}`);
        //if(this.isRoundStart == false) return;
        if(this.isWaitChange == true) return; // is not round over
        if(this.isTimeOver == true) return; // is wait count down over

        TS_ClientStarter.GetInstance().SendHitTrigger(pos, isRobot);
    }

    // all 
    // Where to check the data received from the server for the first time
    public CheckRoundAndHit(pos : Vector3, isFirstPlayer : number){
        //console.log(`CheckRoundAndHit ${isFirstPlayer}`);

        this.dropPosObj.SetActive(true);
        this.dropPosLineObj.SetActive(true);
        this.currentDropPosObj.SetActive(true);
        this.SettingSubObj(false, false);

        // check round first sub or 2 sub 
        if(this.isRoundStart == false || this.isSub2){ 
            this.isRoundStart = true;
            this.isSub = true;
            this.StopCountDown();
        }else{ // no sub and playing game
            this.isSub = false; // sub not
        }

        // Checking sub was successful
        if(TS_GameManager.GetInstance().isSub){
            if(isFirstPlayer == 1){
                if(TS_ClientStarter.GetInstance().GetPlayer1ZepetoCharacter() != null){
                    let pos1 = TS_ClientStarter.GetInstance().GetPlayer1ZepetoCharacter().gameObject.transform.position;
                    this.isSubSuccess = this.CheckTrueSuv(isFirstPlayer, pos1, pos);
                    //console.log(`CheckRoundAndHit Player1 ${this.isSubSuccess}`);
                }
            }else{
                if(TS_ClientStarter.GetInstance().GetPlayer2ZepetoCharacter() != null){
                    let pos1 = TS_ClientStarter.GetInstance().GetPlayer2ZepetoCharacter().gameObject.transform.position;
                    this.isSubSuccess = this.CheckTrueSuv(isFirstPlayer, pos1, pos);
                    //console.log(`CheckRoundAndHit Player2 ${this.isSubSuccess}`);
                }
            }
        }
        
        // host
        if(TS_ClientStarter.GetInstance().player.isHost){
            console.log(`CheckRoundAndHit`);
            TS_ClientStarter.GetInstance().GetBallTS().playerHitBall(pos, isFirstPlayer);

            // error checking
            if(this.checkErrorCoroutine != null) { this.StopCoroutine(this.checkErrorCoroutine); }
            this.checkErrorCoroutine = this.StartCoroutine(this.CheckErrorCoroutine());
        }
    }

    private CheckTrueSuv(isFirstPlayer : number, pos1 : Vector3, pos2 : Vector3) : boolean{
        if(isFirstPlayer == 1){ 
            if(this.IsInRange(pos1, this.player1SubPos[0].position, this.player1SubPos[1].position) && this.IsInRange(pos2, this.player1SubGroundPos[2].position, this.player1SubGroundPos[3].position)){
                return true;
            }
            else if(this.IsInRange(pos1, this.player1SubPos[2].position, this.player1SubPos[3].position) && this.IsInRange(pos2, this.player1SubGroundPos[0].position, this.player1SubGroundPos[1].position)){
                return true;
            }
            else{
                return false;
            }
        }else{
            // 2번째 플레이어 위치인지
            if(this.IsInRange(pos1, this.player2SubPos[0].position, this.player2SubPos[1].position) && this.IsInRange(pos2, this.player2SubGroundPos[2].position, this.player2SubGroundPos[3].position)){
                return true;
            }
            else if(this.IsInRange(pos1, this.player2SubPos[2].position, this.player2SubPos[3].position) && this.IsInRange(pos2, this.player2SubGroundPos[0].position, this.player2SubGroundPos[1].position)){
                return true;
            }
            else{
                return false;
            }
        }
    }

    private IsInRange(pos : Vector3, range1 : Vector3, range2 : Vector3) : boolean {
        if ((pos.x >= Mathf.Min(range1.x, range2.x)) && (pos.x <= Mathf.Max(range1.x, range2.x)))
        {
            // 특정 점이 두 좌표의 z값 범위 내에 있는지 확인
            if ((pos.z >= Mathf.Min(range1.z, range2.z)) && (pos.z <= Mathf.Max(range1.z, range2.z)))
            {
                // 특정 점이 두 좌표 사이에 있는 경우
                return true;
            }
        }
        return false;
    }

    // all 
    // call -> is sub true and collider net (ball_ts)
    public ChangeSuv2(){
        this.isSub2 = true;
        this.isRoundStart = false;
        this.isWaitChange = false;
        this.CountDown();
    }

    // 떨어지는 공 바닥 위치 오브젝트 배치
    public ChangeDropBallObj(endPos : Vector3, startPos : Vector3){
        this.dropPosObj.transform.position = endPos;

        let midPoint : Vector3 = (startPos + endPos) / 2;
        midPoint.y = 0;
        this.dropPosLineObj.transform.position = midPoint;
        let distance = Vector3.Distance(startPos, endPos);
        this.dropPosLineObj.transform.localScale = new Vector3(0.1, 0.05 ,distance);
        let dir : Vector3 = startPos - endPos;
        dir.y = 0;
        this.dropPosLineObj.transform.rotation = Quaternion.LookRotation(dir);
    }

    public ChangeCurrentDropBallObj(pos : Vector3){
        this.currentDropPosObj.transform.position = new Vector3(pos.x, this.currentDropPosObj.transform.position.y ,pos.z);
    }

    ////////////////////////////////////////////////////////////////////////////
    ////////////// round finish

    // all 
    // TS_Clienter 에서 점수 획득 시 실행
    // Where to check the score data received from the server for the first time
    public FinishRound(){
        //console.log(`FinishRound`);
        // reset
        this.isWaitChange = true;
        this.isRoundStart = false;
        this.isSub = false;
        this.isSub2 = false;
        this.isSubSuccess = false;

        this.dropPosObj.SetActive(false);
        this.dropPosLineObj.SetActive(false);
        
        if(this.checkErrorCoroutine != null) { this.StopCoroutine(this.checkErrorCoroutine); }
        if(this.waitSettingCoroutine != null) { this.StopCoroutine(this.waitSettingCoroutine); }
        this.waitSettingCoroutine = this.StartCoroutine(this.WaitCoroutine());
    }

    // all - 3초 다시 카운트 다운 & 칠 수 있게
    private * WaitCoroutine(){
        yield this.waitForMoment;
        TS_ClientStarter.GetInstance().GetBallTS().ResetRound();
        yield this.waitForMoment;
        this.isWaitChange = false;
        TS_ClientStarter.GetInstance().GetBallTS().FinishResetting();
        this.CountDown();
    }

    //////////////////////////////////////////////////////////

    // sub Location floor display function
    public SettingSubObj(isActive : boolean, isFirstPlayer : boolean){
        if(isActive){
            if(isFirstPlayer){
                this.player2SubObj.SetActive(false);
                this.player1SubObj.SetActive(true);
            }else{
                this.player1SubObj.SetActive(false);
                this.player2SubObj.SetActive(true);
            }
        }else{
            this.player1SubObj.SetActive(false);
            this.player2SubObj.SetActive(false);
        }
    }

    // If player move and stop, look at the tennis
    public playerMoveStopAndDirNet(){
        this.localPlayer.transform.LookAt(this.net.transform.position);
    }

    public LocalPlayerController(controller : TS_PlayerController){
        this.localPlayerController = controller;
    }

    //////////////////////////////////////////////////////////

    public GameStart(){
        // reset and setting
        this.isRoundStart = false;
        this.isGameStart = true;
        this.isSub = false;
        this.isSub2 = false;
        this.isSubSuccess = false;
        this.isTimeOver = false;
        this.isWaitChange = false;
        this.isTimeOver = false;

        if(this.camera == null) this.camera =  ZepetoPlayers.instance.LocalPlayer.zepetoCamera.camera;
        if(this.isPlayer1){
            ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.Teleport(this.player1StartPos.position, this.localPlayer.transform.rotation);
        }else{
            ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.Teleport(this.player2StartPos.position, this.localPlayer.transform.rotation);
        }

        this.SettingSubObj(true, true);
    }

    public GameEnd(){
        this.isGameStart = false;

        // reset
        this.dropPosObj.SetActive(false);
        this.dropPosLineObj.SetActive(false);
        this.currentDropPosObj.SetActive(false);
        this.SettingSubObj(false, true);
        TS_SystemCanvas.GetInstance().GetScorePanel().OnScorePanel(false);
        TS_SystemCanvas.GetInstance().GetTimePanel().ChangeTimeText(10);
        TS_ClientStarter.GetInstance().GetBallTS().ResetBallTS();

        if(this.camera != null) this.camera.gameObject.transform.parent.transform.parent.GetComponent<ZepetoCamera>().enabled = true;
        if(this.checkErrorCoroutine != null) { this.StopCoroutine(this.checkErrorCoroutine); }
        if(this.waitSettingCoroutine != null) { this.StopCoroutine(this.waitSettingCoroutine); }
        if(this.countDownCoroutine != null) { this.StopCoroutine(this.countDownCoroutine); }
    }

    ///////////////////////////////////////////////////////////////////////////////

    private Start() {  
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.localPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;
        }); 
    }

    private Update(){
        // Change the camera when you start the game
        if(this.localPlayer != null && this.isGameStart){
            let pos = this.localPlayer.transform.position;
            if(this.isPlayer1){
                this.camera.gameObject.transform.parent.transform.parent.GetComponent<ZepetoCamera>().enabled = false;
                this.camera.gameObject.transform.parent.transform.position = new Vector3(pos.x, pos.y + 3.5, pos.z + 2.8);
                this.camera.gameObject.transform.parent.transform.rotation = Quaternion.Euler(30, -180, 0);
            }else{
                this.camera.gameObject.transform.parent.transform.parent.GetComponent<ZepetoCamera>().enabled = false;
                this.camera.gameObject.transform.parent.transform.position = new Vector3(pos.x, pos.y + 3.5, pos.z - 2.8);
                this.camera.gameObject.transform.parent.transform.rotation = Quaternion.Euler(30, 0, 0);
            }
        }
    }
}