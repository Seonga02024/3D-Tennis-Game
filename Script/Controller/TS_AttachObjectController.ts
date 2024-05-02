import { Transform, WaitForSeconds } from 'UnityEngine';
import { Object } from 'UnityEngine';
import { Animator, GameObject, HumanBodyBones } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import TS_PlayerControllerManager from './TS_PlayerControllerManager';
import TS_ClientStarter from '../TS_ClientStarter';

export default class TS_AttachObjectController extends ZepetoScriptBehaviour {

    // The object prefab to be attached on the body.
    public tennisRight: GameObject;
    public tennisLeft: GameObject;
    // The bone to attach the object to.
    public bodyBone1: HumanBodyBones;
    public bodyBone2: HumanBodyBones;

    private _localCharacter: ZepetoCharacter;

    /* Timer */
    private waitForWait : WaitForSeconds = new WaitForSeconds(3);

    Start() {
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this._localCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
            const animator: Animator = this._localCharacter.ZepetoAnimator;
            const bone1: Transform = animator.GetBoneTransform(this.bodyBone1);
            let rightT = Object.Instantiate(this.tennisRight, bone1) as GameObject;
            const bone2: Transform = animator.GetBoneTransform(this.bodyBone2);
            let leftT = Object.Instantiate(this.tennisLeft, bone2) as GameObject;
            this.StartCoroutine(this.SetPlayerTennisObj(TS_ClientStarter.GetInstance().player.sessionId, rightT, leftT));
          
        });
        // 다른 Player 추가
        ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId:string) => {
            if(sessionId != TS_ClientStarter.GetInstance().player.sessionId){
                const mPlayer : ZepetoCharacter = ZepetoPlayers.instance.GetPlayer(sessionId).character;
                const animator: Animator = mPlayer.ZepetoAnimator;
                const bone1: Transform = animator.GetBoneTransform(this.bodyBone1);
                let rightT = Object.Instantiate(this.tennisRight, bone1) as GameObject;
                const bone2: Transform = animator.GetBoneTransform(this.bodyBone2);
                let leftT = Object.Instantiate(this.tennisLeft, bone2) as GameObject;
                this.StartCoroutine(this.SetPlayerTennisObj(sessionId, rightT, leftT));
            }
        });
    }

    private * SetPlayerTennisObj(sessionId : string, rightT : GameObject, leftT : GameObject)
    {
        yield this.waitForWait;
        TS_PlayerControllerManager.GetInstance().GetPlayerController(sessionId).setHandTennisObj(rightT, leftT);
    }

}