import { AsyncOperation, GameObject } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { SceneType } from '../Data/SystemData';
import { LoadSceneMode, SceneManager } from 'UnityEngine.SceneManagement';

export default class TS_SceneManager extends ZepetoScriptBehaviour {

    /* Values */
    private curScene : SceneType = SceneType.None;

    /* Singleton */
    private static Instance: TS_SceneManager;
    public static GetInstance(): TS_SceneManager {
        if (!TS_SceneManager.Instance) {
            const targetObj = GameObject.Find("SceneManager");
            if (targetObj)
            TS_SceneManager.Instance = targetObj.GetComponent<TS_SceneManager>();
        }
        return TS_SceneManager.Instance;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Main Logic

    public Load(sceneType : SceneType, callback : () => void) {
        // set cur scene
        this.curScene = sceneType;
        // load scene
        this.StartCoroutine(this.loadProgress(sceneType, callback));
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Load

    private * loadProgress(sceneType : SceneType, callback : () => void) {
        let asyncOp : AsyncOperation = SceneManager.LoadSceneAsync(sceneType, LoadSceneMode.Additive);
        while(!asyncOp.isDone) { // 해당 동작이 준비되었는지 여부
            yield null;
        }
        callback();
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
}