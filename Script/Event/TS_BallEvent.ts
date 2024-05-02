import { Collision, Coroutine, ForceMode, Physics, Quaternion, Ray, RaycastHit, Time, TrailRenderer, Vector2, Vector3, WaitForSeconds } from 'UnityEngine';
import { Collider, Rigidbody, Transform } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import TS_ClientStarter from '../TS_ClientStarter';
import { Random } from 'UnityEngine';
import { Mathf } from 'UnityEngine';
import TS_GameManager from '../System/TS_GameManager';

export default class TS_BallEvent extends ZepetoScriptBehaviour {

    @Header("Default")
    @SerializeField()
    private rigid : Rigidbody;
    @SerializeField()
    private trailRender : TrailRenderer;

    /* Obj */
    private startPos1 : Transform;
    private startPos2 : Transform;
    private raycastDistance : number = 100;

    /* Values */
    private isRoundStart : boolean = false; // 라운드가 시작했는지
    private targetPos : Vector3 = new Vector3(0,0,0); // used not host
    private isSendData : boolean = false; // check count score
    private isResetting : boolean = false; // is resetting
    private isSubMiss = false; // is sub miss

    /* Test */
    private testRobotBall : Vector3[] = [ new Vector3(0, 0, 7 ),
                                        new Vector3(4, 0, 7 ),
                                        new Vector3(-4 , 0, 7 )];
    @NonSerialized() public isTestRobotHard : boolean = false;

    /* Coroutines */
    private subCheckCoroutine : Coroutine = null;
    private hitCoroutine : Coroutine = null;
    private resetCoroutine : Coroutine = null;
    private robotCoroutine : Coroutine = null;

    /* Timers */
    private waitForSubCheck : WaitForSeconds = new WaitForSeconds(1);
    private waitForMoment : WaitForSeconds = new WaitForSeconds(1);
    private waitForRobotShoot : WaitForSeconds = new WaitForSeconds(4);
    
    /* Rule */
    private colliderGroundTime : number = 0; // 공이 바닥에 닿인 시간
    private groundHitStack : number = 0; // 코트에 공 닿은 수
    @NonSerialized() public currentTurn : number = 2; // 현재 공 친 선수의 번호
    @NonSerialized() public startTurn : number = 1; // 해당 라운드에서 시작한 선수의 번호

    /* Stat */
    @NonSerialized() public speed : number = 0.3; // 속도 - 직접 지정 가능
    private angle : number = 45; // 각도 - 실행 중 자동 계산
    private pos : Vector3; // 발사 타켓 지점

    ///////////////////////////////////////////////////////////////////////////////////
    //////////// start

    // all
    public startGame(){
        this.currentTurn = 2;
        this.startTurn = 1;
        this.trailRender.enabled = false;
        if(TS_ClientStarter.GetInstance().player != null && TS_ClientStarter.GetInstance().player.isHost){
            this.ChangeBallPosHost();
        }
    }

    //////////////////////////////////////////////////////////////////////
    /// finish

    // ResetBallTS
    public ResetBallTS(){
        console.log(`ResetBallTS`);
        this.currentTurn = 2;
        this.startTurn = 1;
        this.isRoundStart = false;
        this.targetPos = new Vector3(0,0,0);
        this.isSendData = false;
        this.isResetting = false;
        this.isSubMiss = false;
        this.colliderGroundTime = 0;
        this.groundHitStack = 0;
        if(this.hitCoroutine != null) { this.StopCoroutine(this.hitCoroutine); } 
        if(this.resetCoroutine != null) { this.StopCoroutine(this.resetCoroutine); }
    }

    //////////////////////////////////////////////////////////////////////

    // not host
    public ChangeBallPosNoHost(pos : Vector3){
        let distance  = Vector3.Distance(pos, this.gameObject.transform.position);
        if(distance == 0) return;
        //console.log(`ChangeBallPosNoHost ${Vector3.Distance(pos, this.gameObject.transform.position)}`);
        this.targetPos = pos;
    }

