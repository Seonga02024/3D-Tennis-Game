import {Canvas, GameObject, Input, Mathf, Quaternion, Screen, Transform, Vector2, Vector3 } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import TS_GameManager from '../System/TS_GameManager';
import { ZepetoScreenButton, ZepetoScreenTouchpad } from 'ZEPETO.Character.Controller';
import { RectTransform } from 'UnityEngine';
import { Image } from 'UnityEngine.UI';


export default class TS_TouchCanvas2 extends ZepetoScriptBehaviour {

    @Header("Default")
    @SerializeField()
    private canvas : Canvas;
    @SerializeField()
    private moveTouchBtn : ZepetoScreenTouchpad;
    @SerializeField()
    private lineImg : Image;
    @SerializeField()
    private hitImg : GameObject;
    private isHitBtnDown : boolean = false;
    private hitLineStartPos : Vector2;

    @Header("Hit Button")
    @SerializeField()
    private hitBtn : ZepetoScreenButton;
    @SerializeField()
    private edge1 : Transform;
    @SerializeField()
    private edge2 : Transform;
    @SerializeField()
    private edge3 : Transform;
    @SerializeField()
    private edge4 : Transform;
    @SerializeField()
    private uiRectangle : RectTransform; 
    @SerializeField()
    private tennisUI : GameObject; 

    //////////////////////////////////////////////////////////////

    private Awake() {
        this.canvas.planeDistance = 1;

        // Hit Start
        this.hitBtn.OnPointDownEvent.AddListener(()=>{
            this.tennisUI.SetActive(true);
            this.lineImg.gameObject.SetActive(true);

            // if found coordinates, prepare to hit
            if(this.FindHitButtonPressPos() != null){
                let touchS = this.FindHitButtonPressPos();
                //this.hitLineStartPos = touchS.position;
                this.hitLineStartPos = new Vector2(this.hitImg.transform.position.x, this.hitImg.transform.position.y);
                //this.lineImg.transform.position = new Vector3(touchS.position.x, touchS.position.y, 0);
                this.lineImg.transform.position = new Vector3(this.hitLineStartPos.x, this.hitLineStartPos.y, 0);
                this.isHitBtnDown = true;
            }
        });

        // Hit End
        this.hitBtn.OnPointUpEvent.AddListener(()=>{
            this.isHitBtnDown = false;
            this.tennisUI.SetActive(false);
            this.lineImg.gameObject.SetActive(false);

            if(Input.touchCount != 0){ 
                //console.log(`=========================================`);

                if(this.FindHitButtonPressPos() == null) return;

                // caluate the parecentage of ball pos from the tennis ui image 
                let rectangleSize : Vector2 = this.uiRectangle.rect.size;
                let touchChange : Vector2 = new Vector2(this.FindHitButtonPressPos().position.x - this.edge3.position.x, this.FindHitButtonPressPos().position.y - this.edge3.position.y);
                //console.log(`touchChange 1 : ${touchChange.x} ${touchChange.y}`);

                if(touchChange.x < 0) touchChange.x = touchChange.x * -1;
                //console.log(`touchChange 2 : ${touchChange.x} ${touchChange.y}`);

                let clickRatio  : Vector2 = new Vector2(touchChange.x / rectangleSize.x, touchChange.y / rectangleSize.y);
                //console.log(`touchChange clickRatio : ${clickRatio.x} ${clickRatio.y}`);

                let targetPos : Vector3 = TS_GameManager.GetInstance().CaluatePos(clickRatio.x, clickRatio.y);
                if(TS_GameManager.GetInstance().GetLocalPlayerController != null) {
                    // Hand over found rate values
                    TS_GameManager.GetInstance().GetLocalPlayerController.HitBall(targetPos);
                }
            }
        });
        // If player move and stop, look at the tennis
        this.moveTouchBtn.OnPointerUpEvent.AddListener(()=>{
            //console.log(`charater move stop`);
            TS_GameManager.GetInstance().playerMoveStopAndDirNet();
        });
    }

    private Update(){
        // While the player presses the hit button
        if(this.isHitBtnDown){
            if(Input.touchCount > 0){
                // Draw an arrow
                if(this.FindHitButtonPressPos() != null){
                    this.lineImg.transform.localScale = new Vector3(Vector2.Distance(this.FindHitButtonPressPos().position, this.hitLineStartPos), 1, 0);
                    this.lineImg.transform.localRotation = Quaternion.Euler(0, 0, this.AngleInDeg(this.hitLineStartPos, this.FindHitButtonPressPos().position));
                }else{
                    this.isHitBtnDown = false;
                    this.lineImg.gameObject.SetActive(false);
                }
            }
        }

        if(Input.touchCount == 0 || (Input.touchCount == 1 && this.FindHitButtonPressPos() == null)){
            this.tennisUI.SetActive(false);
            this.lineImg.gameObject.SetActive(false);
        }
    }

    ///////////////////////////////////////////////////////////////////////

    private FindHitButtonPressPos(){
        let checkHitBtnDown = false;
        let touchE = Input.GetTouch(0);
        for(let num = 0; num < Input.touchCount; num++){
            let touchPos = Input.GetTouch(num);
            //console.log(`touchPos : ${touchPos.position.x} ${touchPos.position.y}`);
            if(touchPos.position.x >= (Screen.width/2)){
                checkHitBtnDown = true;
                touchE = touchPos;
            }
        }

        if(checkHitBtnDown) return touchE;
        else return null;
    }

    private AngleInRad(vec1 : Vector2, vec2 : Vector2) : number
    {
        return Mathf.Atan2(vec2.y - vec1.y, vec2.x - vec1.x);
    }

    private AngleInDeg(vec1 : Vector2, vec2 : Vector2) : number
    {
        return this.AngleInRad(vec1, vec2) * 180 / Mathf.PI;
    }

}