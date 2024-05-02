import { GameObject } from 'UnityEngine';
import { Text } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class TS_GameFinishPanel extends ZepetoScriptBehaviour {

    @Header("Default")
    @SerializeField()
    private mainPanel : GameObject;
    @SerializeField() private winnerInfoTxt : Text;

    public OnWinnerPanel(isActive : boolean){
        this.mainPanel.SetActive(isActive);
    }

    public ChangeWinnerText(winnerSessionId : string){
        this.winnerInfoTxt.text = winnerSessionId + "님이 승리";
    }

}