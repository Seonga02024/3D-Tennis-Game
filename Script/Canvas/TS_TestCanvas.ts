import { GameObject, Time, WaitForSeconds } from 'UnityEngine';
import { Button, Text } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import TS_GameManager from '../System/TS_GameManager';
import TS_ClientStarter from '../TS_ClientStarter';

export default class TS_TestCanvas extends ZepetoScriptBehaviour {

    @Header("Default")
    @SerializeField()
    private mainPanel : GameObject;
    @SerializeField() private ballDataText : Text;

    @Header("FPS")
    @SerializeField() private FPSText : Text;
    @SerializeField() public hostText : GameObject; 

    @Header("Buff")
    @SerializeField() private buffUI : GameObject; 
    @SerializeField() private speedBuffBtn : Button; 
    @SerializeField() private powerBuffBtn : Button;
    @SerializeField() private accuracyBuffBtn : Button;
    @SerializeField() private resetbuff : Button; 

    @Header("Play Mode")
    @SerializeField() private modeUI : GameObject; 
    @SerializeField() private soloPlayBtn : Button; 
    @SerializeField() private dualPlayBtn : Button; 
    @SerializeField() private robotPlayNormalBtn : Button; 
    @SerializeField() private robotPlayHardBtn : Button; 
    @SerializeField() private modeText : Text;

    @Header("Game Ready")
    @SerializeField() private gameUI : GameObject; 
    @SerializeField() public gameStartBtn : Button; 
    @SerializeField() public gameStart1Btn : Button; 
    @SerializeField() public gameStart2Btn : Button; 
    @SerializeField() public gameNotReadyBtn : Button; 
    @SerializeField() public gameEndBtn : Button; 
    private deltaTime : number = 0;

    private Awake() {
        this.speedBuffBtn.onClick.AddListener(()=>{
            TS_GameManager.GetInstance().GetLocalPlayerController.UpPlayerSpeed(0.7);
        });
        this.powerBuffBtn.onClick.AddListener(()=>{
            //TS_GameManager.GetInstance().GetLocalPlayerController.UpPlayerPower(1.3);
            TS_ClientStarter.GetInstance().GetBallTS().speed = 0.4;
        });
        this.accuracyBuffBtn.onClick.AddListener(()=>{
            TS_GameManager.GetInstance().GetLocalPlayerController.UpAccuracy(10);
        });
        this.resetbuff.onClick.AddListener(()=>{
            TS_GameManager.GetInstance().GetLocalPlayerController.ResetBuff();
            TS_ClientStarter.GetInstance().GetBallTS().speed = 0.5;
        });
        this.soloPlayBtn.onClick.AddListener(()=>{
            this.OnSoloMode();
        });
        this.dualPlayBtn.onClick.AddListener(()=>{
            this.OnDualMode();
        });
        this.robotPlayNormalBtn.onClick.AddListener(()=>{
            this.OnRobotMode(false);
        });
        this.robotPlayHardBtn.onClick.AddListener(()=>{
            this.OnRobotMode(true);
        });
        this.gameStartBtn.onClick.AddListener(()=>{
            TS_ClientStarter.GetInstance().SendIsGameReady(true);
            this.gameStartBtn.gameObject.SetActive(false);
            this.StartCoroutine(this.WaitCoroutine(true));
        });
        this.gameStart1Btn.onClick.AddListener(()=>{
            TS_GameManager.GetInstance().isPlayer1 = true;
            TS_GameManager.GetInstance().GameStart();
            //TS_ClientStarter.GetInstance().SendIsGameReady(true);
        });
        this.gameStart2Btn.onClick.AddListener(()=>{
            TS_GameManager.GetInstance().isPlayer1 = false;
            TS_GameManager.GetInstance().GameStart();
            //TS_ClientStarter.GetInstance().SendIsGameReady(true);
        });
        this.gameNotReadyBtn.onClick.AddListener(()=>{
            TS_ClientStarter.GetInstance().SendIsGameReady(false);
            this.gameNotReadyBtn.gameObject.SetActive(false);
            this.StartCoroutine(this.WaitCoroutine(false));
        });
        this.gameEndBtn.onClick.AddListener(()=>{
            TS_ClientStarter.GetInstance().TestGameEnd();
        });
    }

    private waitForMoment : WaitForSeconds = new WaitForSeconds(2);

    private * WaitCoroutine(isReady : boolean){
        yield this.waitForMoment;
        if(isReady) this.gameNotReadyBtn.gameObject.SetActive(true);
        else this.gameStartBtn.gameObject.SetActive(true);
    }

    public OnSoloMode(){
        TS_ClientStarter.GetInstance().OnMode(true, false, false);
        this.modeText.text = "Solo Play";
    }

    public OnDualMode(){
        TS_ClientStarter.GetInstance().OnMode(false, true, false);
        this.modeText.text = "Dual Play";
    }

    public OnRobotMode(isHard : boolean){
        if(TS_ClientStarter.GetInstance().currentPlayers.size == 1){
            TS_ClientStarter.GetInstance().OnMode(false, false, true);
            if(isHard) TS_ClientStarter.GetInstance().GetBallTS().isTestRobotHard = true;
            else TS_ClientStarter.GetInstance().GetBallTS().isTestRobotHard = false;
            if(isHard) this.modeText.text = "Robot Hard Play";
            else this.modeText.text = "Robot Normal Play";
        }else{
            this.modeText.text = "혼자일 때만 가능";
        }
    }

    ////////////////////////////////////////////////////////////////////
    
    public SettingModeUI(isActive : boolean){
        this.modeUI.SetActive(isActive);
    }

    public SettingGameUI(isActive : boolean){
        if(isActive){
            this.gameStartBtn.gameObject.SetActive(true);
            this.gameNotReadyBtn.gameObject.SetActive(false);
        }
        this.gameUI.SetActive(isActive);
    }

    public ChangeBallDataText(num : number){
        this.ballDataText.text = "Send Ball Data \n" + num.toString();
    }

    ////////////////////////////////////////////////////////////////////

    private Update() {    
        this.ChangeFPSText();
    }

    // fps ui
    private ChangeFPSText(){
        this.deltaTime += (Time.deltaTime - this.deltaTime) * 0.1;
        let msec = this.deltaTime * 1000.0;
        let fps = 1.0 / this.deltaTime;
        this.FPSText.text = msec.toFixed(1) + " ms (" + fps.toFixed() + " fps)";
    }

}