    // host
    // call TS_GameManager
    public playerHitBall(pos : Vector3, isFirstPlayer : number){
        // stop
        if(this.subCheckCoroutine != null) { this.StopCoroutine(this.subCheckCoroutine); }
        
        //console.log(`playerHitBall`);
        if(this.gameObject.activeSelf == false) return;

        // change turn
        if(this.currentTurn == 1) this.currentTurn = 2;
        else this.currentTurn = 1;

        // setting shoot pos
        this.pos = new Vector3(pos.x, pos.y + 0.5, pos.z);

        // reset
        this.groundHitStack = 0; 
        this.colliderGroundTime = 0;
        this.isSubMiss = false; 

        // shoot
        if(this.hitCoroutine != null) { this.StopCoroutine(this.hitCoroutine); }
        this.hitCoroutine = this.StartCoroutine(this.ParabolaShoot(isFirstPlayer));
    }

    ///////////////////////////////////////////////////////////////////////////////////
    //// start

    private Update()
    {
        if(TS_ClientStarter.GetInstance().isGameStart){
            // is not host -> update ball pos
            if(TS_ClientStarter.GetInstance().player.isHost == false){
                if(this.isResetting){
                    this.gameObject.transform.position = this.targetPos;
                }else{
                    this.gameObject.transform.position = Vector3.Lerp(this.gameObject.transform.position, this.targetPos, Time.deltaTime * 10);
                }
            }

            // if round start, on trailRender and drop ball obj
            if(TS_GameManager.GetInstance().isRoundStart){
                // 라운드 시작하면 (즉, 공이 날라가면) 트레일 켜주기
                if(this.trailRender.enabled == false) this.trailRender.enabled = true;
                let hit = $ref<RaycastHit>();
                let ray : Ray = new Ray(this.gameObject.transform.position, Vector3.down);
                if(Physics.Raycast(ray, hit, this.raycastDistance)){
                    let hitInfo = $unref(hit);
                    let collPos : Vector3 = hitInfo.point;
                    TS_GameManager.GetInstance().ChangeCurrentDropBallObj(collPos);
                }
            }

            // if host and subing, change ball pos -> current sub player front
            if(TS_ClientStarter.GetInstance().player.isHost){
                //console.log(`ball Update ${TS_GameManager.GetInstance().isRoundStart} ${TS_GameManager.GetInstance().isWaitChange}`);
                if(TS_GameManager.GetInstance().isRoundStart == false && TS_GameManager.GetInstance().isWaitChange == false){
                    if(this.startTurn == 1){
                        let playerPos : Vector3 = TS_ClientStarter.GetInstance().GetPlayer1ZepetoCharacter().gameObject.transform.position;
                        this.gameObject.transform.position = new Vector3(playerPos.x, playerPos.y + 1, playerPos.z - 1);
                    }else{
                        let playerPos : Vector3 = TS_ClientStarter.GetInstance().GetPlayer2ZepetoCharacter().gameObject.transform.position;
                        this.gameObject.transform.position = new Vector3(playerPos.x, playerPos.y + 1, playerPos.z + 1);
                    }
                }
            }
        }
    }

    private * robotShoot(randomPower : number){
        yield this.waitForRobotShoot;
        if(this.isTestRobotHard){
            TS_ClientStarter.GetInstance().SendHitTrigger(this.testRobotBall[randomPower-1], true);
        }else{
            TS_ClientStarter.GetInstance().SendHitTrigger(this.testRobotBall[0], true);
        }
    }

