import { Animator, GameObject, Vector3 } from 'UnityEngine';
import { ZepetoCharacter } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import TS_ClientStarter from '../../TS_ClientStarter';
import TS_PlayerControllerManager from '../../Controller/TS_PlayerControllerManager';
import TS_GameManager from '../TS_GameManager';

export enum TennisPlayerMotion{
    isForehandHit = "isForehandHit",
    isBackhandHit = "isBackhandHit"
}

export default class TS_PlayerController extends ZepetoScriptBehaviour {

    private zepetoCharacter : ZepetoCharacter = null;
    private animator : Animator = null;

    /* Values */
    private isInit : boolean = false;
    private isLocalPlayer : boolean = false;
    private sessionId : string = "";
    public get GetSesstionID() { return this.sessionId; }
    public currentCollBall : boolean = false;
    public currentCollBallObj : GameObject;

    /* Change Stat */
    private currentAccuracy : number = 1;
    private rightHandTennis : GameObject;
    private leftHandTennis : GameObject;


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Main Logic

    public Init(zepetoCharacter : ZepetoCharacter, isLocalPlayer : boolean, sessionId : string) {
        this.zepetoCharacter = zepetoCharacter;
        this.animator = this.zepetoCharacter.gameObject.GetComponentInChildren<Animator>();
        this.isLocalPlayer = isLocalPlayer;
        this.sessionId = sessionId;
        this.isInit = true;
        //console.log(`charaterOriginRunSpeed ${this.charaterOriginRunSpeed}`);
    }
 
    public UpPlayerSpeed(speedNum : number){
        this.zepetoCharacter.additionalRunSpeed = speedNum;
        console.log(`UpPlayerSpeed ${this.zepetoCharacter.RunSpeed}`);
    }

    public UpPlayerPower(powerNum : number){
        console.log(`UpPlayerPower ${powerNum}`);
    }

    public UpAccuracy(accuracyNum : number){
        console.log(`UpAccuracy ${accuracyNum}`);
    }

    public ResetBuff(){
        this.zepetoCharacter.additionalRunSpeed = 0;
        console.log(`ResetBuff ${this.zepetoCharacter.RunSpeed}`);
    }

    // touch ui -> call
    public HitBall(pos : Vector3){
        if(TS_GameManager.GetInstance().isGameStart == false) return; 
        if(this.currentCollBall){
            TS_GameManager.GetInstance().CheckCanHitBall(pos, false);
        }
        this.playPlayerHitAnimation(TS_ClientStarter.GetInstance().GetBall());
    }

    public playPlayerAnimation(tennisAni : string, isActive : boolean){
        console.log(`playPlayerAnimation ${tennisAni} ${isActive}`);
        switch(tennisAni){
            case TennisPlayerMotion.isForehandHit:
                this.animator.SetTrigger(TennisPlayerMotion.isForehandHit);
                break;
            case TennisPlayerMotion.isBackhandHit:
                this.animator.SetTrigger(TennisPlayerMotion.isBackhandHit);
                break;
        }
    }

    public setHandTennisObj(rightT : GameObject, leftT : GameObject)
    {
        this.rightHandTennis = rightT;
        this.leftHandTennis = leftT;
        this.leftHandTennis.SetActive(false);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 

    private playPlayerHitAnimation(ballPos : GameObject){
        let ballDir : Vector3 = ballPos.gameObject.transform.position - this.transform.position;
        if(ballDir.x > 0){
            TS_PlayerControllerManager.GetInstance().SendAnimationData(this.sessionId,TennisPlayerMotion.isForehandHit, true);
            //console.log(`forehand`);
        }else{
            TS_PlayerControllerManager.GetInstance().SendAnimationData(this.sessionId,TennisPlayerMotion.isBackhandHit, true);
            //console.log(`backhand`);
        }
    }
}