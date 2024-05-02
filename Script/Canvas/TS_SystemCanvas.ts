import { Canvas, GameObject } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import TS_TestCanvas from './TS_TestCanvas';
import TS_ScorePanel from './TS_ScorePanel';
import TS_TimePanel from './TS_TimePanel';
import TS_GameFinishPanel from './TS_GameFinishPanel';

export default class TS_SystemCanvas extends ZepetoScriptBehaviour {

    @Header("Default")
    @SerializeField()
    private canvas : Canvas;

    @Header("[Basic UI]")
    @SerializeField()
    private basicIconPanel : GameObject;

    @Header("[Game UI]")
    @SerializeField()
    private testPanel : GameObject;
    @SerializeField()
    private scorePanel : GameObject;
    @SerializeField()
    private timePanel : GameObject;
    @SerializeField()
    private gameFinishPanel : GameObject;

    /* Instances */
    // basic ui
    //private basicIconPanelTS : TS_BasicIconPanel = null;
    // game ui
    private testPanelTS : TS_TestCanvas = null;
    private scorePanelTS : TS_ScorePanel = null;
    private timePanelTS : TS_TimePanel = null;
    private gameFinishPanelTS : TS_GameFinishPanel = null;

    /* Singleton */
    private static Instance: TS_SystemCanvas;
    public static GetInstance(): TS_SystemCanvas {
        if (!TS_SystemCanvas.Instance) {
            const targetObj = GameObject.Find("SystemCanvas");
            if (targetObj)
                TS_SystemCanvas.Instance = targetObj.GetComponent<TS_SystemCanvas>();
        }
        return TS_SystemCanvas.Instance;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Main Logic

    // // basic ui
    // public GetBasicIconPanel() : TS_BasicIconPanel {
    //     if(this.basicIconPanelTS == null) {
    //         this.basicIconPanelTS = this.basicIconPanel.GetComponent<TS_BasicIconPanel>();
    //     }
    //     return this.basicIconPanelTS;
    // }

    public GetTestPanel() : TS_TestCanvas {
        if(this.testPanelTS == null) {
            this.testPanelTS = this.testPanel.GetComponent<TS_TestCanvas>();
        }
        return this.testPanelTS;
    }

    public GetScorePanel() : TS_ScorePanel {
        if(this.scorePanelTS == null) {
            this.scorePanelTS = this.scorePanel.GetComponent<TS_ScorePanel>();
        }
        return this.scorePanelTS;
    }

    public GetTimePanel() : TS_TimePanel {
        if(this.timePanelTS == null) {
            this.timePanelTS = this.timePanel.GetComponent<TS_TimePanel>();
        }
        return this.timePanelTS;
    }

    public GetGameFinishPanel() : TS_GameFinishPanel {
        if(this.gameFinishPanelTS == null) {
            this.gameFinishPanelTS = this.gameFinishPanel.GetComponent<TS_GameFinishPanel>();
        }
        return this.gameFinishPanelTS;
    }

}