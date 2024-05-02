import { GameObject } from 'UnityEngine';
import { Text } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class TS_TimePanel extends ZepetoScriptBehaviour {

    @Header("Default")
    @SerializeField()
    private mainPanel : GameObject;
    @SerializeField() private timeTxt : Text;

    public OnTimePanel(isActive : boolean){
        this.mainPanel.SetActive(isActive);
    }

    public ChangeTimeText(num : number){
        this.timeTxt.text = num.toString();
    }

}