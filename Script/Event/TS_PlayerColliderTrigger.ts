import { Collider } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import TS_PlayerController from '../System/Player/TS_PlayerController';

// Ensure that the ball is within the player hit range
export default class TS_PlayerColliderTrigger extends ZepetoScriptBehaviour {

    public playerControllerTS : TS_PlayerController;
    
    private OnTriggerStay(coll : Collider){
        if(coll.CompareTag("Ball")){
            if(this.playerControllerTS != null){
                this.playerControllerTS.currentCollBall = true;
                this.playerControllerTS.currentCollBallObj = coll.gameObject;
            }
        }
    }

    private OnTriggerExit(coll : Collider){
        if(coll.CompareTag("Ball")){
            if(this.playerControllerTS != null){
                this.playerControllerTS.currentCollBall = false;
                this.playerControllerTS.currentCollBallObj = null;
            }
        }
    }
}