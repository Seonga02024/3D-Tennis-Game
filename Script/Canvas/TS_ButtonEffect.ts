import { Color, Vector3 } from 'UnityEngine';
import { Image } from 'UnityEngine.UI';
import { ZepetoScreenButton } from 'ZEPETO.Character.Controller'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class TS_ButtonEffect extends ZepetoScriptBehaviour {

    @Header("Default")
    @SerializeField()
    private onClickChangeScale : boolean = true;
    @SerializeField()
    private onClickChangeColor : boolean = true;
    @SerializeField()
    private btnImages : Image[];
    @SerializeField()
    private zepetoScreenBtn : ZepetoScreenButton;

    @Header("Custom Color")
    @SerializeField()
    private isUseCustomColor : boolean = false;
    @SerializeField()
    private customColor : Color = new Color(200 / 255, 200 / 255, 200 / 255, 255 / 255);

    /* Const Values */
    private readonly NORMAL_COLOR : Color = new Color(255 / 255, 255 / 255, 255 / 255, 255 / 255);
    private readonly PRESSED_COLOR : Color = new Color(229 / 255, 51 / 255, 137 / 255, 255 / 255);
    private readonly NORMAL_SCALE : Vector3 = Vector3.one;
    private readonly PRESSED_SCALE : Vector3 = new Vector3(1.15, 1.15, 1.15);

    private Awake() {
        this.zepetoScreenBtn.OnPointDownEvent.AddListener(()=>{
            if(this.onClickChangeColor == true) {
                if(this.isUseCustomColor == false) {
                    this.btnImages.forEach(btnImage => {
                        btnImage.color = this.PRESSED_COLOR;
                    });
                }
                else {
                    this.btnImages.forEach(btnImage => {
                        btnImage.color = this.customColor;
                    });
                }
            }
            if(this.onClickChangeScale == true) {
                this.btnImages.forEach(btnImage => {
                    btnImage.rectTransform.localScale = this.PRESSED_SCALE;
                });
            }
        });
        this.zepetoScreenBtn.OnPointUpEvent.AddListener(()=>{
            if(this.onClickChangeColor == true) {
                this.btnImages.forEach(btnImage => {
                    btnImage.color = this.NORMAL_COLOR;
                });
            }
            if(this.onClickChangeScale == true) {
                this.btnImages.forEach(btnImage => {
                    btnImage.rectTransform.localScale = this.NORMAL_SCALE;
                });
            }
        });
    }

}