    private *ParabolaShoot(isFirstPlayer : number)
    {
        //console.log(`playerHitBall ParabolaShoot`);

        this.transform.LookAt(this.pos);
        let direction : Vector3 = this.transform.forward;

        this.rigid.useGravity = false;
        this.rigid.isKinematic = true;

        this.angle = Random.Range(20, 30);
        let target_dis = Vector3.Distance(this.gameObject.transform.position, this.pos);
        let velocity = target_dis / (Mathf.Sin(2 * this.angle * Mathf.Deg2Rad) / 9.8)* this.speed;

        let Vx = Mathf.Sqrt(velocity) * Mathf.Cos(this.angle* Mathf.Deg2Rad);
        let Vy = Mathf.Sqrt(velocity) * Mathf.Sin(this.angle* Mathf.Deg2Rad);

        let flightDuration = (target_dis / Vx) * this.speed;
        let dir = new Vector3(this.pos.x - this.gameObject.transform.position.x,
                this.pos.y - this.gameObject.transform.position.y,
                this.pos.z - this.gameObject.transform.position.z);
        this.gameObject.transform.rotation = Quaternion.LookRotation(dir);
        let time = 0;

        while(time < flightDuration)
        {
            this.gameObject.transform.Translate(0, (Vy - (9.8 * time)) * Time.deltaTime, Vx * Time.deltaTime);
            time += (Time.deltaTime * this.speed);
            yield null;
        }

        this.rigid.useGravity = true;
        this.rigid.isKinematic = false;

        if(isFirstPlayer == 2){
            this.rigid.AddForce(new Vector3(direction.x,-1,direction.z) * 6, ForceMode.Impulse);
        }
        else if(isFirstPlayer == 1){ 
            this.rigid.AddForce(new Vector3(direction.x,-1,direction.z) * 6, ForceMode.Impulse);
        }else{
            this.rigid.AddForce(new Vector3(direction.x,-1,direction.z) * 6, ForceMode.Impulse);
        }

        //console.log(`playerHitBall ParabolaShoot end`);
    }

    private CheckSubFalse()
    {
        if(this.subCheckCoroutine != null) { this.StopCoroutine(this.subCheckCoroutine); }
        this.subCheckCoroutine = this.StartCoroutine(this.CheckSubFalseAndOut());
    }

    private *CheckSubFalseAndOut(){
        yield this.waitForSubCheck;
        // 공이 날아갈 동안 아무 방해도 없었다면, 서브인지 확인해서 제대로 쳤는지 확인
        if(TS_GameManager.GetInstance().isSub && this.isSubMiss == false){
            // sub false
            if(TS_GameManager.GetInstance().isSubSuccess == false){
                console.log(`sub false ${this.startTurn}`);
                this.currentTurn = this.startTurn;
                this.roundOverResetAndmyPlayerGetScore(false);
            }
        }
    }

    ///////////////////////////////////////////////////////////////

    // count down over -> get score no current turn player
    public CheckTimeOver(){
        if(TS_ClientStarter.GetInstance().player.isHost == false) return;
        console.log(`time over lose ${this.startTurn}`);
        this.currentTurn = this.startTurn;
        this.roundOverResetAndmyPlayerGetScore(false);
    }

    // host
    // check error true -> round reset
    public CheckError(){
        // no count round and score
        console.log(`CheckError`);
        TS_ClientStarter.GetInstance().SendGetScorePlayerData(3);
    }

    ///////////////////////////////////////////////////////////////
    /// finish and reset

    public ResetRound(){
        this.colliderGroundTime = 0;
        this.isSendData = false;

        // change start turn
        if(this.startTurn == 1) {
            //console.log(`ResetBall this.startTurn 1`);
            this.startTurn = 2;
            this.currentTurn = 1;
        }else{
            //console.log(`ResetBall this.startTurn 2`);
            this.startTurn = 1;
            this.currentTurn = 2;
        }

        if(this.gameObject.activeSelf == false) return;
        if(this.resetCoroutine != null) { this.StopCoroutine(this.resetCoroutine); }
        this.resetCoroutine = this.StartCoroutine(this.ResetBallCoroutine());
    }

    // all
    public FinishResetting(){
        this.isResetting = false;
        if(this.startTurn == 1) {
            TS_GameManager.GetInstance().SettingSubObj(true, true);
        }else{
            TS_GameManager.GetInstance().SettingSubObj(true, false);
        }
    }

