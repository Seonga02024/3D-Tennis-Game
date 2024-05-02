import { RectTransform } from 'UnityEngine';
import { Vector2 } from 'UnityEngine';
import { WaitForSeconds } from 'UnityEngine';
import { Coroutine, GameObject } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { Image } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import TS_Text from '../Data/TS_Text';
import TS_UIText from '../Text/TS_UIText';
import { Text } from 'UnityEngine.UI';

export default class TS_TitlePanel extends ZepetoScriptBehaviour {

    @Header("[Default]")
    @SerializeField()
    private titlePanel : GameObject;
    @SerializeField()
    private mainImg : Image;
    @SerializeField()
    private offButton : Button;
    @SerializeField()
    private offButtonTxt : Text;

    private timeOver : boolean = false;

    /* Const Values */
    private readonly WAIT_TIME : number = 4;

    /* Coroutine */
    private waitCoroutine : Coroutine = null;

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Event Function

    private Start() {
        this.offButton.onClick.AddListener(() => {
            // if time over
            if(this.timeOver) {
                this.titlePanel.SetActive(false);
            }
        });
        // set title image
        this.SetTitleImageSize();
        // set title text
        this.UpdateEnterBtnLanguage();
        // loading effect
        this.waitCoroutine = this.StartCoroutine(this.WaitCoroutine());
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Title

    private SetTitleImageSize() {
        let width : number = this.titlePanel.GetComponent<RectTransform>().rect.width;
        this.mainImg.GetComponent<RectTransform>().sizeDelta = new Vector2(width, width);
    }

    private * WaitCoroutine() {
        yield new WaitForSeconds(this.WAIT_TIME);
        this.timeOver = true;
    }

    private UpdateEnterBtnLanguage() {
        this.offButtonTxt.text = TS_UIText.titlePanel.get(TS_Text.GetInstance().CurLanguage)[0];
    }

}