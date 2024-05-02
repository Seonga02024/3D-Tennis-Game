import { Texture } from 'UnityEngine';
import { GameObject } from 'UnityEngine';
import { RawImage } from 'UnityEngine.UI';
import { Text } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class TS_ScorePanel extends ZepetoScriptBehaviour {

    @Header("Game Score")
    @SerializeField()
    private mainPanel : GameObject;
    @SerializeField() private GameStartUI : GameObject;
    @SerializeField() private score1Text : Text;
    @SerializeField() private score2Text : Text;
    @SerializeField() private setScore1Text : Text;
    @SerializeField() private setScore2Text : Text;
    @SerializeField() private rountText : Text;
    @SerializeField() private matchText : Text;

    @Header("Player Info")
    @SerializeField() private player1Img : RawImage;
    @SerializeField() private player1Text : Text;
    @SerializeField() private player2Img : RawImage;
    @SerializeField() private player2Text : Text;
    @SerializeField() private myTurnText : Text;
    @SerializeField() private myTurnSeverText : Text;

    public ChangeMatchText(matchNum : number){
        this.matchText.text = "match " + matchNum.toString();
    }

    public ChangeScorePanel(setScore1 : number, setScore2 : number, score1 : number, score2 : number, round : number){
        this.score1Text.text = score1.toString();
        this.score2Text.text = score2.toString();
        this.setScore1Text.text = setScore1.toString();
        this.setScore2Text.text = setScore2.toString();
        this.rountText.text = round.toString() + " Round";

        if(score1 == 0 && score2 == 0 && round == 1){
            this.OnScorePanel(false);
            this.SetGamePlayerInfo(null, '', null, '');
        }else{
            this.OnScorePanel(true);
        }
    }

    public OnScorePanel(isActive : boolean){
        this.GameStartUI.SetActive(isActive);
    }

    public SetGamePlayerInfo(player1Profile : Texture, player1NickName : string, player2Profile : Texture, player2NickName : string){
        this.player1Img.texture = player1Profile;
        this.player1Text.text = player1NickName;
        this.player2Img.texture = player2Profile;
        this.player2Text.text = player2NickName;
    }

    public ChangeMyTurnText(num : number, num2 : number){
        if(this.myTurnText.text != num.toString()){
            this.myTurnText.text = "my turn : " + num.toString();
        }

        if(this.myTurnSeverText.text != num2.toString()){
            this.myTurnSeverText.text = "my sever turn : " + num2.toString();
        }
    }
}