    // all -1초 뒤 공 위치 바뀜
    private * ResetBallCoroutine(){
        yield this.waitForMoment;
        this.isResetting = true;
        this.trailRender.enabled = false;
        if(TS_ClientStarter.GetInstance().player.isHost == false) return;
        if(this.hitCoroutine != null) { this.StopCoroutine(this.hitCoroutine); }
        this.ChangeBallPosHost();
    }

    // host
    private ChangeBallPosHost(){
        //console.log(`ChangeBallPosHost ${this.startTurn}`);
        //this.gameObject.SetActive(false);

        this.ResetForce();
        this.startPos1 = TS_GameManager.GetInstance().startPos1;
        this.startPos2 = TS_GameManager.GetInstance().startPos2;

        if(this.startTurn == 1){
            this.gameObject.transform.position = this.startPos1.position;
        }else{
            this.gameObject.transform.position = this.startPos2.position;
        }

        this.ResetForce();
    }

    private ResetForce(){
        this.rigid.useGravity = false;
        this.rigid.isKinematic = true;
        this.rigid.velocity = Vector3.zero;
        this.rigid.angularVelocity = Vector3.zero;
    }

    ///////////////////////////////////////////////////////////////////////////////////

    // host
    private roundOverResetAndmyPlayerGetScore(isGetScoreMyPlayer : boolean){
        if(TS_GameManager.GetInstance().isRoundStart == false) return;
        if(TS_ClientStarter.GetInstance().player.isHost == false) return;
        if(this.isSendData) return;
        if(this.isSubMiss) return;
        
        console.log(`roundOverResetAndmyPlayerGetScore ${isGetScoreMyPlayer} ${this.currentTurn}`);

        if(isGetScoreMyPlayer){
            TS_ClientStarter.GetInstance().SendGetScorePlayerData(this.currentTurn);
        }else{
            TS_ClientStarter.GetInstance().SendGetScorePlayerData(this.changeTurn(this.currentTurn));
        }

        this.isSendData = true;
    }

    // host
    private changeTurn(num : number) : number{
        if(num == 1) return 2;
        if(num == 2) return 1;
    }

