import { GameObject, Texture } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import TS_PlayerController, { TennisPlayerMotion } from '../System/Player/TS_PlayerController';
import { Room } from 'ZEPETO.Multiplay';
import { Users, ZepetoWorldMultiplay } from 'ZEPETO.World';
import { ZepetoCharacter } from 'ZEPETO.Character.Controller';
import { ZepetoWorldHelper } from 'ZEPETO.World';
import TS_SystemCanvas from '../Canvas/TS_SystemCanvas';

class AnimationData{
    sessionId : string;
    animationName : string;
    isActive : boolean;
}

export type PlayerInfo = {
    nickName : string;
    userId : string;
    profile : Texture;
}


export default class TS_PlayerControllerManager extends ZepetoScriptBehaviour {

    @Header("Default")
    @SerializeField()
    public multiplay : ZepetoWorldMultiplay;
    private room : Room = null;
    private playerControllers : Map<string, TS_PlayerController> = new Map<string, TS_PlayerController>();

    /* Values */
    private playerInfos : Map<string, PlayerInfo> = new Map<string, PlayerInfo>();

    /* Singleton */
    private static Instance: TS_PlayerControllerManager;
    public static GetInstance(): TS_PlayerControllerManager {
        if (!TS_PlayerControllerManager.Instance) {
            const targetObj = GameObject.Find("PlayerControllerManager");
            if (targetObj)
                TS_PlayerControllerManager.Instance = targetObj.GetComponent<TS_PlayerControllerManager>();
        }
        return TS_PlayerControllerManager.Instance;
    }

    Start() {    
        this.multiplay.RoomCreated += (room:Room) => {
            this.room = room;
            room.AddMessageHandler<AnimationData>("SendAnimationDataToSever", message => {
                //console.log(`SendAnimationDataToSever 1`);
                let playerController = this.GetPlayerController(message.sessionId);
                if(playerController && message.animationName != null && message.isActive != null) {
                    //console.log(`SendAnimationDataToSever 2`);
                    playerController.playPlayerAnimation(message.animationName, message.isActive);
                }
            });
        }
    }

    ////////////////////////////////////////////////////////////

    public GetPlayerController(sessionId : string) {
        return this.playerControllers.get(sessionId);
    }

    public SetPlayerController(sessionId : string, playerController : TS_PlayerController){
        // add player controller
        this.playerControllers.set(sessionId, playerController);
    }

    public AddPlayerInfo(sessionId : string, userId : string) {
        console.log(`AddPlayerInfo ${sessionId} ${userId}`);
        this.playerInfos.set(sessionId, { 
            nickName : "",
            userId : userId,
            profile : null
        });
        // add nick name
        let ids: string[] = [userId];
        ZepetoWorldHelper.GetUserInfo(ids, (info: Users[]) => {
            this.playerInfos.get(sessionId).nickName = info[0].name;
        }, (error) => {
            console.log(error);
        });
        // add profile texture
        ZepetoWorldHelper.GetProfileTexture(userId, (texture: Texture) => {
            this.playerInfos.get(sessionId).profile = texture;
        }, (error) => {
            this.playerInfos.get(sessionId).profile = null;
        });
    }

    public SetGamePlayerInfo(player1SessionId : string, player2SessionId : string){
        console.log(`SetGamePlayerInfo ${player1SessionId} ${player2SessionId}`);
        let player1Info = this.playerInfos.get(player1SessionId);
        let player2Info = this.playerInfos.get(player2SessionId);
        if(player1Info && player2Info){
            console.log(`SetGamePlayerInfo setting`);
            TS_SystemCanvas.GetInstance().GetScorePanel().SetGamePlayerInfo(player1Info.profile, player1Info.nickName, player2Info.profile, player2Info.nickName);
        }
    }

    public SetWinnerInfo(winnerSessionId : string){
        console.log(`SetWinnerInfo ${winnerSessionId}`);
        let winnerName = this.playerInfos.get(winnerSessionId);
        if(winnerName){
            console.log(`SetWinnerInfo setting`);
            TS_SystemCanvas.GetInstance().GetGameFinishPanel().ChangeWinnerText(winnerName.nickName);
        }
    }

    ////////////////////////////////////////////////////////////

    public SendAnimationData(sessionId : string, tennisAni : TennisPlayerMotion, bool : boolean) {
        const data = new AnimationData();
        data.sessionId = sessionId;
        data.animationName = tennisAni;
        data.isActive = bool;
        this.room.Send("SendAnimationData", data);
    }
}