    // call collider net
    public SubMiss(){
        //console.log(`SubMiss`);
        TS_GameManager.GetInstance().ChangeSuv2(); // 두 번째 서브 상태로 바꿔주기
        if(this.hitCoroutine != null) { this.StopCoroutine(this.hitCoroutine); } // 날아가는 코루틴 멈추기
        this.ResetForce(); // 공 힘 값 없애기
        // 현재 턴에 맞게 다시 서브 오브젝트 표시해주기
        if(this.startTurn == 1) {
            TS_GameManager.GetInstance().SettingSubObj(true, true);
        }else{
            TS_GameManager.GetInstance().SettingSubObj(true, false);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////
    /////////// 

    private OnTriggerEnter(coll : Collider){

        if(TS_GameManager.GetInstance().isRoundStart == false) return;

        if(coll.CompareTag("Wall")){
            if(this.groundHitStack == 1){
                console.log(`OnTriggerEnter Wall lose your score`);
                // 상대방 실점
                this.roundOverResetAndmyPlayerGetScore(true);
            }else{
                console.log(`OnTriggerEnter Wall lose my score`);
                // 자신의 실점
                this.roundOverResetAndmyPlayerGetScore(false);
            }
        }

        if(coll.CompareTag("TennisGround1") || coll.CompareTag("TennisGround2")){
            this.CheckSubFalse();
            if(coll.CompareTag("TennisGround1")){
                if(this.currentTurn == 1){
                    console.log(`OnTriggerEnter TennisGround1 lose my score`);
                    // 쳤는데 자기 땅에 닿아서 아웃
                    // 자신의 실점
                    this.roundOverResetAndmyPlayerGetScore(false);
                }else{
                    // 상대방 코트에 닿음
                    this.groundHitStack += 1;
                    //console.log(`OnTriggerEnter this.groundHitStack += 1`);
                    if(this.groundHitStack >= 2){
                        console.log(`OnTriggerEnter TennisGround1 lose your score`);
                        // 상대방 실점
                        this.roundOverResetAndmyPlayerGetScore(true);
                    }
                }
            }

            if(coll.CompareTag("TennisGround2")){
                if(this.currentTurn == 2){
                    // 쳤는데 자기 땅에 닿아서 아웃
                    // 자신의 실점
                    this.roundOverResetAndmyPlayerGetScore(false);
                    console.log(`OnTriggerEnter TennisGround2 lose my score`);
                }else{
                    // 상대방 코트에 닿음
                    this.groundHitStack += 1;
                    //console.log(`OnTriggerEnter this.groundHitStack += 1`);
                    if(this.groundHitStack >= 2){
                        // 상대방 실점
                        this.roundOverResetAndmyPlayerGetScore(true);
                        console.log(`OnTriggerEnter Ground lose your score`);
                    }
                }
            }
        }

        if(coll.CompareTag("Ground")){
            if(this.groundHitStack == 1){
                // 상대방 실점
                this.roundOverResetAndmyPlayerGetScore(true);
                console.log(`OnTriggerEnter Ground lose your score`);
            }else{
                // 자신의 실점
                this.roundOverResetAndmyPlayerGetScore(false);
                console.log(`OnTriggerEnter Ground lose my score`);
            }
        }
 
    }

    private OnCollisionEnter(coll : Collision){

        if(TS_GameManager.GetInstance().isRoundStart == false) return;
        
        if(coll.gameObject.CompareTag("Net")){
            if(TS_GameManager.GetInstance().isSub == true && TS_GameManager.GetInstance().isSub2 == false){
                // 네트 맞아서 서브 미스일 경우 (1회차)
                console.log(`============================== Sub net`);
                TS_ClientStarter.GetInstance().SendSubMiss();
                // 호스트만 타이밍 때문에 빨리 처리해주기
                if(TS_ClientStarter.GetInstance().player.isHost){
                    this.isSubMiss = true;
                }
            }else{
                // 자신의 실점
                this.roundOverResetAndmyPlayerGetScore(false);
                console.log(`OnCollisionEnter Net lose my score`);
            }
        }
    }

    private OnTriggerStay(coll : Collider){

        if(TS_GameManager.GetInstance().isRoundStart == false) return;

        if(coll.CompareTag("Ground")){
            this.colliderGroundTime += Time.deltaTime;
            if(this.colliderGroundTime > 1){
                if(this.groundHitStack == 1){
                    // 상대방 실점
                    this.roundOverResetAndmyPlayerGetScore(true);
                    console.log(`OnTriggerStay Ground lose your score`);
                }else{
                    // 자신의 실점
                    this.roundOverResetAndmyPlayerGetScore(false);
                    console.log(`OnTriggerStay Ground lose my score`);
                }
            }
        }

        if(coll.CompareTag("TennisGround1")){
            this.colliderGroundTime += Time.deltaTime;
            if(this.colliderGroundTime > 1){
                if(this.currentTurn == 1){
                    // 자신의 실점
                    console.log(`OnTriggerStay TennisGround1 lose my score`);
                    this.roundOverResetAndmyPlayerGetScore(false);
                }else{
                    // 상대방 실점
                    this.roundOverResetAndmyPlayerGetScore(true);
                    console.log(`OnTriggerStay TennisGround1 lose your score`);
                }
            }
        }

        if(coll.CompareTag("TennisGround2")){
            this.colliderGroundTime += Time.deltaTime;
            if(this.colliderGroundTime > 1){
                if(this.currentTurn == 2){
                    // 자신의 실점
                    this.roundOverResetAndmyPlayerGetScore(false);
                    console.log(`OnTriggerStay TennisGround2 lose my score`);
                }else{
                    // 상대방 실점
                    this.roundOverResetAndmyPlayerGetScore(true);
                    console.log(`OnTriggerStay Ground lose your score`);
                }
            }
        }
    }
}